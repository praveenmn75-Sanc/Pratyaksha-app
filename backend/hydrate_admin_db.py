import json, os

db_path = "db_store.json"

default_db = {
    "organizations": [
        {
            "id": "org_tzp",
            "orgName": "SuryaSANC Enterprise",
            "tenantCode": "TZP",
            "ssoEmail": "praveen@suryasanc.in"
        }
    ],
    "users": [
        {
            "id": "usr_1",
            "orgId": "org_tzp",
            "fullName": "Super Admin",
            "role": "Super Admin",
            "officerEmail": "pratyaksha@suryasanc.in"
        },
        {
            "id": "usr_2",
            "orgId": "org_tzp",
            "fullName": "TZP Administrator",
            "role": "Org Admin",
            "officerEmail": "praveen@suryasanc.in"
        }
    ],
    "areas": [
        {
            "id": "area_1",
            "orgId": "org_tzp",
            "parentArea": "Orientation Centre",
            "subAreas": ["Town Centre"]
        }
    ],
    "cameras": [
        {
            "id": "cam_1",
            "orgId": "org_tzp",
            "appModule": "Traffic - ANPR & ATCC",
            "area": "Orientation Centre",
            "camName": "ANPR_ENTRY_C1",
            "rtsp": "rtsp://192.168.100.229:554/profile1"
        }
    ],
    "rois": [],
    "hotlist": [],
    "engines": {
        "Traffic - ANPR & ATCC": {"running": True},
        "FACE REC": {"running": False},
        "WildWatch": {"running": False},
        "Perimeter Intrusion": {"running": False},
        "Fire & Smoke": {"running": False}
    },
    "events": []
}

current_data = {}
if os.path.exists(db_path):
    try:
        with open(db_path, "r") as f:
            current_data = json.load(f)
    except Exception:
        pass

# Ensure minimum default organization and camera node exist
if not current_data.get("organizations"):
    current_data["organizations"] = default_db["organizations"]
if not current_data.get("users"):
    current_data["users"] = default_db["users"]
if not current_data.get("areas"):
    current_data["areas"] = default_db["areas"]
if not current_data.get("cameras"):
    current_data["cameras"] = default_db["cameras"]

with open(db_path, "w") as f:
    json.dump(current_data, f, indent=2)

print("db_store.json hydrated with default Admin entities.")
