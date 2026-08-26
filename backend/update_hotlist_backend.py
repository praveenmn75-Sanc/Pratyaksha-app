import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    hotlist_endpoints = """
# --- HOTLIST WATCHLIST ENDPOINTS ---
@app.get("/api/v1/hotlist")
def get_hotlist():
    if "hotlist" not in db:
        db["hotlist"] = [
            {"id": "hl_1", "plateNumber": "KL 13 AY 4500", "vehicleModel": "White SUV", "category": "Stolen / Wanted", "severity": "CRITICAL", "addedBy": "Super Admin", "dateAdded": "2026-08-25"}
        ]
        save_db(db)
    return db.get("hotlist", [])

@app.post("/api/v1/hotlist/save")
def save_hotlist(data: dict):
    if "id" not in data or not data["id"]:
        data["id"] = f"hl_{int(time.time() * 1000)}"
    if "hotlist" not in db:
        db["hotlist"] = []
    db["hotlist"] = [h for h in db["hotlist"] if h.get("id") != data.get("id")]
    db["hotlist"].append(data)
    save_db(db)
    return {"status": "ok", "message": "Target added to Hotlist Watchlist successfully!"}

@app.delete("/api/v1/hotlist/delete/{hotlist_id}")
def delete_hotlist(hotlist_id: str):
    db["hotlist"] = [h for h in db.get("hotlist", []) if h.get("id") != hotlist_id and h.get("plateNumber") != hotlist_id]
    save_db(db)
    return {"status": "deleted", "message": "Hotlist target removed."}
"""

    if "@app.get(\"/api/v1/hotlist\")" not in code:
        code += "\n" + hotlist_endpoints
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)
    print("Hotlist endpoints added to main.py successfully.")
