import os
import sys
import cv2
import json
import time
import argparse
import asyncio
import websockets
import torch

parser = argparse.ArgumentParser()
parser.add_argument("--device", type=str, default="gpu")
args = parser.parse_args()

DEVICE = "cuda:0" if (args.device.lower() == "gpu" and torch.cuda.is_available()) else "cpu"
print(f"[FIRE-ENGINE] Initializing on device: {DEVICE.upper()}")

async def process_stream():
    uri = "ws://localhost:8005/api/v1/ws/events"
    cap = cv2.VideoCapture(0)

    while True:
        try:
            async with websockets.connect(uri) as websocket:
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret: break

                    # HSV Threshold logic for flame/smoke hotspot detection
                    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                    lower_fire = np.array([18, 50, 50], dtype="uint8")
                    upper_fire = np.array([35, 255, 255], dtype="uint8")
                    mask = cv2.inRange(hsv, lower_fire, upper_fire)

                    if cv2.countNonZero(mask) > 5000:
                        evt_id = f"evt_fire_{int(time.time()*1000)}"
                        payload = {
                            "id": evt_id,
                            "app": "Fire & Smoke",
                            "class": "Fire Flame",
                            "data": "Thermal Hotspot Warning",
                            "direction": "IN",
                            "cam": "FIRE_TEST_C1",
                            "time": time.strftime("%Y-%m-%d %H:%M:%S IST"),
                            "timestamp_epoch": time.time(),
                            "snapshotUrl": "http://localhost:8005/static/captures/capture_init.jpg"
                        }
                        await websocket.send(json.dumps(payload))
                        await asyncio.sleep(3.0)
        except Exception:
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(process_stream())
