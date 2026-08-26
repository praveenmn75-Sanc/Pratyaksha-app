import os

filepath = "src/components/AdminConsole.jsx"
if os.path.exists(filepath):
    revamped_admin_code = """import React, { useState, useEffect } from 'react';
import { Building2, UserCheck, MapPin, Camera, Key, Check, ShieldCheck, Cpu, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname || 'localhost'}:8005/api/v1`;

const AI_MODULE_OPTIONS = [
  'Traffic - ANPR & ATCC',
  'FACE REC',
  'WildWatch',
  'Perimeter Intrusion',
  'Fire & Smoke'
];

export default function AdminConsole() {
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cameras, setCameras] = useState([]);

  // Wizard Step State (1 to 4)
  const [wizardStep, setWizardStep] = useState(1);

  // Step 1 State
  const [orgName, setOrgName] = useState('');
  const [tenantCode, setTenantCode] = useState('');

  // Step 2 State
  const [ssoEmail, setSsoEmail] = useState('');
  const [ssoPassword, setSsoPassword] = useState('');

  // Step 3 State
  const [selectedModules, setSelectedModules] = useState(['Traffic - ANPR & ATCC']);

  // Step 4 State
  const [maxCameras, setMaxCameras] = useState(16);
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState('');

  // User Form State
  const [selectedUserOrg, setSelectedUserOrg] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Org Admin');

  // Area Form State
  const [selectedAreaOrg, setSelectedAreaOrg] = useState('');
  const [parentArea, setParentArea] = useState('');
  const [subArea, setSubArea] = useState('');

  // Camera Form State
  const [selectedCamOrg, setSelectedCamOrg] = useState('');
  const [camName, setCamName] = useState('');
  const [camRtsp, setCamRtsp] = useState('');
  const [camModule, setCamModule] = useState('Traffic - ANPR & ATCC');

  const fetchAllData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/admin/organizations`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/users`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/areas`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/cameras`).then(r => r.json()).catch(() => [])
    ]).then(([orgs, usrs, ars, cams]) => {
      setOrganizations(Array.isArray(orgs) ? orgs : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
      setAreas(Array.isArray(ars) ? ars : []);
      setCameras(Array.isArray(cams) ? cams : []);
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleModule = (mod) => {
    if (selectedModules.includes(mod)) {
      if (selectedModules.length > 1) {
        setSelectedModules(selectedModules.filter(m => m !== mod));
      }
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const generateLicense = () => {
    const code = (tenantCode || 'ORG').toUpperCase();
    const key = `PRATYAKSHA-LIC-${code}-${maxCameras}CAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    setGeneratedLicenseKey(key);
  };

  const handleSaveOrganization = () => {
    if (!orgName || !tenantCode) return;
    const licenseKey = generatedLicenseKey || `PRATYAKSHA-LIC-${tenantCode.toUpperCase()}-16CAM-KEY2026`;
    const payload = {
      id: `org_${Date.now()}`,
      orgName,
      tenantCode,
      ssoEmail,
      ssoPassword,
      allowedModules: selectedModules,
      maxCameras: Number(maxCameras),
      licenseKey,
      status: 'LICENSED'
    };

    fetch(`${API_BASE_URL}/admin/organizations/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      fetchAllData();
      setWizardStep(1);
      setOrgName('');
      setTenantCode('');
      setSsoEmail('');
      setSsoPassword('');
      setGeneratedLicenseKey('');
    });
  };

  const handleSaveUser = () => {
    if (!userName || !userEmail) return;
    const payload = {
      id: `usr_${Date.now()}`,
      orgId: selectedUserOrg || (organizations[0] ? organizations[0].id : 'org_tzp'),
      fullName: userName,
      officerEmail: userEmail,
      role: userRole
    };
    fetch(`${API_BASE_URL}/admin/users/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      fetchAllData();
      setUserName('');
      setUserEmail('');
    });
  };

  const handleSaveArea = () => {
    if (!parentArea) return;
    const payload = {
      id: `area_${Date.now()}`,
      orgId: selectedAreaOrg || (organizations[0] ? organizations[0].id : 'org_tzp'),
      parentArea,
      subAreas: subArea ? [subArea] : ['Main Sector']
    };
    fetch(`${API_BASE_URL}/admin/areas/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      fetchAllData();
      setParentArea('');
      setSubArea('');
    });
  };

  const handleSaveCamera = () => {
    if (!camName || !camRtsp) return;
    const payload = {
      id: `cam_${Date.now()}`,
      orgId: selectedCamOrg || (organizations[0] ? organizations[0].id : 'org_tzp'),
      camName,
      rtsp: camRtsp,
      appModule: camModule,
      area: 'Orientation Centre',
      lat: 10.5276,
      lng: 76.2144,
      status: 'ACTIVE'
    };
    fetch(`${API_BASE_URL}/admin/cameras/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      fetchAllData();
      setCamName('');
      setCamRtsp('');
    });
  };

  const handleDeleteOrg = (id) => {
    fetch(`${API_BASE_URL}/admin/organizations/delete/${id}`, { method: 'DELETE' }).then(fetchAllData);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* HEADER BAR */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-5 shadow-2xl flex items-center justify-between">
        <div>
          <h1 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={18} /> ADMIN CONSOLE
          </h1>
          <p className="text-slate-400 text-[10px]">Multi-Tenant Onboarding, AI Module Licensing &amp; Edge GIS Node Provisioning</p>
        </div>
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold rounded-xl text-[10px]">
          ROLE: SUPER ADMIN
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CARD 1: ORGANISATIONS & LICENSING (4-STEP WIZARD) */}
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} /> 1. ORGANISATIONS &amp; LICENSING
              </h2>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                Step {wizardStep} of 4
              </span>
            </div>

            {/* WIZARD STEP 1: GENERAL INFO */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Organisation Name</label>
                  <input 
                    type="text"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Kerala Forest Department"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Tenant Code (Short Ident)</label>
                  <input 
                    type="text"
                    value={tenantCode}
                    onChange={e => setTenantCode(e.target.value)}
                    placeholder="e.g. KFD"
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2.5 rounded-xl outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>
            )}

            {/* WIZARD STEP 2: SSO AUTHENTICATION */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Primary Officer SSO Email</label>
                  <input 
                    type="email"
                    value={ssoEmail}
                    onChange={e => setSsoEmail(e.target.value)}
                    placeholder="officer@kfd.gov.in"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">SSO Master Password</label>
                  <input 
                    type="password"
                    value={ssoPassword}
                    onChange={e => setSsoPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* WIZARD STEP 3: AI MODULE SELECTION */}
            {wizardStep === 3 && (
              <div className="space-y-3 animate-in fade-in">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Permissible AI Application Engines</label>
                <div className="grid grid-cols-1 gap-2">
                  {AI_MODULE_OPTIONS.map(mod => {
                    const isChecked = selectedModules.includes(mod);
                    return (
                      <div 
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isChecked ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-extrabold">{mod}</span>
                        {isChecked && <Check size={14} className="text-cyan-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WIZARD STEP 4: CAMERA LIMITS & LICENSE KEY GENERATION */}
            {wizardStep === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Permissible Max Camera Channels</label>
                  <select 
                    value={maxCameras}
                    onChange={e => setMaxCameras(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-extrabold p-2.5 rounded-xl outline-none"
                  >
                    <option value={8}>8 Camera Stream Channels</option>
                    <option value={16}>16 Camera Stream Channels</option>
                    <option value={32}>32 Camera Stream Channels</option>
                    <option value={64}>64 Enterprise Channels</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 text-[10px] font-bold uppercase">Cryptographic License Key</label>
                    <button 
                      onClick={generateLicense}
                      className="text-[10px] text-cyan-400 font-extrabold underline cursor-pointer"
                    >
                      Generate Key
                    </button>
                  </div>
                  <input 
                    type="text"
                    readOnly
                    value={generatedLicenseKey || `PRATYAKSHA-LIC-${(tenantCode || 'TZP').toUpperCase()}-${maxCameras}CAM-KEY2026`}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold p-2.5 rounded-xl outline-none text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WIZARD NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {wizardStep > 1 ? (
              <button 
                onClick={() => setWizardStep(s => s - 1)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}

            {wizardStep < 4 ? (
              <button 
                onClick={() => setWizardStep(s => s + 1)}
                className="px-5 py-2 bg-cyan-500 text-slate-950 font-extrabold rounded-xl flex items-center gap-1 cursor-pointer hover:bg-cyan-400"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                onClick={handleSaveOrganization}
                className="px-5 py-2 bg-emerald-500 text-slate-950 font-extrabold rounded-xl flex items-center gap-1 cursor-pointer hover:bg-emerald-400"
              >
                <ShieldCheck size={14} /> Provision Tenant &amp; License
              </button>
            )}
          </div>

          {/* ACTIVE ORGANISATIONS LIST */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Active Registered Tenants ({organizations.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {organizations.map(org => (
                <div key={org.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-white text-xs">{org.orgName} ({org.tenantCode})</div>
                    <div className="text-slate-500 text-[10px]">Max Cams: {org.maxCameras || 16} | License: {org.licenseKey ? org.licenseKey.substring(0, 24) + '...' : 'ACTIVE'}</div>
                  </div>
                  <button onClick={() => handleDeleteOrg(org.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CARD 2: USER ROLES & ACCESS TREE */}
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserCheck size={16} /> 2. USER ROLES &amp; ACCESS TREE
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Select Organisation Tenant</label>
                <select 
                  value={selectedUserOrg}
                  onChange={e => setSelectedUserOrg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.orgName} ({o.tenantCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Officer Name"
                  className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none"
                />
                <input 
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="officer@domain.com"
                  className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button onClick={handleSaveUser} className="px-5 py-2 bg-amber-500 text-slate-950 font-extrabold rounded-xl cursor-pointer hover:bg-amber-400">
              Save User Account
            </button>
          </div>
        </div>

        {/* CARD 3: AREAS & SUB-AREAS SETUP */}
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <MapPin size={16} /> 3. AREAS &amp; SUB-AREAS SETUP
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Select Organisation</label>
                <select 
                  value={selectedAreaOrg}
                  onChange={e => setSelectedAreaOrg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.orgName} ({o.tenantCode})</option>
                  ))}
                </select>
              </div>

              <input 
                type="text"
                value={parentArea}
                onChange={e => setParentArea(e.target.value)}
                placeholder="e.g. Orientation Centre"
                className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button onClick={handleSaveArea} className="px-5 py-2 bg-emerald-500 text-slate-950 font-extrabold rounded-xl cursor-pointer hover:bg-emerald-400">
              Save Area Division
            </button>
          </div>
        </div>

        {/* CARD 4: CAMERA & GIS EDGE NODE SETUP */}
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Camera size={16} /> 4. CAMERA &amp; GIS EDGE NODE SETUP
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={selectedCamOrg}
                  onChange={e => setSelectedCamOrg(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.orgName}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  value={camName}
                  onChange={e => setCamName(e.target.value)}
                  placeholder="ANPR_ENTRY_C1"
                  className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none"
                />
              </div>

              <input 
                type="text"
                value={camRtsp}
                onChange={e => setCamRtsp(e.target.value)}
                placeholder="rtsp://192.168.100.229:554/profile1"
                className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-mono p-2.5 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button onClick={handleSaveCamera} className="px-5 py-2 bg-purple-500 text-slate-950 font-extrabold rounded-xl cursor-pointer hover:bg-purple-400">
              Provision Camera Stream
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(revamped_admin_code)
    print("AdminConsole.jsx updated with 4-Step Licensing Wizard.")
