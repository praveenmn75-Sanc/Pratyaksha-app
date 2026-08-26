import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    engine_routes = """
# ENGINE CONTROL ENDPOINT
@app.post("/api/v1/engine/control")
def control_engine(payload: dict):
    app_module = payload.get("appModule")
    action = payload.get("action")
    
    if "engines" not in db:
        db["engines"] = {
            "Traffic - ANPR & ATCC": {"running": True},
            "FACE REC": {"running": False},
            "WildWatch": {"running": False},
            "Perimeter Intrusion": {"running": False},
            "Fire & Smoke": {"running": False}
        }
    
    if app_module not in db["engines"]:
        db["engines"][app_module] = {"running": False}
        
    db["engines"][app_module]["running"] = (action == "start")
    save_db(db)
    
    status_str = "launched" if action == "start" else "stopped"
    return {"status": "ok", "message": f"Engine {app_module} successfully {status_str}!"}

@app.get("/api/v1/engines")
def get_engines():
    if "engines" not in db:
        db["engines"] = {
            "Traffic - ANPR & ATCC": {"running": True},
            "FACE REC": {"running": False},
            "WildWatch": {"running": False},
            "Perimeter Intrusion": {"running": False},
            "Fire & Smoke": {"running": False}
        }
    return db["engines"]
"""

    if "def get_engines():" in content:
        lines = content.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "def get_engines():" in line:
                skip = True
                continue
            if skip and line.startswith("@app."):
                skip = False
            if not skip:
                new_lines.append(line)
        content = "\n".join(new_lines) + "\n\n" + engine_routes
    else:
        content += "\n\n" + engine_routes

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("main.py engine control endpoint added successfully.")
