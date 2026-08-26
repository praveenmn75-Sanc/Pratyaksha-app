import os

# 1. Update CommandCentre.jsx for OpenStreetMap tiles & camera counts
cc_path = "src/components/CommandCentre.jsx"
if os.path.exists(cc_path):
    with open(cc_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Replace CartoDB restricted map tiles with public OpenStreetMap tiles
    old_tile = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    new_tile = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    if old_tile in code:
        code = code.replace(old_tile, new_tile)
    
    # Also fallback to standard OSM tile URL if any other carto variant exists
    code = code.replace("carto.com/basemaps/apikey", "openstreetmap.org")

    with open(cc_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("CommandCentre.jsx map tiles updated.")

# 2. Update AdminConsole.jsx state sync
ac_path = "src/components/AdminConsole.jsx"
if os.path.exists(ac_path):
    with open(ac_path, "r", encoding="utf-8") as f:
        code = f.read()

    admin_fetch_patch = """
  const fetchAllAdminData = () => {
    const base = `http://${window.location.hostname || 'localhost'}:8005/api/v1`;
    Promise.all([
      fetch(`${base}/admin/organizations`).then(r => r.json()).catch(() => []),
      fetch(`${base}/admin/users`).then(r => r.json()).catch(() => []),
      fetch(`${base}/admin/areas`).then(r => r.json()).catch(() => []),
      fetch(`${base}/admin/cameras`).then(r => r.json()).catch(() => [])
    ]).then(([orgs, usrs, ars, cams]) => {
      if (Array.isArray(orgs)) setOrganizations(orgs);
      if (Array.isArray(usrs)) setUsers(usrs);
      if (Array.isArray(ars)) setAreas(ars);
      if (Array.isArray(cams)) setCameras(cams);
    });
  };
"""
    if "const fetchAllAdminData" not in code:
        code = code.replace("export default function AdminConsole() {", "export default function AdminConsole() {\n" + admin_fetch_patch)
        with open(ac_path, "w", encoding="utf-8") as f:
            f.write(code)
    print("AdminConsole.jsx API data fetcher patched.")
