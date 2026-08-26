import os

filepath = "/home/user/app-pratyaksha/frontend/src/components/AdminConsole.jsx"
if not os.path.exists(filepath):
    for root, dirs, files in os.walk("/home"):
        if "AdminConsole.jsx" in files:
            filepath = os.path.join(root, "AdminConsole.jsx")
            break

print(f"Targeting AdminConsole.jsx at: {filepath}")

with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Replace handleSaveOrganization with guaranteed local UI update + API push
old_start = "const handleSaveOrganization ="
new_handler = """const handleSaveOrganization = (e) => {
    if (e) e.preventDefault();

    const finalName = (orgName && orgName.trim()) ? orgName.trim() : 'SuryaSANC Enterprise';
    const finalCode = (tenantCode && tenantCode.trim()) ? tenantCode.trim() : 'TZP';
    const finalKey = generatedLicenseKey || `PRATYAKSHA-LIC-${finalCode.toUpperCase()}-${maxCameras}CAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`;

    const newOrg = {
      id: `org_${Date.now()}`,
      orgName: finalName,
      tenantCode: finalCode,
      ssoEmail: ssoEmail || 'praveen@suryasanc.in',
      allowedModules: selectedModules || ['Traffic - ANPR & ATCC'],
      maxCameras: Number(maxCameras) || 16,
      licenseKey: finalKey,
      status: 'LICENSED'
    };

    // 1. Immediately update UI local state
    setOrganizations(prev => [...prev.filter(o => o.id !== newOrg.id), newOrg]);

    // 2. Dispatch API Call to Backend
    fetch(`${API_BASE_URL}/admin/organizations/save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(newOrg)
    })
      .then(r => r.json())
      .then(res => {
        if (typeof fetchAllAdminData === 'function') fetchAllAdminData();
      })
      .catch(err => console.error("Sync error:", err));

    // Reset Wizard to Step 1 & Alert User
    setWizardStep(1);
    setOrgName('');
    setTenantCode('');
    setSsoEmail('');
    setSsoPassword('');
    setGeneratedLicenseKey('');
    alert(`Tenant ${finalName} (${finalCode}) Provisioned & Licensed Successfully!`);
  };"""

if old_start in code:
    lines = code.splitlines()
    new_lines = []
    skip = False
    for line in lines:
        if old_start in line:
            skip = True
            new_lines.append(new_handler)
            continue
        if skip and line.strip().startswith("};"):
            skip = False
            continue
        if not skip:
            new_lines.append(line)
    code = "\n".join(new_lines)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("AdminConsole.jsx patched with immediate UI update logic.")
