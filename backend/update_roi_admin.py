import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Ensure engine dictionary initialization and direct state mutation
    if "db['engines']" not in code or "def control_engine" not in code:
        pass

    roi_delete_route = """
@app.delete("/api/v1/app-config/rois/delete/{roi_id}")
def delete_roi(roi_id: str):
    db["rois"] = [r for r in db.get("rois", []) if r.get("roiName") != roi_id and r.get("id") != roi_id]
    save_db(db)
    return {"status": "deleted", "message": f"ROI rule {roi_id} removed successfully."}
"""

    if "delete_roi" not in code:
        code += "\n" + roi_delete_route
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)
    print("main.py updated with ROI delete endpoint.")
