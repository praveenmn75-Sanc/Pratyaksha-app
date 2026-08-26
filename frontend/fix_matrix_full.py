import os

filepath = "src/components/LiveMatrix.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Ensure stream image fills the entire tile container
    code = code.replace(
        'className="w-full h-full object-cover select-none"',
        'className="absolute inset-0 w-full h-full object-cover select-none z-0"'
    )
    code = code.replace(
        'className="w-full h-full object-cover opacity-80 select-none"',
        'className="absolute inset-0 w-full h-full object-cover select-none z-0"'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("LiveMatrix.jsx image dimensions updated to absolute inset-0.")
else:
    print("File not found:", filepath)
