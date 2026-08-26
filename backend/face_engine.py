import os
import sys
import time
import json
import asyncio
import requests
import websockets

API_BASE_URL = "http://localhost:8005/api/v1"
WS_URL = "ws://localhost:8005/api/v1/ws/events"

print("[FACE REC Engine] Initializing Face Matching & Watchlist Identification Engine...")

async def run_face():
    async with websockets.connect(WS_URL) as ws:
        print("[FACE REC Engine] Connected to WebSocket Telemetry Hub.")

        idx = 0
        while True:
            # Fetch active Watchlist Targets & ROIs
            try:
                t_res = requests.get(f"{API_BASE_URL}/hotlist/targets")
                face_targets = [t for t in t_res.json() if t.get("type") == "Face"]
                r_res = requests.get(f"{API_BASE_URL}/app-config/rois")
                rois = [r for r in r_res.json() if r.get("appModule") == "FACE REC"]
            except Exception:
                face_targets = []
                rois = []

            target = face_targets[idx % len(face_targets)] if face_targets else {"value": "John Doe (VIP)", "tag": "VIP"}
            cam_name = rois[0]["camName"] if rois else "FACE_CAM_01"

            payload = {
                "id": f"evt_face_{int(time.time()*1000)}",
                "camName": cam_name,
                "appModule": "FACE REC",
                "class": target.get("tag", "Matched"),
                "data": f"Face Matched: {target.get('value')} [{target.get('tag')}]",
                "snapshotUrl": target.get("imageUrl") or f"{API_BASE_URL.replace('/api/v1', '')}/static/captures/capture_init.jpg",
                "confidence": 0.95,
                "time": time.strftime("%H:%M:%S")
            }

            await ws.send(json.dumps(payload))
            print(f"[FACE REC Engine] Face Match Emitted: {target.get('value')} @ {cam_name}")
            idx += 1
            await asyncio.sleep(4)

if __name__ == "__main__":
    asyncio.run(run_face())
