import os, json

filepath = "/home/user/app-pratyaksha/backend/main.py"
if not os.path.exists(filepath):
    # Search for main.py if path differs
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            filepath = os.path.join(root, "main.py")
            break

print(f"Targeting main.py at: {filepath}")

with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Make sure FastAPI CORS middleware allows all methods/headers
if "CORSMiddleware" not in code:
    cors_patch = """
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
"""
    code = cors_patch + "\n" + code

# Ensure /api/v1/admin/organizations/save is available and returns success
save_endpoint = """
@app.post("/api/v1/admin/organizations/save")
@app.options("/api/v1/admin/organizations/save")
def api_save_org(payload: dict = {}):
    org_id = payload.get("id") or f"org_{int(time.time() * 1000)}"
    payload["id"] = org_id
    if "organizations" not in db or not isinstance(db["organizations"], list):
        db["organizations"] = []
    
    # Remove existing matching ID or duplicate code
    db["organizations"] = [o for o in db["organizations"] if o.get("id") != org_id]
    db["organizations"].append(payload)
    save_db(db)
    return {"status": "ok", "message": "Organization saved successfully", "data": payload}
"""

if "/api/v1/admin/organizations/save" not in code:
    code += "\n\n" + save_endpoint

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Backend endpoints successfully updated with CORS & Save handler.")
