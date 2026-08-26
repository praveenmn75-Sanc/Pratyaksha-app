import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    org_endpoint_code = """
@app.post("/api/v1/admin/organizations/save")
def save_organization(payload: dict):
    if "organizations" not in db:
        db["organizations"] = []
    
    org_id = payload.get("id") or f"org_{int(time.time() * 1000)}"
    payload["id"] = org_id
    
    # Update existing record or insert new record
    db["organizations"] = [o for o in db.get("organizations", []) if o.get("id") != org_id]
    db["organizations"].append(payload)
    save_db(db)
    return {"status": "ok", "message": "Tenant provisioned successfully", "organization": payload}
"""

    if "/api/v1/admin/organizations/save" not in code:
        code += "\n\n" + org_endpoint_code
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)
        print("Backend route /api/v1/admin/organizations/save added.")
    else:
        print("Backend route already exists.")
