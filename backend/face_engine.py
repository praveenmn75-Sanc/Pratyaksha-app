import os
import sys
import cv2
import json
import time
import argparse
import asyncio
import websockets

parser = argparse.ArgumentParser()
parser.add_argument("--device", type=str, default="gpu")
args = parser.parse_args()

APP_CAMERAS_FILE = os.path.join(os.path.dirname(__file__), "app_camera_mappings.json")

def is_camera_mapped_to_app(cam_name, app_name):
    if os.path.exists(APP_CAMERAS_FILE):
        try:
            with open(APP_CAMERAS_FILE, "r") as f:
                mappings = json.load(f)
                return cam_name in mappings.get(app_name, [])
        except Exception:
            return False
    return False

async def process_stream():
    cam_name = "FACE_TEST_C1"
    app_name = "FACE REC"

    while True:
        # Strict mapping check
        if not is_camera_mapped_to_app(cam_name, app_name):
            print(f"[FACE-ENGINE] Camera {cam_name} is unmapped for {app_name}. Engine idle...")
            await asyncio.sleep(5)
            continue

        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(process_stream())
