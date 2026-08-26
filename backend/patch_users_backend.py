import os

filepath = "/home/user/app-pratyaksha/backend/main.py"
if not os.path.exists(filepath):
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            filepath = os.path.join(root, "main.py")
            break

with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

user_endpoints = """
@app.post("/api/v1/admin/users/save")
def save_user(payload: dict):
    if "users" not in db or not isinstance(db["users"], list):
        db["users"] = []
    
    usr_id = payload.get("id") or f"usr_{int(time.time() * 1000)}"
    payload["id"] = usr_id
    if not payload.get("password"):
        payload["password"] = "Admin@123"  # Default password
    
    # Update existing user or append new user
    db["users"] = [u for u in db["users"] if u.get("id") != usr_id]
    db["users"].append(payload)
    save_db(db)
    return {"status": "ok", "message": "User saved successfully", "user": payload}

@app.delete("/api/v1/admin/users/delete/{user_id}")
def delete_user(user_id: str):
    if "users" in db:
        db["users"] = [u for u in db["users"] if u.get("id") != user_id]
        save_db(db)
    return {"status": "ok", "message": "User removed successfully"}

@app.post("/api/v1/admin/users/reset-password")
def reset_user_password(payload: dict):
    user_id = payload.get("id")
    new_pass = payload.get("password", "Reset@123")
    if "users" in db:
        for u in db["users"]:
            if u.get("id") == user_id:
                u["password"] = new_pass
                break
        save_db(db)
    return {"status": "ok", "message": "Password reset successfully"}
"""

if "/api/v1/admin/users/reset-password" not in code:
    code += "\n\n" + user_endpoints
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Backend User management endpoints added.")
else:
    print("Backend endpoints already exist.")
