import os, json

filepath = "main.py"

clean_main_code = """from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import json
import os
import asyncio
import cv2
import time
import random
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/captures", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

DATA_FILE = "db_store.json"

def load_db():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                if data.get("organizations") and len(data["organizations"]) > 0:
                    return data
        except Exception:
            pass
    return {
        "organizations": [
            {"id": "org_tzp", "orgName": "SuryaSANC Enterprise", "tenantCode": "TZP", "ssoEmail": "praveen@suryasanc.in"}
        ],
        "users": [
            {"id": "usr_1", "orgId": "org_tzp", "fullName": "Super Admin", "role": "Super Admin", "officerEmail": "pratyaksha@suryasanc.in"}
        ],
        "areas": [
            {"id": "area_1", "orgId": "org_tzp", "parentArea": "Orientation Centre", "subAreas": ["Town Centre"]}
        ],
        "cameras": [
            {"id": "cam_1", "orgId": "org_tzp", "appModule": "Traffic - ANPR & ATCC", "area": "Orientation Centre", "camName": "ANPR_ENTRY_C1", "rtsp": "rtsp://192.168.100.229:554/profile1"}
        ],
        "rois": [],
        "hotlist": [
            {"id": "hl_1", "plateNumber": "KL 13 AY 4500", "vehicleModel": "White SUV", "category": "Stolen / Wanted", "severity": "CRITICAL", "addedBy": "Super Admin", "dateAdded": "2026-08-25"}
        ],
        "engines": {
            "Traffic - ANPR & ATCC": {"running": True},
            "FACE REC": {"running": False},
            "WildWatch": {"running": False},
            "Perimeter Intrusion": {"running": False},
            "Fire & Smoke": {"running": False}
        },
        "events": []
    }

def save_db(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

db = load_db()

# --- LIVE RTSP STREAM GENERATOR ---
def generate_rtsp_frames(rtsp_url: str):
    cap = cv2.VideoCapture(rtsp_url)
    while True:
        success, frame = cap.read()
        if not success:
            cap.open(rtsp_url)
            cv2.waitKey(1000)
            continue
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        yield (b'--frame\\r\\n'
               b'Content-Type: image/jpeg\\r\\n\\r\\n' + buffer.tobytes() + b'\\r\\n')

@app.get("/api/v1/stream/{camera_id}")
def stream_camera(camera_id: str):
    cam = next((c for c in db.get("cameras", []) if c.get("id") == camera_id or c.get("camName") == camera_id), None)
    rtsp_url = cam.get("rtsp") if cam else "rtsp://192.168.100.229:554/profile1"
    return StreamingResponse(generate_rtsp_frames(rtsp_url), media_type="multipart/x-mixed-replace; boundary=frame")

# --- GET ENDPOINTS ---
@app.get("/api/v1/admin/organizations")
def get_orgs(): return db.get("organizations", [])

@app.get("/api/v1/admin/users")
def get_users(): return db.get("users", [])

@app.get("/api/v1/admin/areas")
def get_areas(): return db.get("areas", [])

@app.get("/api/v1/admin/cameras")
def get_cameras(): return db.get("cameras", [])

@app.get("/api/v1/app-config/rois")
def get_rois(): return db.get("rois", [])

@app.get("/api/v1/engines")
def get_engines(): return db.get("engines", {})

@app.get("/api/v1/hotlist")
def get_hotlist(): return db.get("hotlist", [])

@app.get("/api/v1/system/telemetry")
def get_telemetry():
    return {
        "cpu": {"percent": 14.2, "temp": 45.0},
        "ram": {"percent": 38.5, "used_gb": 6.1, "total_gb": 16.0},
        "gpu": {"percent": 22.0, "temp": 42.0},
        "storage": {"percent": 45.0, "used_gb": 225.0, "total_gb": 500.0},
        "cpu_usage": 14.2,
        "ram_usage": 38.5,
        "gpu_temp": 42.0,
        "storage_usage": 45.0,
        "active_streams": len(db.get("cameras", [])),
        "status": "HEALTHY"
    }

# --- CLEAN EVENTS ENDPOINT WITH FULL OPTIONAL QUERY PARAMETERS (FIXES 422) ---
@app.get("/api/v1/events")
def get_events(
    limit: int = Query(50), 
    appModule: str = Query(None), 
    camName: str = Query(None)
):
    evts = db.get("events", [])
    if not evts:
        # Initial seed event
        evts = [{
            "id": "evt_101",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "camName": "ANPR_ENTRY_C1",
            "appModule": "Traffic - ANPR & ATCC",
            "eventType": "ANPR Detection",
            "details": "KL 13 AY 4500",
            "confidence": 0.98,
            "snapshot": "/static/captures/capture_init.jpg"
        }]
        db["events"] = evts
        save_db(db)

    if appModule and appModule != "All Applications":
        evts = [e for e in evts if e.get("appModule") == appModule]
    if camName and camName != "All Cameras":
        evts = [e for e in evts if e.get("camName") == camName]
        
    return evts[:limit]

# --- POST & CONTROL ENDPOINTS ---
@app.post("/api/v1/engine/control")
def control_engine(payload: dict):
    app_module = payload.get("appModule")
    action = payload.get("action")
    if "engines" not in db:
        db["engines"] = {}
    db["engines"][app_module] = {"running": (action == "start")}
    save_db(db)
    status_str = "launched" if action == "start" else "stopped"
    return {"status": "ok", "message": f"Engine {app_module} successfully {status_str}!"}

@app.post("/api/v1/admin/organizations/save")
def save_org(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"org_{int(time.time() * 1000)}"
    db["organizations"] = [o for o in db.get("organizations", []) if o.get("id") != data.get("id")]
    db["organizations"].append(data)
    save_db(db)
    return {"status": "ok", "message": "Organisation saved successfully!"}

@app.post("/api/v1/admin/users/save")
def save_user(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"usr_{int(time.time() * 1000)}"
    db["users"] = [u for u in db.get("users", []) if u.get("id") != data.get("id")]
    db["users"].append(data)
    save_db(db)
    return {"status": "ok", "message": "User saved successfully!"}

@app.post("/api/v1/admin/areas/save")
def save_area(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"area_{int(time.time() * 1000)}"
    db["areas"] = [a for a in db.get("areas", []) if a.get("id") != data.get("id")]
    db["areas"].append(data)
    save_db(db)
    return {"status": "ok", "message": "Area saved successfully!"}

@app.post("/api/v1/admin/cameras/save")
def save_camera(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"cam_{int(time.time() * 1000)}"
    db["cameras"] = [c for c in db.get("cameras", []) if c.get("id") != data.get("id")]
    db["cameras"].append(data)
    save_db(db)
    return {"status": "ok", "message": "Camera saved successfully!"}

@app.post("/api/v1/app-config/rois/save")
def save_roi(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"roi_{int(time.time() * 1000)}"
    db["rois"] = [r for r in db.get("rois", []) if r.get("id") != data.get("id")]
    db["rois"].append(data)
    save_db(db)
    return {"status": "ok", "message": "ROI saved successfully!"}

@app.post("/api/v1/hotlist/save")
def save_hotlist(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"hl_{int(time.time() * 1000)}"
    if "hotlist" not in db:
        db["hotlist"] = []
    db["hotlist"] = [h for h in db["hotlist"] if h.get("id") != data.get("id")]
    db["hotlist"].append(data)
    save_db(db)
    return {"status": "ok", "message": "Target added to Hotlist!"}

# --- DELETE ENDPOINTS ---
@app.delete("/api/v1/admin/organizations/delete/{org_id}")
def delete_org(org_id: str):
    db["organizations"] = [o for o in db.get("organizations", []) if o.get("id") != org_id]
    save_db(db)
    return {"status": "deleted"}

@app.delete("/api/v1/admin/users/delete/{user_id}")
def delete_user(user_id: str):
    db["users"] = [u for u in db.get("users", []) if u.get("id") != user_id]
    save_db(db)
    return {"status": "deleted"}

@app.delete("/api/v1/admin/areas/delete/{area_id}")
def delete_area(area_id: str):
    db["areas"] = [a for a in db.get("areas", []) if a.get("id") != area_id]
    save_db(db)
    return {"status": "deleted"}

@app.delete("/api/v1/admin/cameras/delete/{camera_id}")
def delete_camera(camera_id: str):
    db["cameras"] = [c for c in db.get("cameras", []) if c.get("id") != camera_id]
    save_db(db)
    return {"status": "deleted"}

@app.delete("/api/v1/app-config/rois/delete/{roi_id}")
def delete_roi(roi_id: str):
    db["rois"] = [r for r in db.get("rois", []) if r.get("id") != roi_id and r.get("roiName") != roi_id]
    save_db(db)
    return {"status": "deleted"}

@app.delete("/api/v1/hotlist/delete/{hotlist_id}")
def delete_hotlist(hotlist_id: str):
    db["hotlist"] = [h for h in db.get("hotlist", []) if h.get("id") != hotlist_id]
    save_db(db)
    return {"status": "deleted"}

@app.websocket("/api/v1/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"type": "HEARTBEAT", "status": "CONNECTED"})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(clean_main_code)

print("main.py cleanly rewritten with proper Query parameter defaults.")
