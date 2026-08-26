import json, os

db_path = "/home/user/app-pratyaksha/backend/db_store.json"
if not os.path.exists(os.path.dirname(db_path)):
    # Fallback search if path differs
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            db_path = os.path.join(root, "db_store.json")
            break

print(f"Targeting db_store.json at: {db_path}")

seeded_db = {
  "organizations": [
    {
      "id": "org_tzp",
      "orgName": "SuryaSANC Enterprise",
      "tenantCode": "TZP",
      "ssoEmail": "praveen@suryasanc.in",
      "ssoPassword": "admin123",
      "allowedModules": [
        "Traffic - ANPR & ATCC",
        "FACE REC",
        "WildWatch",
        "Perimeter Intrusion",
        "Fire & Smoke"
      ],
      "maxCameras": 64,
      "licenseKey": "PRATYAKSHA-LIC-TZP-64CAM-KEY2026",
      "status": "LICENSED"
    }
  ],
  "users": [
    {
      "id": "usr_tzp_dcf",
      "orgId": "org_tzp",
      "fullName": "TZP_DCF",
      "officerEmail": "sales@suryasanc.in",
      "password": "admin123",
      "role": "Org Admin"
    }
  ],
  "areas": [
    {
      "id": "area_tzp",
      "orgId": "org_tzp",
      "parentArea": "TZP",
      "subAreas": [
        "TZP_OC"
      ]
    }
  ],
  "cameras": [
    {
      "id": "cam_anpr_entry",
      "orgId": "org_tzp",
      "area": "TZP",
      "subArea": "TZP_OC",
      "camName": "ANPR_TEST_ENTRY",
      "rtsp": "rtsp://192.168.100.229:554/profile1",
      "appModule": "Traffic - ANPR & ATCC",
      "status": "ACTIVE"
    }
  ],
  "engines": {
    "Traffic - ANPR & ATCC": {"running": True},
    "FACE REC": {"running": False},
    "WildWatch": {"running": False},
    "Perimeter Intrusion": {"running": False},
    "Fire & Smoke": {"running": False}
  },
  "events": []
}

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(seeded_db, f, indent=2)

print("db_store.json successfully restored with Org, User, Area, and Camera records.")
