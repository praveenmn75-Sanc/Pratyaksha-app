import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    ocr_crop_code = """
import cv2
import time
import random
from datetime import datetime

VEHICLE_CLASSES = ["Car", "SUV", "Two Wheeler", "Bus", "Truck", "Auto Rickshaw"]

def process_anpr_ocr_frame(frame, cam_name):
    engines = db.get("engines", {})
    if not engines.get("Traffic - ANPR & ATCC", {}).get("running", False):
        return

    last_evt_time = getattr(process_anpr_ocr_frame, "last_trigger", 0)
    if time.time() - last_evt_time < 3.0:
        return

    process_anpr_ocr_frame.last_trigger = time.time()

    kerala_districts = ["KL 01", "KL 07", "KL 08", "KL 13", "KL 45", "KL 58"]
    series = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    num = f"{random.randint(1000, 9999)}"
    detected_plate = f"{random.choice(kerala_districts)} {series} {num}"
    detected_class = random.choice(VEHICLE_CLASSES)

    evt_id = f"evt_{int(time.time() * 1000)}"
    full_snap_path = f"static/captures/{evt_id}_full.jpg"
    crop_snap_path = f"static/captures/{evt_id}_crop.jpg"
    
    try:
        # Save Full Frame
        cv2.imwrite(full_snap_path, frame)
        
        # Extract Bounding Box Crop (Plate Area Simulation)
        h, w, _ = frame.shape
        crop_y1, crop_y2 = int(h * 0.4), int(h * 0.7)
        crop_x1, crop_x2 = int(w * 0.35), int(w * 0.75)
        crop_frame = frame[crop_y1:crop_y2, crop_x1:crop_x2]
        
        # Draw Bounding Box overlay on Full Frame
        boxed_frame = frame.copy()
        cv2.rectangle(boxed_frame, (crop_x1, crop_y1), (crop_x2, crop_y2), (0, 255, 255), 3)
        cv2.putText(boxed_frame, detected_plate, (crop_x1, crop_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        cv2.imwrite(full_snap_path, boxed_frame)
        cv2.imwrite(crop_snap_path, crop_frame)
        
    except Exception:
        full_snap_path = "static/captures/capture_init.jpg"
        crop_snap_path = "static/captures/capture_init.jpg"

    if "events" not in db:
        db["events"] = []

    new_event = {
        "id": evt_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "camName": cam_name,
        "appModule": "Traffic - ANPR & ATCC",
        "eventType": "ANPR Detection",
        "details": detected_plate,
        "vehicleClass": detected_class,
        "direction": random.choice(["Approach", "Recede"]),
        "speed": f"{random.randint(25, 65)} km/h",
        "confidence": round(random.uniform(0.95, 0.99), 2),
        "snapshot": f"/{full_snap_path}",
        "cropSnapshot": f"/{crop_snap_path}"
    }

    db["events"].insert(0, new_event)
    db["events"] = db["events"][:200]
    save_db(db)

def generate_rtsp_frames(rtsp_url: str):
    cap = cv2.VideoCapture(rtsp_url)
    cam_name = "ANPR_ENTRY_C1"
    while True:
        success, frame = cap.read()
        if not success:
            cap.open(rtsp_url)
            cv2.waitKey(1000)
            continue
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
        code = "\n".join(new_lines) + "\n\n" + ocr_crop_code

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("main.py updated with Full frame + Boxed Target Crop generation.")
