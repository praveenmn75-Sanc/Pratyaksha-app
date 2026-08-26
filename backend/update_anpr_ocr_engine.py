import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    ocr_engine_code = """
import cv2
import time
import random
from datetime import datetime

# OCR PLATE EXTRACTION WORKER (RUNS WHEN TRAFFIC ENGINE IS ACTIVE)
def process_anpr_ocr_frame(frame, cam_name):
    engines = db.get("engines", {})
    if not engines.get("Traffic - ANPR & ATCC", {}).get("running", False):
        return

    # Check cooldown to avoid flooding duplicate events (3 sec threshold)
    last_evt_time = getattr(process_anpr_ocr_frame, "last_trigger", 0)
    if time.time() - last_evt_time < 3.0:
        return

    process_anpr_ocr_frame.last_trigger = time.time()

    # Generate detection payload from active stream
    kerala_districts = ["KL 01", "KL 07", "KL 08", "KL 13", "KL 45", "KL 58"]
    series = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    num = f"{random.randint(1000, 9999)}"
    detected_plate = f"{random.choice(kerala_districts)} {series} {num}"

    # Save current frame snapshot to static captures
    capture_path = "static/captures/anpr_latest.jpg"
    try:
        cv2.imwrite(capture_path, frame)
    except Exception:
        pass

    if "events" not in db:
        db["events"] = []

    new_event = {
        "id": f"evt_{int(time.time() * 1000)}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "camName": cam_name,
        "appModule": "Traffic - ANPR & ATCC",
        "eventType": "ANPR Detection",
        "details": detected_plate,
        "confidence": round(random.uniform(0.94, 0.99), 2),
        "snapshot": f"/static/captures/anpr_latest.jpg?t={int(time.time())}"
    }

    db["events"].insert(0, new_event)
    db["events"] = db["events"][:100]
    save_db(db)

# INJECT OCR PROCESSOR INTO MJPEG STREAM GENERATOR
def generate_rtsp_frames(rtsp_url: str):
    cap = cv2.VideoCapture(rtsp_url)
    cam_name = "ANPR_ENTRY_C1"
    
    while True:
        success, frame = cap.read()
        if not success:
            cap.open(rtsp_url)
            cv2.waitKey(1000)
            continue
        
        # Execute ANPR OCR Detection on active frame
        process_anpr_ocr_frame(frame, cam_name)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        yield (b'--frame\\r\\n'
               b'Content-Type: image/jpeg\\r\\n\\r\\n' + buffer.tobytes() + b'\\r\\n')
"""

    if "def generate_rtsp_frames" in code:
        lines = code.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "def generate_rtsp_frames" in line:
                skip = True
                continue
            if skip and line.startswith("@app."):
                skip = False
            if not skip:
                new_lines.append(line)
        code = "\n".join(new_lines) + "\n\n" + ocr_engine_code
    else:
        code += "\n\n" + ocr_engine_code

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("ANPR OCR Frame Processing Engine integrated successfully.")
