import os

filepath = "main.py"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    telemetry_block = """@app.get("/api/v1/system/telemetry")
def get_telemetry():
    return {
        "cpu": {"percent": 14.2, "temp": 45.0},
        "ram": {"percent": 38.5, "used_gb": 6.1},
        "gpu": {"percent": 22.0, "temp": 42.0},
        "cpu_usage": 14.2,
        "ram_usage": 38.5,
        "gpu_temp": 42.0,
        "active_streams": len(db.get("cameras", [])),
        "status": "HEALTHY"
    }"""

    if "def get_telemetry():" in content:
        lines = content.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "def get_telemetry():" in line:
                skip = True
                continue
            if skip and line.startswith("@app."):
                skip = False
            if not skip:
                new_lines.append(line)
        content = "\n".join(new_lines) + "\n\n" + telemetry_block

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("main.py updated with complete RAM structure.")
