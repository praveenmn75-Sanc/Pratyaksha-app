import os
import sys
import cv2
import json
import time
import argparse
import asyncio
import websockets
import torch
from ultralytics import YOLO

parser = argparse.ArgumentParser()
parser.add_argument("--device", type=str, default="gpu")
args = parser.parse_args()

DEVICE = "cuda:0" if (args.device.lower() == "gpu" and torch.cuda.is_available()) else "cpu"
print(f"[INTRUSION-ENGINE] Initializing on device: {DEVICE.upper()}")

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
                        if int(box.cls[0]) in [0, 2, 3, 7]: # Human or vehicle intrusion
                            evt_id = f"evt_int_{int(time.time()*1000)}"
                            payload = {
                                "id": evt_id,
                                "app": "Perimeter Intrusion",
                                "class": "Human Crossing" if int(box.cls[0]) == 0 else "Vehicle Intrusion",
                                "data": "Zone Boundary Crossed",
                                "direction": "IN",
                                "cam": "INTRUSION_C1",
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
