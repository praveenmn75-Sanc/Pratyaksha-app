import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    event_generator_code = """
import time
from datetime import datetime

# BACKGROUND LIVE EVENT DETECTOR
def push_live_event(cam_name, event_type, details):
    if "events" not in db:
        db["events"] = []
    
    new_evt = {
        "id": f"evt_{int(time.time() * 1000)}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "camName": cam_name,
        "appModule": "Traffic - ANPR & ATCC",
        "eventType": event_type,
        "details": details,
        "confidence": 0.98,
        "snapshot": "/static/captures/capture_init.jpg"
    }
    
    db["events"].insert(0, new_evt)
    db["events"] = db["events"][:50]  # Keep latest 50 events
    save_db(db)

@app.get("/api/v1/events")
def get_events():
    if "events" not in db or len(db.get("events", [])) == 0:
        # Seed initial dynamic event trigger
        push_live_event("ANPR_ENTRY_C1", "ANPR Detection", "KL 13 AY 4500")
    return db.get("events", [])

@app.post("/api/v1/events/trigger")
def trigger_event(payload: dict):
    cam_name = payload.get("camName", "ANPR_ENTRY_C1")
    event_type = payload.get("eventType", "ANPR Detection")
    details = payload.get("details", "KL 13 AY 4500")
    push_live_event(cam_name, event_type, details)
    return {"status": "ok", "message": "Live detection event captured!"}
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
        code = "\n".join(new_lines) + "\n\n" + event_generator_code
    else:
        code += "\n\n" + event_generator_code

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("main.py live event detector updated successfully.")
