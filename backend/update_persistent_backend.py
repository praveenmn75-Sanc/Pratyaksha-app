import os, json

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Fixed initial state fallback block
    seed_block = """
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
            {"id": "usr_1", "orgId": "org_tzp", "fullName": "Super Admin", "role": "Super Admin", "officerEmail": "pratyaksha@suryasanc.in"},
            {"id": "usr_2", "orgId": "org_tzp", "fullName": "TZP Administrator", "role": "Org Admin", "officerEmail": "praveen@suryasanc.in"}
        ],
        "areas": [
            {"id": "area_1", "orgId": "org_tzp", "parentArea": "Orientation Centre", "subAreas": ["Town Centre"]}
        ],
        "cameras": [
            {"id": "cam_1", "orgId": "org_tzp", "appModule": "Traffic - ANPR & ATCC", "area": "Orientation Centre", "camName": "ANPR_ENTRY_C1", "rtsp": "rtsp://192.168.100.229:554/profile1"}
        ],
        "rois": [],
        "engines": {
            "Traffic - ANPR & ATCC": {"running": True},
            "FACE REC": {"running": False},
            "WildWatch": {"running": False},
            "Perimeter Intrusion": {"running": False},
            "Fire & Smoke": {"running": False}
        }
    }
"""

    if "def load_db():" in code:
        lines = code.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "def load_db():" in line:
                skip = True
                continue
            if skip and line.startswith("def save_db"):
                skip = False
            if not skip:
                new_lines.append(line)
        code = seed_block + "\n" + "\n".join(new_lines)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Backend database persistence locked.")
