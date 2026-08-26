import os

filepath = "/home/user/app-pratyaksha/backend/main.py"
if not os.path.exists(filepath):
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            filepath = os.path.join(root, "main.py")
            break

with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

persistence_endpoints = """
# Dynamic Admin Fetch Endpoints
@app.get("/api/v1/admin/organizations")
def get_organizations():
    return db.get("organizations", [])

@app.get("/api/v1/admin/users")
def get_users():
    return db.get("users", [])

@app.get("/api/v1/admin/areas")
def get_areas():
    return db.get("areas", [])

@app.get("/api/v1/admin/cameras")
def get_cameras():
    return db.get("cameras", [])

# Dynamic Admin Save & Persistence Endpoints
@app.post("/api/v1/admin/organizations/save")
def save_org_api(payload: dict):
    if "organizations" not in db: db["organizations"] = []
    oid = payload.get("id") or f"org_{int(time.time()*1000)}"
    payload["id"] = oid
    db["organizations"] = [o for o in db.get("organizations", []) if o.get("id") != oid]
    db["organizations"].append(payload)
    save_db(db)
    return {"status": "ok", "organizations": db["organizations"]}

@app.delete("/api/v1/admin/organizations/delete/{org_id}")
def delete_org_api(org_id: str):
    if "organizations" in db:
        db["organizations"] = [o for o in db["organizations"] if o.get("id") != org_id]
        save_db(db)
    return {"status": "ok"}

@app.post("/api/v1/admin/users/save")
def save_user_api(payload: dict):
    if "users" not in db: db["users"] = []
    uid = payload.get("id") or f"usr_{int(time.time()*1000)}"
    payload["id"] = uid
    db["users"] = [u for u in db.get("users", []) if u.get("id") != uid]
    db["users"].append(payload)
    save_db(db)
    return {"status": "ok", "users": db["users"]}

@app.delete("/api/v1/admin/users/delete/{user_id}")
def delete_user_api(user_id: str):
    if "users" in db:
        db["users"] = [u for u in db["users"] if u.get("id") != user_id]
        save_db(db)
    return {"status": "ok"}

@app.post("/api/v1/admin/areas/save")
def save_area_api(payload: dict):
    if "areas" not in db: db["areas"] = []
    aid = payload.get("id") or f"area_{int(time.time()*1000)}"
    payload["id"] = aid
    db["areas"] = [a for a in db.get("areas", []) if a.get("id") != aid]
    db["areas"].append(payload)
    save_db(db)
    return {"status": "ok", "areas": db["areas"]}

@app.delete("/api/v1/admin/areas/delete/{area_id}")
def delete_area_api(area_id: str):
    if "areas" in db:
        db["areas"] = [a for a in db["areas"] if a.get("id") != area_id]
        save_db(db)
    return {"status": "ok"}

@app.post("/api/v1/admin/cameras/save")
def save_camera_api(payload: dict):
    if "cameras" not in db: db["cameras"] = []
    cid = payload.get("id") or f"cam_{int(time.time()*1000)}"
    payload["id"] = cid
    db["cameras"] = [c for c in db.get("cameras", []) if c.get("id") != cid]
    db["cameras"].append(payload)
    save_db(db)
    return {"status": "ok", "cameras": db["cameras"]}

@app.delete("/api/v1/admin/cameras/delete/{cam_id}")
def delete_camera_api(cam_id: str):
    if "cameras" in db:
        db["cameras"] = [c for c in db["cameras"] if c.get("id") != cam_id]
        save_db(db)
    return {"status": "ok"}
"""

if "get_organizations" not in code:
    code += "\n\n" + persistence_endpoints
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Backend persistence routes updated.")
