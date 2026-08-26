import os
import sys
import time
import json
import asyncio
import requests
import websockets

API_BASE_URL = "http://localhost:8005/api/v1"
WS_URL = "ws://localhost:8005/api/v1/ws/events"

print("[Perimeter Intrusion Engine] Initializing Spatial Tripwire & Perimeter Security Engine...")

async def run_intrusion():
    async with websockets.connect(WS_URL) as ws:
        print("[Perimeter Intrusion Engine] Connected to WebSocket Telemetry Hub.")
        types = ["Human Intruder", "Fence Line Breach", "Unfinished Perimeter Crossing"]

        idx = 0
        while True:
            try:
                res = requests.get(f"{API_BASE_URL}/app-config/rois")
                rois = [r for r in res.json() if r.get("appModule") == "Perimeter Intrusion"]
            except Exception:
                rois = []

            c_type = types[idx % len(types)]
            cam_name = rois[0]["camName"] if rois else "PERIMETER_CAM_01"
            direction = rois[0].get("directionMode", "Bi-Directional") if rois else "Bi-Directional"

            payload = {
                "id": f"evt_int_{int(time.time()*1000)}",
                "camName": cam_name,
                "appModule": "Perimeter Intrusion",
                "class": c_type,
                "data": f"Tripwire Polygon Crossed: {c_type}",
                "direction": direction,
                "confidence": 0.96,
                "time": time.strftime("%H:%M:%S"),
                "snapshotUrl": f"{API_BASE_URL.replace('/api/v1', '')}/static/captures/capture_init.jpg"
            }

            await ws.send(json.dumps(payload))
            print(f"[Perimeter Intrusion Engine] Alert Emitted: {c_type} @ {cam_name}")
            idx += 1
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(run_intrusion())
