import os
import sys
import json
import time
import subprocess
import torch
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional, Any

app = FastAPI(title="Pratyaksha Enterprise AI Surveillance Platform Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "roi_config.json")
APP_CAMERAS_FILE = os.path.join(os.path.dirname(__file__), "app_camera_mappings.json")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
CAPTURES_DIR = os.path.join(STATIC_DIR, "captures")
os.makedirs(CAPTURES_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

ENGINE_SCRIPTS = {
    "Traffic - ANPR & ATCC": "anpr_engine.py",
    "FACE REC": "face_engine.py",
    "WildWatch": "wildwatch_engine.py",
    "Perimeter Intrusion": "intrusion_engine.py",
    "Fire & Smoke": "fire_engine.py"
}

active_processes: Dict[str, Optional[subprocess.Popen]] = {k: None for k in ENGINE_SCRIPTS.keys()}
EVENT_HISTORY: List[dict] = []

def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            return default
    return default

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/api/v1/ws/events")
async def websocket_events(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if "id" in data:
                EVENT_HISTORY.insert(0, data)
                if len(EVENT_HISTORY) > 100:
                    EVENT_HISTORY.pop()
            await manager.broadcast(data)
    except Exception:
        manager.disconnect(websocket)

@app.get("/api/v1/events")
def get_all_events():
    return EVENT_HISTORY

class ROIPayload(BaseModel):
    camName: str
    appModule: str
    roiName: str
    type: str
    direction: Optional[str] = "BI"
    coordinates: Any

@app.post("/api/v1/roi/save")
def save_roi_config(payload: ROIPayload):
    data = load_json(CONFIG_FILE, {})
    key = f"{payload.camName}:{payload.appModule}"
    data[key] = {
        "camName": payload.camName,
        "appModule": payload.appModule,
        "roiName": payload.roiName,
        "type": payload.type,
        "direction": payload.direction,
        "coordinates": payload.coordinates,
        "configured": True,
        "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    save_json(CONFIG_FILE, data)
    return {"status": "success", "message": f"Saved {payload.type} [{payload.roiName}]", "config": data[key]}

@app.get("/api/v1/roi/all-status")
def get_all_roi_statuses():
    return load_json(CONFIG_FILE, {})

@app.get("/api/v1/roi/{cam_name}/{app_module}")
def get_roi_config(cam_name: str, app_module: str):
    data = load_json(CONFIG_FILE, {})
    key = f"{cam_name}:{app_module}"
    if key in data:
        return data[key]
    return {"configured": False}

@app.get("/api/v1/engines")
def get_all_engines_status():
    summary = {}
    for app_module, script_name in ENGINE_SCRIPTS.items():
        proc = active_processes.get(app_module)
        is_running = proc is not None and proc.poll() is None
        summary[app_module] = {"script": script_name, "running": is_running, "pid": proc.pid if is_running else None}
    return summary

class EngineControlPayload(BaseModel):
    appModule: str
    action: str
    device: Optional[str] = "gpu"

@app.post("/api/v1/engine/control")
def control_engine(payload: EngineControlPayload):
    app_module = payload.appModule
    action = payload.action.lower()
    script_name = ENGINE_SCRIPTS.get(app_module)
    if not script_name:
        return {"status": "error", "message": "Invalid module"}

    script_path = os.path.join(os.path.dirname(__file__), script_name)
    current_proc = active_processes.get(app_module)

    if action == "stop":
        if current_proc and current_proc.poll() is None:
            current_proc.terminate()
            active_processes[app_module] = None
            return {"status": "success", "message": f"Engine [{app_module}] stopped."}
        return {"status": "info", "message": f"Engine [{app_module}] already stopped."}

    elif action in ["start", "restart"]:
        if current_proc and current_proc.poll() is None:
            current_proc.terminate()

        python_exec = sys.executable
        new_proc = subprocess.Popen([python_exec, script_path, "--device", payload.device or "gpu"])
        active_processes[app_module] = new_proc
        return {"status": "success", "message": f"Engine [{app_module}] launched.", "pid": new_proc.pid}

@app.get("/api/v1/system/gpu-status")
def get_gpu_status():
    cuda = torch.cuda.is_available()
    return {"cuda_available": cuda, "device_name": torch.cuda.get_device_name(0) if cuda else "N/A"}

@app.get("/api/v1/app-compute/config")
def get_compute_config():
    return {k: "gpu" for k in ENGINE_SCRIPTS.keys()}

@app.get("/api/v1/cameras")
def get_cameras():
    return [
        {"id": "cam_1", "camName": "ANPR_TEST_C1", "location": "Highway Lane"},
        {"id": "cam_2", "camName": "FACE_TEST_C1", "location": "Main Entry"}
    ]

@app.get("/api/v1/app-cameras")
def get_app_cameras():
    return load_json(APP_CAMERAS_FILE, {
        "Traffic - ANPR & ATCC": ["ANPR_TEST_C1"],
        "FACE REC": ["FACE_TEST_C1"],
        "WildWatch": [],
        "Perimeter Intrusion": [],
        "Fire & Smoke": []
    })

class AppCameraMapPayload(BaseModel):
    appModule: str
    cameraNames: List[str]

@app.post("/api/v1/app-cameras/save")
def save_app_camera_mapping(payload: AppCameraMapPayload):
    mappings = load_json(APP_CAMERAS_FILE, {})
    mappings[payload.appModule] = payload.cameraNames
    save_json(APP_CAMERAS_FILE, mappings)
    return {"status": "success", "mappings": mappings}
