import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Replace constrained get_events definition with optional defaults
    old_def = "def get_events("
    
    events_route_clean = """@app.get("/api/v1/events")
def get_events(limit: int = 50, appModule: str = None, camName: str = None):
    evts = db.get("events", [])
    if appModule and appModule != "All Applications":
        evts = [e for e in evts if e.get("appModule") == appModule]
    if camName and camName != "All Cameras":
        evts = [e for e in evts if e.get("camName") == camName]
    return evts[:limit]"""

    if "def get_events(" in code:
        lines = code.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "def get_events(" in line or 'def get_events():' in line:
                skip = True
                continue
            if skip and line.startswith("@app."):
                skip = False
            if not skip:
                new_lines.append(line)
        code = "\n".join(new_lines) + "\n\n" + events_route_clean

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("main.py get_events endpoint updated to prevent 422 errors.")
