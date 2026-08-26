import os

filepath = "src/components/CommandCentre.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Apply defensive optional chaining for GPU access
    updated = content.replace("telemetry.gpu.percent", "telemetry?.gpu?.percent ?? telemetry?.gpu_usage ?? 0")
    updated = updated.replace("telemetry.gpu.temp", "telemetry?.gpu?.temp ?? telemetry?.gpu_temp ?? 0")
    updated = updated.replace("telemetry.gpu", "(telemetry?.gpu || {})")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(updated)
    print("CommandCentre.jsx GPU patch applied successfully.")
else:
    print("File not found:", filepath)
