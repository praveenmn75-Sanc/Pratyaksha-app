import os
import sys
import time
import json
import asyncio
import requests
import websockets

API_BASE_URL = "http://localhost:8005/api/v1"
WS_URL = "ws://localhost:8005/api/v1/ws/events"

print("[Fire & Smoke Engine] Initializing Thermal & Optical Flame Detection Engine...")

async def run_fire():
    async with websockets.connect(WS_URL) as ws:
        print("[Fire & Smoke Engine] Connected to WebSocket Telemetry Hub.")
        types = ["Dense Smoke Plume", "Active Flame / Thermal Anomaly", "Early Fire Outbreak"]

        idx = 0
        while True:
            try:
                res = requests.get(f"{API_BASE_URL}/app-config/rois")
                rois = [r for r in res.json() if r.get("appModule") == "Fire & Smoke"]
            except Exception:
                rois = []

            c_type = types[idx % len(types)]
            cam_name = rois[0]["camName"] if rois else "FIRE_CAM_01"

            payload = {
                "id": f"evt_fire_{int(time.time()*1000)}",
                "camName": cam_name,
                "appModule": "Fire & Smoke",
                "class": c_type,
                "data": f"Thermal Anomaly Detected: {c_type}",
                "confidence": 0.98,
                "time": time.strftime("%H:%M:%S"),
                "snapshotUrl": f"{API_BASE_URL.replace('/api/v1', '')}/static/captures/capture_init.jpg"
            }

            await ws.send(json.dumps(payload))
            print(f"[Fire & Smoke Engine] Fire Alert Emitted: {c_type} @ {cam_name}")
            idx += 1
            await asyncio.sleep(6)

if __name__ == "__main__":
    asyncio.run(run_fire())
