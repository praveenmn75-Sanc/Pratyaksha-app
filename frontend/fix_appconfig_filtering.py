import os

filepath = "src/components/AppConfig.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Robust camera matching by Org ID, Tenant Code, or Org Name
    old_filter = """  const availableCameras = allCameras.filter(c => {
    const matchesOrg = !selectedOrgId || 
                       c.orgId === selectedOrgId || 
                       (currentOrg && (c.orgId === currentOrg.id || c.orgId === currentOrg.tenantCode || c.orgId === currentOrg.orgName));
    const matchesApp = c.appModule === activeApp || !c.appModule;
    return matchesOrg && matchesApp;
  });"""

    new_filter = """  const availableCameras = allCameras.filter(c => {
    if (!selectedOrgId || selectedOrgId === 'All Orgs') return true;
    const orgMatches = c.orgId === selectedOrgId || 
                       (currentOrg && (c.orgId === currentOrg.id || c.orgId === currentOrg.tenantCode || c.orgId === currentOrg.orgName));
    return orgMatches;
  });"""

    if old_filter in code:
        code = code.replace(old_filter, new_filter)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)
        print("AppConfig.jsx camera filtering patched successfully.")
    else:
        print("Filter code pattern not found, updating directly.")
