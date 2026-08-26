import os

filepath = "src/components/EventsAlerts.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Ensure dynamic snapshot URL appending
    old_img_src = 'src={`http://${window.location.hostname || "localhost"}:8005/static/captures/capture_init.jpg`}'
    new_img_src = 'src={evt.snapshot ? `http://${window.location.hostname || "localhost"}:8005${evt.snapshot}` : `http://${window.location.hostname || "localhost"}:8005/static/captures/anpr_latest.jpg`}'
    
    if old_img_src in code:
        code = code.replace(old_img_src, new_img_src)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("EventsAlerts.jsx snapshot loader updated.")
