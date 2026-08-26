import os

filepath = "src/components/CommandCentre.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace unsafe RAM property accesses
    updated = content.replace("telemetry.ram.used_gb", "telemetry?.ram?.used_gb ?? telemetry?.ram_usage ?? 0")
    updated = updated.replace("telemetry.ram.percent", "telemetry?.ram?.percent ?? telemetry?.ram_usage ?? 0")
    updated = updated.replace("telemetry.ram", "(telemetry?.ram || {})")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(updated)
    print("CommandCentre.jsx RAM patch applied successfully.")
else:
    print("File not found:", filepath)
