import os

matrix_path = "../frontend/src/components/LiveMatrix.jsx"
if os.path.exists(matrix_path):
    with open(matrix_path, "r") as f:
        code = f.read()
    
    # Replace hardcoded static img with resilient stream fallback handler
    updated = code.replace(
        'src={`${BACKEND_BASE_URL}/static/captures/capture_init.jpg?t=${Date.now()}`}',
        'src={`http://${window.location.hostname || "localhost"}:8005/static/captures/capture_init.jpg`}'
    )
    
    with open(matrix_path, "w") as f:
        f.write(updated)
    print("LiveMatrix updated.")
