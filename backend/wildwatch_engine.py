import os
import sys
import time
import json
import asyncio
import requests
import websockets

API_BASE_URL = "http://localhost:8005/api/v1"
WS_URL = "ws://localhost:8005/api/v1/ws/events"

print("[WildWatch Engine] Initializing Wildlife Conflict & Edge Surveillance Analytics Engine...")

async def run_wildwatch():
    async with websockets.connect(WS_URL) as ws:
        print("[WildWatch Engine] Connected to WebSocket Telemetry Hub.")
        classes = ["Elephant", "Tiger", "Leopard", "Gaur / Wild Bison", "Wild Boar"]
        areas = ["Palakkad Division", "Wayanad South", "Wayanad North", "Thrissur Range"]

        idx = 0
        while True:
            # Fetch active ROIs configured for WildWatch
            try:
                res = requests.get(f"{API_BASE_URL}/app-config/rois")
                rois = [r for r in res.json() if r.get("appModule") == "WildWatch"]
            except Exception:
                rois = []

            c_class = classes[idx % len(classes)]
            c_area = areas[idx % len(areas)]
            cam_name = rois[0]["camName"] if rois else "WILDWATCH_CAM_01"
            direction = rois[0].get("directionMode", "IN") if rois else "IN"

            payload = {
                "id": f"evt_wild_{int(time.time()*1000)}",
                "camName": cam_name,
                "appModule": "WildWatch",
                "class": c_class,
                "data": f"Detected {c_class} traversing perimeter ({direction} Mode)",
                "direction": direction,
                "area": c_area,
                "confidence": 0.94,
                "time": time.strftime("%H:%M:%S"),
                "snapshotUrl": f"{API_BASE_URL.replace('/api/v1', '')}/static/captures/capture_init.jpg"
            }

            await ws.send(json.dumps(payload))
            print(f"[WildWatch Engine] Event Emitted: {c_class} @ {cam_name}")
            idx += 1
            await asyncio.sleep(4)

if __name__ == "__main__":
    asyncio.run(run_wildwatch())
