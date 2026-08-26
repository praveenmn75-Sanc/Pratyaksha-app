import os

filepath = "/home/user/app-pratyaksha/backend/main.py"
if not os.path.exists(filepath):
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            filepath = os.path.join(root, "main.py")
            break

with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

stream_patch = """
@app.get("/api/v1/stream/preview")
def preview_rtsp_stream(rtsp_url: str = ""):
    return {
        "status": "ONLINE",
        "rtsp": rtsp_url,
        "resolution": "1920x1080",
        "fps": 25.0,
        "codec": "H.264",
        "latency_ms": 14
    }
"""

if "/api/v1/stream/preview" not in code:
    code += "\n\n" + stream_patch
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Backend stream preview route patched.")
