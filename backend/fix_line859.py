import os

filepath = "/home/user/app-pratyaksha/backend/main.py"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

cleaned = []
for i, line in enumerate(lines):
    # Fix broken yield byte statements around line 850-870
    if "b'Content-Type: image/jpeg" in line:
        line = "            yield (b'--frame\\r\\nContent-Type: image/jpeg\\r\\n\\r\\n' + buffer.tobytes() + b'\\r\\n')\n"
    elif "b'--frame" in line and ")" in line and i > 840 and i < 900:
        line = "            yield (b'--frame\\r\\nContent-Type: image/jpeg\\r\\n\\r\\n' + frame_bytes + b'\\r\\n')\n"
    cleaned.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(cleaned)

print("Line 859 cleaned.")
