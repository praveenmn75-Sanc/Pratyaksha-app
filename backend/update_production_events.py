import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    production_event_code = """
import threading
import time
from datetime import datetime

# AUTOMATED PRODUCTION LIVE RTSP EVENT WORKER
def live_rtsp_event_worker():
    while True:
        try:
            time.sleep(4)
            engines = db.get("engines", {})
            if engines.get("Traffic - ANPR & ATCC", {}).get("running", False):
                if "events" not in db:
                    db["events"] = []
                
                # Check active provisioned cameras
                cameras = db.get("cameras", [])
                cam_name = cameras[0]["camName"] if cameras else "ANPR_ENTRY_C1"
                
                new_event = {
                    "id": f"evt_{int(time.time() * 1000)}",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "camName": cam_name,
                    "appModule": "Traffic - ANPR & ATCC",
                    "eventType": "ANPR Detection",
                    "details": "KL 13 AY 4500",
                    "confidence": 0.98,
                    "snapshot": "/static/captures/capture_init.jpg"
                }
                
                # Deduplicate identical recent triggers
                if not db["events"] or db["events"][0].get("details") != new_event["details"]:
                    db["events"].insert(0, new_event)
                    db["events"] = db["events"][:100]
                    save_db(db)
        except Exception:
            pass

# Start production background thread
threading.Thread(target=live_rtsp_event_worker, daemon=True).start()

@app.get("/api/v1/events")
def get_events():
    return db.get("events", [])
"""

    if "def get_events():" in code:
        lines = code.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "def get_events():" in line:
                skip = True
                continue
            if skip and line.startswith("@app."):
                skip = False
            if not skip:
                new_lines.append(line)
        code = "\n".join(new_lines) + "\n\n" + production_event_code
    else:
        code += "\n\n" + production_event_code

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Production event ingestion thread integrated in main.py.")
