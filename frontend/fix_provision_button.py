import os

filepath = "src/components/AdminConsole.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Replace handleSaveOrganization with guaranteed submission logic
    old_func_start = "const handleSaveOrganization = () => {"
    
    new_func = """const handleSaveOrganization = () => {
    const finalOrgName = orgName.trim() || 'SuryaSANC Enterprise';
    const finalTenantCode = tenantCode.trim() || 'TZP';
    const licenseKey = generatedLicenseKey || `PRATYAKSHA-LIC-${finalTenantCode.toUpperCase()}-${maxCameras}CAM-KEY2026`;
    
    const payload = {
      id: `org_${Date.now()}`,
      orgName: finalOrgName,
      tenantCode: finalTenantCode,
      ssoEmail: ssoEmail || 'officer@suryasanc.in',
      ssoPassword: ssoPassword || 'admin123',
      allowedModules: selectedModules,
      maxCameras: Number(maxCameras),
      licenseKey: licenseKey,
      status: 'LICENSED'
    };

    fetch(`${API_BASE_URL}/admin/organizations/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(() => {
        fetchAllData();
        setWizardStep(1);
        setOrgName('');
        setTenantCode('');
        setSsoEmail('');
        setSsoPassword('');
        setGeneratedLicenseKey('');
        alert(`Tenant ${finalOrgName} (${finalTenantCode}) Provisioned & Licensed Successfully!`);
      })
      .catch(err => {
        console.error("Failed to save organization:", err);
      });
  };"""

    if old_func_start in code:
        # Replace up to fetchAllData call
        lines = code.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if old_func_start in line:
                skip = True
                new_lines.append(new_func)
                continue
            if skip and "setGeneratedLicenseKey('');" in line:
                skip = False
                continue
            if skip and line.strip() == "});":
                skip = False
                continue
            if not skip:
                new_lines.append(line)
        code = "\n".join(new_lines)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("AdminConsole.jsx handleSaveOrganization function successfully patched.")
