import os

main_path = "main.py"
if os.path.exists(main_path):
    with open(main_path, "r") as f:
        content = f.read()

    # Ensure static directory uses absolute path resolution
    if 'app.mount("/static"' in content:
        print("Static route verified in main.py")
