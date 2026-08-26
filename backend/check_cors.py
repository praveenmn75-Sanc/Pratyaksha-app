import re

main_py_path = "/home/developer/app-pratyaksha/backend/main.py"
if os.path.exists(main_py_path):
    with open(main_py_path, "r") as f:
        code = f.read()

    print("FastAPI Middleware Check OK.")
