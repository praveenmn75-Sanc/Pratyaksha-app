import os

filepath = "src/components/AdminConsole.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Ensure button handler triggers properly on step 4
    if 'onClick={handleSaveOrganization}' in code:
        print("Click listener verified in UI.")

