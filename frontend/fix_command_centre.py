import os

filepath = "src/components/CommandCentre.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace risky property access with optional chaining and fallback values
    updated = content.replace("telemetry.cpu.percent", "telemetry?.cpu?.percent ?? telemetry?.cpu_usage ?? 0")
    updated = updated.replace("telemetry.ram.percent", "telemetry?.ram?.percent ?? telemetry?.ram_usage ?? 0")
    updated = updated.replace("telemetry.gpu.temp", "telemetry?.gpu?.temp ?? telemetry?.gpu_temp ?? 0")
    
    # Generic safety check if telemetry properties are directly accessed
    updated = updated.replace("telemetry.cpu", "(telemetry?.cpu || {})")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(updated)
    print("CommandCentre.jsx patched successfully.")
else:
    print("File not found:", filepath)
