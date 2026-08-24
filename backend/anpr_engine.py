import os
import sys
import cv2
import json
import time
import argparse
import asyncio
import re
import websockets
import torch
import numpy as np
from ultralytics import YOLO
import easyocr

parser = argparse.ArgumentParser()
parser.add_argument("--device", type=str, default="gpu")
args = parser.parse_args()

USE_GPU = args.device.lower() == "gpu" and torch.cuda.is_available()
DEVICE = "cuda:0" if USE_GPU else "cpu"
print(f"[ANPR-PROD-ENGINE] Initializing Corrected Class Mapping Engine on {DEVICE.upper()}")

model = YOLO("yolov8s.pt")
model.to(DEVICE)

reader = easyocr.Reader(['en'], gpu=USE_GPU)

# CORRECT COCO CLASS MAP:
# 1: Bicycle, 3: Motorcycle (Bike/Scooter), 2: Car, 5: Bus, 7: Truck
VEHICLE_CLASSES = {
    1: "Bike",
    3: "Bike",
    2: "Car",
    5: "Bus",
    7: "Truck"
}

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "roi_config.json")
APP_CAMERAS_FILE = os.path.join(os.path.dirname(__file__), "app_camera_mappings.json")

def is_camera_mapped_to_app(cam_name, app_name):
    if os.path.exists(APP_CAMERAS_FILE):
        try:
            with open(APP_CAMERAS_FILE, "r") as f:
                mappings = json.load(f)
                return cam_name in mappings.get(app_name, [])
        except Exception:
            return True
    return True

def get_tripwire_config(cam_name, app_name):
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                configs = json.load(f)
                return configs.get(f"{cam_name}:{app_name}", None)
        except Exception:
            return None
    return None

def extract_real_ocr_plate(crop_img, vtype):
    if crop_img is None or crop_img.size == 0:
        return "NO PLATE DETECTED"
    try:
        h, w = crop_img.shape[:2]
        
        # If vehicle is a Bike, narrow optical crop to the bottom half (where the license plate is mounted)
        if vtype == "Bike" and h > 40:
            crop_img = crop_img[int(h * 0.4):, :]

        gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        
        results = reader.readtext(gray, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        if not results:
            return "NO PLATE DETECTED"
            
        results.sort(key=lambda x: x[2], reverse=True)
        raw_text = results[0][1]
        clean_text = re.sub(r'[^A-Z0-9]', '', raw_text.upper())
        return clean_text if len(clean_text) >= 4 else "NO PLATE DETECTED"
    except Exception:
        return "NO PLATE DETECTED"

def check_line_intersection(box, tripwire, img_w, img_h):
    if not tripwire or "coordinates" not in tripwire:
        return True
    coords = tripwire.get("coordinates", {})
    if "pointA" not in coords or "pointB" not in coords:
        return True

    pA, pB = coords["pointA"], coords["pointB"]
    ax, ay = int((pA["x"] / 100) * img_w), int((pA["y"] / 100) * img_h)
    bx, by = int((pB["x"] / 100) * img_w), int((pB["y"] / 100) * img_h)

    x1, y1, x2, y2 = box
    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

    line_vec = np.array([bx - ax, by - ay])
    pt_vec = np.array([cx - ax, cy - ay])
    line_len = np.linalg.norm(line_vec)

    if line_len == 0:
        return True

    line_unit = line_vec / line_len
    proj_len = np.dot(pt_vec, line_unit)

    if proj_len < 0 or proj_len > line_len:
        return False

    perp_dist = np.linalg.norm(pt_vec - proj_len * line_unit)
    return perp_dist < 40

async def process_stream():
    uri = "ws://localhost:8005/api/v1/ws/events"
    cam_name = "ANPR_TEST_C1"
    app_name = "Traffic - ANPR & ATCC"
    rtsp_url = "rtsp://192.168.100.229:554/profile1"

    cap = cv2.VideoCapture(rtsp_url)

    while True:
        try:
            if not is_camera_mapped_to_app(cam_name, app_name):
                await asyncio.sleep(5)
                continue

            async with websockets.connect(uri) as ws:
                frame_count = 0

                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        cap.open(rtsp_url)
                        await asyncio.sleep(2)
                        continue

                    frame_count += 1
                    if frame_count % 6 != 0:
                        await asyncio.sleep(0.01)
                        continue

                    h, w, _ = frame.shape
                    tripwire_cfg = get_tripwire_config(cam_name, app_name)
                    results = model.track(frame, persist=True, device=DEVICE, verbose=False)[0]

                    for box in results.boxes:
                        cls_id = int(box.cls[0])
                        if cls_id in VEHICLE_CLASSES:
                            vtype = VEHICLE_CLASSES[cls_id]
                            box_coords = list(map(int, box.xyxy[0]))

                            if not check_line_intersection(box_coords, tripwire_cfg, w, h):
                                continue

                            x1, y1, x2, y2 = box_coords
                            crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                            
                            # Extract OCR with vehicle-specific crop logic
                            ocr_text = extract_real_ocr_plate(crop, vtype)

                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 180), 2)
                            cv2.putText(frame, f"{vtype}: {ocr_text}", (x1, max(20, y1 - 10)),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 180), 2)

                            evt_id = f"evt_{int(time.time()*1000)}"
                            snap_name = f"{evt_id}.jpg"
                            snap_path = os.path.join(os.path.dirname(__file__), "static", "captures", snap_name)
                            cv2.imwrite(snap_path, frame)

                            payload = {
                                "id": evt_id,
                                "appModule": app_name,
                                "class": vtype,
                                "vehicleType": vtype,
                                "data": ocr_text,
                                "plateNumber": ocr_text,
                                "direction": tripwire_cfg.get("direction", "IN") if tripwire_cfg else "IN",
                                "camName": cam_name,
                                "time": time.strftime("%Y-%m-%d %H:%M:%S IST"),
                                "timestamp_epoch": time.time(),
                                "snapshotUrl": f"http://192.168.100.96:8005/static/captures/{snap_name}"
                            }
                            await ws.send(json.dumps(payload))
                            await asyncio.sleep(0.8)

        except Exception as e:
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(process_stream())
