import os
import sys
import time
import json
import logging
import argparse
import asyncio
import websockets
import cv2
import numpy as np
import torch
import easyocr
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="[ANPR-YOLO-ENGINE] %(asctime)s - %(message)s")

parser = argparse.ArgumentParser(description="Pratyaksha YOLO Tensor Core ANPR Engine")
parser.add_argument("--device", type=str, default="gpu", choices=["gpu", "cpu"])
args, unknown = parser.parse_known_args()

TARGET_DEVICE = args.device.lower()
USE_GPU = torch.cuda.is_available() if TARGET_DEVICE == "gpu" else False

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "roi_config.json")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static", "captures")
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "runs", "pratyaksha_anpr_yolo", "weights", "best.pt")

# Fallback to YOLOv8s pretrained if custom weights do not exist yet
if not os.path.exists(WEIGHTS_PATH):
    WEIGHTS_PATH = "yolov8s.pt"

os.makedirs(STATIC_DIR, exist_ok=True)
WS_URL = "ws://127.0.0.1:8005/api/v1/ws/events"
RTSP_URL = "rtsp://admin:surya@321@192.168.100.229:554/profile1"

logging.info(f"Loading YOLO Model [{WEIGHTS_PATH}] on device: {'cuda:0' if USE_GPU else 'cpu'}...")
yolo_model = YOLO(WEIGHTS_PATH)
if USE_GPU:
    yolo_model.to('cuda:0')

logging.info(f"Initializing EasyOCR Engine (gpu={USE_GPU})...")
ocr_reader = easyocr.Reader(['en'], gpu=USE_GPU)

def load_camera_roi_config(cam_name="ANPR_TEST_C1"):
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)
                return data.get(f"{cam_name}:Traffic - ANPR & ATCC", None)
        except Exception:
            pass
    return None

def preprocess_and_ocr(crop_img):
    gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    scaled = cv2.resize(enhanced, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

    results = ocr_reader.readtext(scaled)
    for (_, text, prob) in results:
        clean = "".join(e for e in text if e.isalnum()).upper()
        if len(clean) >= 4 and prob > 0.25:
            return clean, float(prob)
    return "NO PLATE DETECTED", 0.00

async def run_yolo_anpr_engine():
    logging.info(f"Connecting to RTSP Feed: {RTSP_URL}")
    cap = cv2.VideoCapture(RTSP_URL)

    if not cap.isOpened():
        logging.error("RTSP Connection Failed.")
        return

    last_trigger_time = 0

    while True:
        try:
            async with websockets.connect(WS_URL) as ws:
                logging.info(f"Connected to Pratyaksha Event Relay [YOLO Tensor-Core]")

                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        await asyncio.sleep(0.5)
                        cap = cv2.VideoCapture(RTSP_URL)
                        continue

                    now = time.time()
                    img_h, img_w, _ = frame.shape

                    # Run YOLO Inference with Tensor Cores
                    results = yolo_model.predict(
                        source=frame, 
                        conf=0.40, 
                        device=0 if USE_GPU else 'cpu', 
                        verbose=False
                    )[0]

                    for box in results.boxes:
                        cls_id = int(box.cls[0])
                        v_class = yolo_model.names[cls_id]
                        
                        # Map generic COCO labels to standardized classes if using base yolov8s.pt
                        class_mapping = {
                            "car": "Car", "truck": "Truck", "bus": "Bus",
                            "motorbike": "Bike", "motorcycle": "Bike"
                        }
                        v_class = class_mapping.get(v_class.lower(), v_class.capitalize())

                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        box_w, box_h = x2 - x1, y2 - y1

                        # Apply 15% Crop Padding
                        pad_w = int(box_w * 0.15)
                        pad_h = int(box_h * 0.15)
                        crop_x1 = max(0, x1 - pad_w)
                        crop_y1 = max(0, y1 - pad_h)
                        crop_x2 = min(img_w, x2 + pad_w)
                        crop_y2 = min(img_h, y2 + pad_h)

                        vehicle_crop = frame[crop_y1:crop_y2, crop_x1:crop_x2]
                        cy = y1 + (box_h // 2)

                        # Trigger condition across main lane
                        if (int(img_h * 0.30) < cy < int(img_h * 0.80)) and (now - last_trigger_time > 3.5):
                            plate_text, conf = preprocess_and_ocr(vehicle_crop)
                            last_trigger_time = now

                            snap_filename = f"capture_{int(now*1000)}.jpg"
                            crop_filename = f"crop_{int(now*1000)}.jpg"
                            snap_path = os.path.join(STATIC_DIR, snap_filename)
                            crop_path = os.path.join(STATIC_DIR, crop_filename)

                            cv2.imwrite(snap_path, frame)
                            cv2.imwrite(crop_path, vehicle_crop)

                            timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S IST", time.localtime(now))
                            unique_id = f"evt_{int(now*1000)}"

                            event_payload = {
                                "id": unique_id,
                                "app": "Traffic - ANPR & ATCC",
                                "appModule": "Traffic - ANPR & ATCC",
                                "cam": "ANPR_TEST_C1",
                                "camName": "ANPR_TEST_C1",
                                "class": v_class,
                                "vehicleType": v_class,
                                "plateNumber": plate_text,
                                "data": plate_text,
                                "direction": "IN",
                                "confidence": conf,
                                "time": timestamp_str,
                                "timestamp": timestamp_str,
                                "timestamp_epoch": now,
                                "syncStatus": "Sent to Cloud",
                                "device": TARGET_DEVICE.upper(),
                                "bbox": {
                                    "top": f"{(crop_y1 / img_h) * 100:.1f}%",
                                    "left": f"{(crop_x1 / img_w) * 100:.1f}%",
                                    "width": f"{((crop_x2 - crop_x1) / img_w) * 100:.1f}%",
                                    "height": f"{((crop_y2 - crop_y1) / img_h) * 100:.1f}%"
                                },
                                "snapshotUrl": f"http://192.168.100.96:8005/static/captures/{snap_filename}",
                                "cropUrl": f"http://192.168.100.96:8005/static/captures/{crop_filename}"
                            }

                            logging.info(f"YOLO CAPTURE -> {v_class} | OCR: {plate_text}")
                            await ws.send(json.dumps(event_payload))
                            break

                    await asyncio.sleep(0.03)

        except Exception as e:
            logging.warning(f"YOLO Engine loop exception: {e}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(run_yolo_anpr_engine())
