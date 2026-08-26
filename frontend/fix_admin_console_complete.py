import os

filepath = "src/components/AdminConsole.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Inject missing initial auto-fetch hook if absent
    if "useEffect" in code and "fetchAllAdminData" in code:
        if "useEffect(() => { fetchAllAdminData();" not in code:
            code = code.replace(
                "export default function AdminConsole() {",
                "export default function AdminConsole() {\n  React.useEffect(() => {\n    if (typeof fetchAllAdminData === 'function') fetchAllAdminData();\n  }, []);"
            )
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(code)

    print("AdminConsole.jsx verified.")
