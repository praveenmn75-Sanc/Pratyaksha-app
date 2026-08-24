import cv2
import time
import requests
import threading
import logging
import numpy as np
from ultralytics import YOLO

# Initialize OCR Engine
try:
    import easyocr
    ocr_reader = easyocr.Reader(['en'], gpu=False)
except Exception:
    ocr_reader = None

API_ENDPOINT = "http://localhost:8005/api/v1/events/simulate"
TOGGLES_ENDPOINT = "http://localhost:8005/api/v1/camera-toggles"

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")

# Load Production YOLOv8 Model (Pre-trained on COCO for Car, Truck, Bus, Motorbike, Person)
model = YOLO("yolov8n.pt") 

# COCO Class Mappings
VEHICLE_CLASSES = {2: 'CAR', 3: 'MOTORCYCLE', 5: 'BUS', 7: 'TRUCK'}
PERSON_CLASS = 0

class RealAIEngineWorker(threading.Thread):
    def __init__(self, cam_id, cam_name, rtsp_url, ai_module):
        super().__init__()
        self.cam_id = cam_id
        self.cam_name = cam_name
        self.rtsp_url = rtsp_url
        self.ai_module = ai_module
        self.running = True
        self.last_trigger_time = 0

    def is_app_enabled(self):
        try:
            res = requests.get(TOGGLES_ENDPOINT, timeout=1)
            if res.status_code == 200:
                toggles = res.json()
                key = f"{self.cam_name}:{self.ai_module}"
                return toggles.get(key, True)
        except Exception:
            pass
        return True

    def perform_ocr_on_crop(self, cropped_img):
        if ocr_reader is None or cropped_img is None or cropped_img.size == 0:
            return "NONE"
        try:
            results = ocr_reader.readtext(cropped_img)
            text_acc = []
            for bbox, text, prob in results:
                clean = "".join(ch for ch in text if ch.isalnum()).upper()
                if len(clean) >= 4 and prob > 0.35:
                    text_acc.append(clean)
            return "".join(text_acc) if text_acc else "NONE"
        except Exception as e:
            logging.error(f"OCR Exception: {e}")
            return "NONE"

    def dispatch_alert(self, detection_class, event_data, bbox, tags):
        payload = {
            "id": str(int(time.time() * 1000)),
            "app": self.ai_module,
            "class": detection_class,
            "data": event_data,
            "time": time.strftime("%Y-%m-%d %H:%M:%S IST", time.localtime()),
            "cam": self.cam_name,
            "severity": "High" if detection_class in ["WANTED", "FIRE"] else "Medium",
            "status": "Sent",
            "tags": tags,
            "bbox": bbox
        }
        try:
            res = requests.post(API_ENDPOINT, json=payload, timeout=2)
            if res.status_code == 200:
                logging.info(f"[{self.cam_name} | {self.ai_module}] Dispatched | Class: {detection_class} | OCR Data: {event_data}")
        except Exception as e:
            logging.error(f"Dispatch Error: {e}")

    def run(self):
        logging.info(f"YOLOv8 Deep Learning Worker Started for [{self.cam_name}] -> [{self.ai_module}]")
        cap = cv2.VideoCapture(self.rtsp_url)

        while self.running:
            if not self.is_app_enabled():
                time.sleep(1)
                continue

            ret, frame = cap.read()
            if not ret or frame is None:
                time.sleep(2)
                cap = cv2.VideoCapture(self.rtsp_url)
                continue

            current_time = time.time()
            if current_time - self.last_trigger_time < 8:
                time.sleep(0.05)
                continue

            height, width, _ = frame.shape

            # Run Actual Real-Time YOLO Inference
            results = model(frame, verbose=False, conf=0.45)

            for result in results:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0])

                    # 1. TRAFFIC / ANPR MODULE
                    if "Traffic" in self.ai_module or "ANPR" in self.ai_module:
                        if cls_id in VEHICLE_CLASSES:
                            vehicle_type = VEHICLE_CLASSES[cls_id]
                            
                            # Crop bounding box for plate OCR
                            crop = frame[y1:y2, x1:x2]
                            detected_plate = self.perform_ocr_on_crop(crop)

                            bbox_rel = {
                                "top": f"{int((y1 / height) * 100)}%",
                                "left": f"{int((x1 / width) * 100)}%",
                                "width": f"{int(((x2 - x1) / width) * 100)}%",
                                "height": f"{int(((y2 - y1) / height) * 100)}%"
                            }

                            self.dispatch_alert(vehicle_type, detected_plate, bbox_rel, "YOLOv8 + OCR | Live")
                            self.last_trigger_time = current_time
                            break

                    # 2. FACE REC / PERSON DETECTOR MODULE
                    elif "FACE" in self.ai_module or "Perimeter" in self.ai_module:
                        if cls_id == PERSON_CLASS:
                            bbox_rel = {
                                "top": f"{int((y1 / height) * 100)}%",
                                "left": f"{int((x1 / width) * 100)}%",
                                "width": f"{int(((x2 - x1) / width) * 100)}%",
                                "height": f"{int(((y2 - y1) / height) * 100)}%"
                            }
                            self.dispatch_alert("Person", "Live Target Identified", bbox_rel, "YOLOv8 Person Rec")
                            self.last_trigger_time = current_time
                            break

            time.sleep(0.03)

        cap.release()

    def stop(self):
        self.running = False

if __name__ == "__main__":
    deployments = [
        {"camName": "ANPR_TEST_C1", "rtsp": "rtsp://admin:surya@321@192.168.100.229:554/profile1", "aiModule": "Traffic - ANPR & ATCC"},
        {"camName": "FACE_TEST_C1", "rtsp": "rtsp://admin:123456@192.168.100.227:554/profile1", "aiModule": "FACE REC"}
    ]

    workers = []
    for d in deployments:
        w = RealAIEngineWorker(None, d["camName"], d["rtsp"], d["aiModule"])
        w.daemon = True
        w.start()
        workers.append(w)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        for w in workers:
            w.stop()
