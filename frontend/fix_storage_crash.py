import os

filepath = "src/components/CommandCentre.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace unsafe storage property accesses
    updated = content.replace("telemetry.storage.percent", "telemetry?.storage?.percent ?? telemetry?.storage_usage ?? 0")
    updated = updated.replace("telemetry.storage.used_gb", "telemetry?.storage?.used_gb ?? 0")
    updated = updated.replace("telemetry.storage.total_gb", "telemetry?.storage?.total_gb ?? 0")
    updated = updated.replace("telemetry.storage", "(telemetry?.storage || {})")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(updated)
    print("CommandCentre.jsx Storage patch applied successfully.")
else:
    print("File not found:", filepath)
