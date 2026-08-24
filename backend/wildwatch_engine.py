import os
import sys
import cv2
import json
import time
import argparse
import asyncio
import numpy as np
import websockets
import torch
from ultralytics import YOLO

parser = argparse.ArgumentParser()
parser.add_argument("--device", type=str, default="gpu")
args = parser.parse_args()

DEVICE = "cuda:0" if (args.device.lower() == "gpu" and torch.cuda.is_available()) else "cpu"
print(f"[WILDWATCH-ENGINE] Initializing on device: {DEVICE.upper()}")

# WildWatch COCO Animal Mappings (Elephant: 20, Bear: 21, Zebra: 22, Giraffe: 23, Dog/Boar: 16)
WILDLIFE_CLASSES = {20: "Elephant", 21: "Bear", 16: "Wild Boar", 17: "Cat/Leopard", 18: "Dog/Tiger"}

model = YOLO("yolov8s.pt")
model.to(DEVICE)

async def process_stream():
    uri = "ws://localhost:8005/api/v1/ws/events"
    cap = cv2.VideoCapture(0)

    while True:
        try:
            async with websockets.connect(uri) as websocket:
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret: break

                    results = model(frame, device=DEVICE, verbose=False)[0]
                    for box in results.boxes:
                        cls_id = int(box.cls[0])
                        if cls_id in WILDLIFE_CLASSES:
                            animal_type = WILDLIFE_CLASSES[cls_id]
                            evt_id = f"evt_wild_{int(time.time()*1000)}"

                            payload = {
                                "id": evt_id,
                                "app": "WildWatch",
                                "class": animal_type,
                                "data": f"{animal_type} Intrusion Detected",
                                "direction": "IN",
                                "cam": "WILD_TEST_C1",
                                "time": time.strftime("%Y-%m-%d %H:%M:%S IST"),
                                "timestamp_epoch": time.time(),
                                "snapshotUrl": "http://localhost:8005/static/captures/capture_init.jpg"
                            }
                            await websocket.send(json.dumps(payload))
                            await asyncio.sleep(2.0)
        except Exception:
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(process_stream())
