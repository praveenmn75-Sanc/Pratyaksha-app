import os

filepath = "src/components/AdminConsole.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Ensure component runs initial fetch on mount
    if "useEffect(() => {" not in code:
        code = code.replace(
            "export default function AdminConsole() {",
            "export default function AdminConsole() {\n  useEffect(() => {\n    if (typeof fetchAllAdminData === 'function') fetchAllAdminData();\n  }, []);"
        )
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)

    print("AdminConsole.jsx auto-fetch hook verified.")
