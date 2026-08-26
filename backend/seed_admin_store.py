import json

db_path = "db_store.json"

store = {
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

with open(db_path, "w") as f:
    json.dump(store, f, indent=2)

print("db_store.json seeded successfully.")
