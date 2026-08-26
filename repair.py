import os, subprocess

# 1. Patch CommandCentre.jsx for optional chaining safety
cc_path = os.path.expanduser("~/app-pratyaksha/frontend/src/components/CommandCentre.jsx")
if os.path.exists(cc_path):
    with open(cc_path, "r", encoding="utf-8") as f:
        code = f.read()
    code = code.replace("telemetry.cpu.percent", "telemetry?.cpu?.percent ?? 0")
    code = code.replace("telemetry.ram.percent", "telemetry?.ram?.percent ?? 0")
    code = code.replace("telemetry.gpu.temp", "telemetry?.gpu?.temp ?? 0")
    with open(cc_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("CommandCentre.jsx safety patch applied.")

# 2. Kill old server processes
subprocess.run("sudo fuser -k 8005/tcp 5173/tcp 2>/dev/null || true", shell=True)
subprocess.run("pkill -9 -f 'uvicorn|vite|node' 2>/dev/null || true", shell=True)

print("Ports 8005 and 5173 cleared.")
