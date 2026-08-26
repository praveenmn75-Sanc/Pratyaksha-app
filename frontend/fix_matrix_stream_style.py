import os

filepath = "src/components/LiveMatrix.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Ensure stream image fills the entire tile container
    old_img_tag = 'className="w-full h-full object-cover select-none"'
    new_img_tag = 'className="absolute inset-0 w-full h-full object-cover select-none z-0"'
    
    if old_img_tag in code:
        code = code.replace(old_img_tag, new_img_tag)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("LiveMatrix.jsx stream container styling updated.")
else:
    print("File not found:", filepath)
