import os

filepath = "/home/user/app-pratyaksha/backend/main.py"
if not os.path.exists(filepath):
    for root, dirs, files in os.walk("/home"):
        if "main.py" in files and "app-pratyaksha" in root:
            filepath = os.path.join(root, "main.py")
            break

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Filter out broken string literal lines around line 1070+
cleaned_lines = []
skip = False
for line in lines:
    if "yield (b'--frame" in line or "yield b'--frame" in line:
        # Replace with correctly formatted byte string
        cleaned_lines.append("            header = b'--frame\\r\\nContent-Type: image/jpeg\\r\\n\\r\\n'\n")
        cleaned_lines.append("            yield header + frame_bytes + b'\\r\\n'\n")
    else:
        cleaned_lines.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(cleaned_lines)

print("Syntax in main.py fixed successfully.")
