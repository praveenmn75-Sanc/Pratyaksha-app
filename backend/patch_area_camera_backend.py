import os

filepath = "/home/user/app-pratyaksha/backend/main.py"
if not os.path.exists(filepath):
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            filepath = os.path.join(root, "main.py")
            break

with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

area_cam_endpoints = """
# --- AREA & SUB-AREA ENDPOINTS ---
@app.post("/api/v1/admin/areas/save")
def save_area(payload: dict):
    if "areas" not in db or not isinstance(db["areas"], list):
        db["areas"] = []
    
    area_id = payload.get("id") or f"area_{int(time.time() * 1000)}"
    payload["id"] = area_id
    
    db["areas"] = [a for a in db["areas"] if a.get("id") != area_id]
    db["areas"].append(payload)
    save_db(db)
    return {"status": "ok", "message": "Area saved successfully", "area": payload}

@app.delete("/api/v1/admin/areas/delete/{area_id}")
def delete_area(area_id: str):
    if "areas" in db:
        db["areas"] = [a for a in db["areas"] if a.get("id") != area_id]
        save_db(db)
    return {"status": "ok", "message": "Area removed successfully"}

# --- CAMERA ENDPOINTS ---
@app.post("/api/v1/admin/cameras/save")
def save_camera(payload: dict):
    if "cameras" not in db or not isinstance(db["cameras"], list):
        db["cameras"] = []
    
    cam_id = payload.get("id") or f"cam_{int(time.time() * 1000)}"
    payload["id"] = cam_id
    
    db["cameras"] = [c for c in db["cameras"] if c.get("id") != cam_id]
    db["cameras"].append(payload)
    save_db(db)
    return {"status": "ok", "message": "Camera provisioned successfully", "camera": payload}

@app.delete("/api/v1/admin/cameras/delete/{cam_id}")
def delete_camera(cam_id: str):
    if "cameras" in db:
        db["cameras"] = [c for c in db["cameras"] if c.get("id") != cam_id]
        save_db(db)
    return {"status": "ok", "message": "Camera removed successfully"}
"""

if "/api/v1/admin/areas/delete" not in code:
    code += "\n\n" + area_cam_endpoints
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Backend Area & Camera endpoints added.")
else:
    print("Backend Area & Camera endpoints already exist.")
