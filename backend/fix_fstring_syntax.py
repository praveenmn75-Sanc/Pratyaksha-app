import os

filepath = "/home/user/app-pratyaksha/backend/main.py"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

cleaned_lines = []
for line in lines:
    if 'detected_ocr = f"' in line and '""' in line:
        # Fix quote collision in Python 3.10 f-string
        line = '    detected_ocr = f"{random.choice(kerala_districts)} {\'\'.join(random.choices(\'ABCDEFGHJKLMNPQRSTUVWXYZ\', k=2))} {random.randint(1000, 9999)}"\n'
    cleaned_lines.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(cleaned_lines)

print("Line 790 quote syntax repaired.")
