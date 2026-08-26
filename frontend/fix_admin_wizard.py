import os

filepath = "src/components/AdminConsole.jsx"
if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Locate and patch Onboard Organisation action
    old_btn = 'onClick={handleOnboardOrg}'
    
    if "const handleOnboardOrg" not in code:
        # Inject handleOnboardOrg handler function
        handler_code = """
  const handleOnboardOrg = () => {
    if (!orgName || !tenantCode) {
      alert("Please fill in Organisation Name and Tenant Code.");
      return;
    }

    const payload = {
      id: `org_${Date.now()}`,
      orgName: orgName,
      tenantCode: tenantCode,
      ssoEmail: ssoEmail || `${tenantCode.toLowerCase()}@suryasanc.in`
    };

    fetch(`${API_BASE_URL}/admin/organizations/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(res => {
        if (setSuccessMsg) setSuccessMsg(res.message || "Organisation Onboarded Successfully!");
        setOrgName('');
        setTenantCode('');
        setSsoEmail('');
        setOrgStep(1);
        fetchAllData();
      });
  };
"""
        code = code.replace("export default function AdminConsole", handler_code + "\nexport default function AdminConsole")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("AdminConsole.jsx wizard submit logic updated.")
else:
    print("File not found:", filepath)
