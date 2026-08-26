import React, { useState, useEffect } from 'react';
import { 
  Building2, UserCheck, MapPin, Camera, Check, ShieldCheck, 
  ChevronRight, ChevronLeft, Trash2, Edit, Play, X, Video, Activity, Wifi, Compass
} from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

const AI_MODULE_OPTIONS = [
  'Traffic - ANPR & ATCC',
  'FACE REC',
  'WildWatch',
  'Perimeter Intrusion',
  'Fire & Smoke'
];

const DEFAULT_ORGS = [{ id: 'org_tzp', orgName: 'SuryaSANC Enterprise', tenantCode: 'TZP', maxCameras: 64, licenseKey: 'PRATYAKSHA-LIC-TZP-64CAM-KEY2026', status: 'LICENSED' }];
const DEFAULT_USERS = [{ id: 'usr_tzp_dcf', orgId: 'org_tzp', fullName: 'TZP_DCF', officerEmail: 'sales@suryasanc.in', password: 'admin123', role: 'Org Admin' }];
const DEFAULT_AREAS = [{ id: 'area_tzp', orgId: 'org_tzp', parentArea: 'TZP', subAreas: ['TZP_OC'] }];
const DEFAULT_CAMS = [{ id: 'cam_anpr_entry', orgId: 'org_tzp', area: 'TZP', subArea: 'TZP_OC', camName: 'ANPR_TEST_ENTRY', rtsp: 'rtsp://192.168.100.229:554/profile1', appModule: 'Traffic - ANPR & ATCC', status: 'ACTIVE', lat: '10.5276', lng: '76.2144' }];

export default function AdminConsole() {
  const [organizations, setOrganizations] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_orgs');
    return saved ? JSON.parse(saved) : DEFAULT_ORGS;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [areas, setAreas] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_areas');
    return saved ? JSON.parse(saved) : DEFAULT_AREAS;
  });

  const [cameras, setCameras] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_cams');
    return saved ? JSON.parse(saved) : DEFAULT_CAMS;
  });

  useEffect(() => { localStorage.setItem('pratyaksha_orgs', JSON.stringify(organizations)); }, [organizations]);
  useEffect(() => { localStorage.setItem('pratyaksha_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('pratyaksha_areas', JSON.stringify(areas)); }, [areas]);
  useEffect(() => { localStorage.setItem('pratyaksha_cams', JSON.stringify(cameras)); }, [cameras]);

  const [wizardStep, setWizardStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [ssoEmail, setSsoEmail] = useState('');
  const [ssoPassword, setSsoPassword] = useState('');
  const [selectedModules, setSelectedModules] = useState(['Traffic - ANPR & ATCC']);
  const [maxCameras, setMaxCameras] = useState(16);
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState('');

  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedUserOrg, setSelectedUserOrg] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('Org Admin');

  const [editingAreaId, setEditingAreaId] = useState(null);
  const [selectedAreaOrg, setSelectedAreaOrg] = useState('');
  const [parentArea, setParentArea] = useState('');
  const [subAreaName, setSubAreaName] = useState('');

  // Card 4: Camera Setup State with GIS LAT / LONG
  const [editingCamId, setEditingCamId] = useState(null);
  const [selectedCamOrg, setSelectedCamOrg] = useState('');
  const [selectedCamArea, setSelectedCamArea] = useState('');
  const [selectedCamSubArea, setSelectedCamSubArea] = useState('');
  const [camName, setCamName] = useState('');
  const [camRtsp, setCamRtsp] = useState('rtsp://192.168.100.229:554/profile1');
  const [camModule, setCamModule] = useState('Traffic - ANPR & ATCC');
  const [camLat, setCamLat] = useState('10.5276');
  const [camLng, setCamLng] = useState('76.2144');
  const [testingStreamUrl, setTestingStreamUrl] = useState(null);
  const [previewFrameCount, setPreviewFrameCount] = useState(0);

  const fetchAllAdminData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/admin/organizations`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/admin/users`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/admin/areas`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/admin/cameras`).then(r => r.json()).catch(() => null)
    ]).then(([orgs, usrs, ars, cams]) => {
      if (Array.isArray(orgs) && orgs.length > 0) setOrganizations(orgs);
      if (Array.isArray(usrs) && usrs.length > 0) setUsers(usrs);
      if (Array.isArray(ars) && ars.length > 0) setAreas(ars);
      if (Array.isArray(cams) && cams.length > 0) setCameras(cams);
    });
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  useEffect(() => {
    if (organizations.length > 0) {
      if (!selectedUserOrg) setSelectedUserOrg(organizations[0].id);
      if (!selectedAreaOrg) setSelectedAreaOrg(organizations[0].id);
      if (!selectedCamOrg) setSelectedCamOrg(organizations[0].id);
    }
    if (areas.length > 0) {
      if (!selectedCamArea) setSelectedCamArea(areas[0].parentArea);
      if (areas[0].subAreas && areas[0].subAreas.length > 0 && !selectedCamSubArea) {
        setSelectedCamSubArea(areas[0].subAreas[0]);
      }
    }
  }, [organizations, areas]);

  useEffect(() => {
    let interval;
    if (testingStreamUrl) {
      interval = setInterval(() => { setPreviewFrameCount(prev => prev + 1); }, 40);
    } else {
      setPreviewFrameCount(0);
    }
    return () => clearInterval(interval);
  }, [testingStreamUrl]);

  const getSubAreasForSelectedArea = () => {
    const found = areas.find(a => a.parentArea === selectedCamArea);
    if (found && Array.isArray(found.subAreas) && found.subAreas.length > 0) {
      return found.subAreas;
    }
    return ['TZP_OC'];
  };

  const handleParentAreaChange = (newAreaName) => {
    setSelectedCamArea(newAreaName);
    const found = areas.find(a => a.parentArea === newAreaName);
    if (found && Array.isArray(found.subAreas) && found.subAreas.length > 0) {
      setSelectedCamSubArea(found.subAreas[0]);
    }
  };

  const toggleModule = (mod) => {
    if (selectedModules.includes(mod)) {
      if (selectedModules.length > 1) setSelectedModules(selectedModules.filter(m => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const generateLicense = () => {
    const code = (tenantCode || 'TZP').toUpperCase();
    const key = `PRATYAKSHA-LIC-${code}-${maxCameras}CAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    setGeneratedLicenseKey(key);
  };

  const handleSaveOrganization = (e) => {
    if (e) e.preventDefault();
    const finalName = (orgName && orgName.trim()) ? orgName.trim() : 'SuryaSANC Enterprise';
    const finalCode = (tenantCode && tenantCode.trim()) ? tenantCode.trim() : 'TZP';
    const finalKey = generatedLicenseKey || `PRATYAKSHA-LIC-${finalCode.toUpperCase()}-${maxCameras}CAM-KEY2026`;

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

    setOrganizations(prev => [...prev.filter(o => o.id !== newOrg.id), newOrg]);
    fetch(`${API_BASE_URL}/admin/organizations/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrg)
    }).catch(e => console.log(e));

    setWizardStep(1);
    setOrgName('');
    setTenantCode('');
    alert(`Tenant ${finalName} (${finalCode}) Provisioned Successfully!`);
  };

  const handleDeleteOrg = (id) => {
    setOrganizations(prev => prev.filter(o => o.id !== id));
    fetch(`${API_BASE_URL}/admin/organizations/delete/${id}`, { method: 'DELETE' }).catch(e => console.log(e));
  };

  const handleSaveUser = () => {
    if (!userName || !userEmail) return;
    const payload = {
      id: editingUserId || `usr_${Date.now()}`,
      orgId: selectedUserOrg || (organizations[0] ? organizations[0].id : 'org_tzp'),
      fullName: userName,
      officerEmail: userEmail,
      password: userPassword || 'admin123',
      role: userRole
    };
    setUsers(prev => [...prev.filter(u => u.id !== payload.id), payload]);
    fetch(`${API_BASE_URL}/admin/users/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.log(e));

    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    alert(`User ${payload.fullName} saved successfully!`);
  };

  const handleEditUser = (u) => {
    setEditingUserId(u.id);
    setSelectedUserOrg(u.orgId);
    setUserName(u.fullName);
    setUserEmail(u.officerEmail);
    setUserPassword(u.password || '');
    setUserRole(u.role || 'Org Admin');
  };

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    fetch(`${API_BASE_URL}/admin/users/delete/${id}`, { method: 'DELETE' }).catch(e => console.log(e));
  };

  const handleSaveArea = () => {
    if (!parentArea) return;
    const subAreasList = subAreaName ? subAreaName.split(',').map(s => s.trim()).filter(Boolean) : ['TZP_OC'];
    const payload = {
      id: editingAreaId || `area_${Date.now()}`,
      orgId: selectedAreaOrg || (organizations[0] ? organizations[0].id : 'org_tzp'),
      parentArea,
      subAreas: subAreasList
    };

    setAreas(prev => [...prev.filter(a => a.id !== payload.id), payload]);
    fetch(`${API_BASE_URL}/admin/areas/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.log(e));

    setSelectedCamArea(parentArea);
    if (subAreasList.length > 0) setSelectedCamSubArea(subAreasList[0]);
    setEditingAreaId(null);
    setParentArea('');
    setSubAreaName('');
    alert(`Area ${parentArea} Saved Successfully!`);
  };

  const handleEditArea = (a) => {
    setEditingAreaId(a.id);
    setSelectedAreaOrg(a.orgId);
    setParentArea(a.parentArea);
    setSubAreaName(Array.isArray(a.subAreas) ? a.subAreas.join(', ') : 'TZP_OC');
  };

  const handleDeleteArea = (id) => {
    setAreas(prev => prev.filter(a => a.id !== id));
    fetch(`${API_BASE_URL}/admin/areas/delete/${id}`, { method: 'DELETE' }).catch(e => console.log(e));
  };

  const handleSaveCamera = () => {
    if (!camName || !camRtsp) return;
    const payload = {
      id: editingCamId || `cam_${Date.now()}`,
      orgId: selectedCamOrg || (organizations[0] ? organizations[0].id : 'org_tzp'),
      area: selectedCamArea || 'TZP',
      subArea: selectedCamSubArea || 'TZP_OC',
      camName,
      rtsp: camRtsp,
      appModule: camModule,
      lat: camLat || '10.5276',
      lng: camLng || '76.2144',
      status: 'ACTIVE'
    };

    setCameras(prev => [...prev.filter(c => c.id !== payload.id), payload]);
    fetch(`${API_BASE_URL}/admin/cameras/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.log(e));

    setEditingCamId(null);
    setCamName('');
    alert(`Camera ${camName} (${payload.lat}, ${payload.lng}) Provisioned & GIS Synced!`);
  };

  const handleEditCamera = (c) => {
    setEditingCamId(c.id);
    setSelectedCamOrg(c.orgId);
    setSelectedCamArea(c.area || '');
    setSelectedCamSubArea(c.subArea || '');
    setCamName(c.camName);
    setCamRtsp(c.rtsp);
    setCamModule(c.appModule || 'Traffic - ANPR & ATCC');
    setCamLat(c.lat || '10.5276');
    setCamLng(c.lng || '76.2144');
  };

  const handleDeleteCamera = (id) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    fetch(`${API_BASE_URL}/admin/cameras/delete/${id}`, { method: 'DELETE' }).catch(e => console.log(e));
  };

  const getGo2rtcStreamKey = (urlOrName) => {
    const target = (urlOrName || '').toLowerCase();
    if (target.includes('face') || target.includes('227')) return 'face_test_c1';
    return 'anpr_test_c1';
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

        {/* CARD 1: ORGANISATIONS & LICENSING WIZARD */}
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

            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Organisation Name</label>
                  <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Kerala Forest Department" className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-cyan-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Tenant Code (Short Ident)</label>
                  <input type="text" value={tenantCode} onChange={e => setTenantCode(e.target.value)} placeholder="e.g. KFD" className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2.5 rounded-xl outline-none focus:border-cyan-500 uppercase" />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Primary Officer SSO Email</label>
                  <input type="email" value={ssoEmail} onChange={e => setSsoEmail(e.target.value)} placeholder="officer@kfd.gov.in" className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-cyan-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">SSO Master Password</label>
                  <input type="password" value={ssoPassword} onChange={e => setSsoPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none focus:border-cyan-500" />
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Permissible AI Application Engines</label>
                <div className="grid grid-cols-1 gap-2">
                  {AI_MODULE_OPTIONS.map(mod => {
                    const isChecked = selectedModules.includes(mod);
                    return (
                      <div key={mod} onClick={() => toggleModule(mod)} className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${isChecked ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <span className="font-extrabold">{mod}</span>
                        {isChecked && <Check size={14} className="text-cyan-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Permissible Max Camera Channels</label>
                  <select value={maxCameras} onChange={e => setMaxCameras(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-extrabold p-2.5 rounded-xl outline-none">
                    <option value={8}>8 Camera Stream Channels</option>
                    <option value={16}>16 Camera Stream Channels</option>
                    <option value={32}>32 Camera Stream Channels</option>
                    <option value={64}>64 Enterprise Channels</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 text-[10px] font-bold uppercase">Cryptographic License Key</label>
                    <button type="button" onClick={generateLicense} className="text-[10px] text-cyan-400 font-extrabold underline cursor-pointer">
                      Generate Key
                    </button>
                  </div>
                  <input type="text" readOnly value={generatedLicenseKey || `PRATYAKSHA-LIC-${(tenantCode || 'TZP').toUpperCase()}-${maxCameras}CAM-KEY2026`} className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold p-2.5 rounded-xl outline-none text-[11px]" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {wizardStep > 1 ? (
              <button type="button" onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl flex items-center gap-1 cursor-pointer">
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}

            {wizardStep < 4 ? (
              <button type="button" onClick={() => setWizardStep(s => s + 1)} className="px-5 py-2 bg-cyan-500 text-slate-950 font-extrabold rounded-xl flex items-center gap-1 cursor-pointer hover:bg-cyan-400">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button" onClick={handleSaveOrganization} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-1 cursor-pointer shadow-lg">
                <ShieldCheck size={14} /> Provision Tenant &amp; License
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Active Registered Tenants ({organizations.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {organizations.map(org => (
                <div key={org.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-white text-xs">{org.orgName} ({org.tenantCode})</div>
                    <div className="text-slate-500 text-[10px]">Max Cams: {org.maxCameras || 64} | License: {org.licenseKey ? org.licenseKey.substring(0, 24) + '...' : 'ACTIVE'}</div>
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
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} /> 2. USER ROLES &amp; ACCESS TREE
              </h2>
              {editingUserId && <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">Editing</span>}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Select Organisation</label>
                  <select value={selectedUserOrg} onChange={e => setSelectedUserOrg(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none">
                    {organizations.map(o => <option key={o.id} value={o.id}>{o.orgName} ({o.tenantCode})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Privilege Role Route</label>
                  <select value={userRole} onChange={e => setUserRole(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2.5 rounded-xl outline-none">
                    <option value="Org Admin">Org Admin (Full Access)</option>
                    <option value="Operator">Operator (Live View &amp; Alerts)</option>
                    <option value="Auditor">Auditor (Read Only Reports)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="TZP_DCF" className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none" />
                <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="sales@suryasanc.in" className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none" />
                <input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} placeholder="••••••••" className="bg-slate-900 border border-slate-800 text-emerald-400 font-bold p-2.5 rounded-xl outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            {editingUserId ? <button type="button" onClick={() => { setEditingUserId(null); setUserName(''); setUserEmail(''); setUserPassword(''); }} className="text-[10px] text-slate-400 hover:underline">Cancel Edit</button> : <div />}
            <button type="button" onClick={handleSaveUser} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl cursor-pointer">
              {editingUserId ? "Update User Account" : "Save User Account"}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Provisioned User Accounts ({users.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-white text-xs flex items-center gap-2">{u.fullName} <span className="text-[9px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 rounded-full">{u.role || 'Org Admin'}</span></div>
                    <div className="text-slate-500 text-[10px]">{u.officerEmail} | Password: ••••••••</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditUser(u)} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg"><Edit size={13} /></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: AREAS & SUB-AREAS SETUP */}
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} /> 3. AREAS &amp; SUB-AREAS SETUP
              </h2>
              {editingAreaId && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">Editing</span>}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Select Organisation</label>
                <select value={selectedAreaOrg} onChange={e => setSelectedAreaOrg(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none">
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.orgName} ({o.tenantCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Parent Area</label>
                  <input type="text" value={parentArea} onChange={e => setParentArea(e.target.value)} placeholder="TZP" className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Sub-Area(s) (Comma separated)</label>
                  <input type="text" value={subAreaName} onChange={e => setSubAreaName(e.target.value)} placeholder="TZP_OC" className="w-full bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            {editingAreaId ? <button type="button" onClick={() => { setEditingAreaId(null); setParentArea(''); setSubAreaName(''); }} className="text-[10px] text-slate-400 hover:underline">Cancel Edit</button> : <div />}
            <button type="button" onClick={handleSaveArea} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl cursor-pointer">
              {editingAreaId ? "Update Area Division" : "Save Area Division"}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Configured Geographic Divisions ({areas.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {areas.map(a => (
                <div key={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-white text-xs">{a.parentArea}</div>
                    <div className="text-slate-500 text-[10px]">Sub-Areas: {Array.isArray(a.subAreas) ? a.subAreas.join(', ') : 'TZP_OC'}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditArea(a)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"><Edit size={13} /></button>
                    <button onClick={() => handleDeleteArea(a.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 4: CAMERA & GIS EDGE NODE SETUP WITH LAT / LONG INPUTS */}
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Camera size={16} /> 4. CAMERA &amp; GIS EDGE NODE SETUP
              </h2>
              {editingCamId && <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">Editing</span>}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Organisation</label>
                  <select value={selectedCamOrg} onChange={e => setSelectedCamOrg(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none">
                    {organizations.map(o => <option key={o.id} value={o.id}>{o.orgName}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Parent Area</label>
                  <select value={selectedCamArea} onChange={e => handleParentAreaChange(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-bold p-2.5 rounded-xl outline-none">
                    {areas.map(a => <option key={a.id} value={a.parentArea}>{a.parentArea}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Sub-Area</label>
                  <select value={selectedCamSubArea} onChange={e => setSelectedCamSubArea(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2.5 rounded-xl outline-none">
                    {getSubAreasForSelectedArea().map((sa, idx) => <option key={idx} value={sa}>{sa}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={camName} onChange={e => setCamName(e.target.value)} placeholder="ANPR_TEST_ENTRY" className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl outline-none" />
                <select value={camModule} onChange={e => setCamModule(e.target.value)} className="bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2.5 rounded-xl outline-none">
                  {AI_MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* GIS COORDINATES LATITUDE & LONGITUDE INPUTS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Compass size={11} className="text-cyan-400" /> GIS Latitude (LAT)
                  </label>
                  <input type="text" value={camLat} onChange={e => setCamLat(e.target.value)} placeholder="10.5276" className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono p-2.5 rounded-xl outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Compass size={11} className="text-cyan-400" /> GIS Longitude (LONG)
                  </label>
                  <input type="text" value={camLng} onChange={e => setCamLng(e.target.value)} placeholder="76.2144" className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono p-2.5 rounded-xl outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">RTSP Stream Source URL</label>
                  <button type="button" onClick={() => setTestingStreamUrl(camRtsp)} className="text-[10px] text-cyan-400 font-extrabold flex items-center gap-1 hover:underline cursor-pointer">
                    <Play size={11} /> Preview Test Stream
                  </button>
                </div>
                <input type="text" value={camRtsp} onChange={e => setCamRtsp(e.target.value)} placeholder="rtsp://192.168.100.229:554/profile1" className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-mono p-2.5 rounded-xl outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            {editingCamId ? <button type="button" onClick={() => { setEditingCamId(null); setCamName(''); }} className="text-[10px] text-slate-400 hover:underline">Cancel Edit</button> : <div />}
            <button type="button" onClick={handleSaveCamera} className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold rounded-xl cursor-pointer">
              {editingCamId ? "Update Camera Stream & GIS" : "Provision Camera Stream & GIS"}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Provisioned Edge Nodes ({cameras.length})</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cameras.map(c => (
                <div key={c.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-white text-xs flex items-center gap-2">
                      {c.camName} 
                      <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 rounded-full">{c.area || 'TZP'} / {c.subArea || 'TZP_OC'}</span>
                      <span className="text-[9px] text-cyan-400 font-mono">[{c.lat || '10.5276'}, {c.lng || '76.2144'}]</span>
                    </div>
                    <div className="text-slate-500 text-[10px] font-mono truncate max-w-[240px]">{c.rtsp}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTestingStreamUrl(c.rtsp)} className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg"><Video size={13} /></button>
                    <button onClick={() => handleEditCamera(c)} className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg"><Edit size={13} /></button>
                    <button onClick={() => handleDeleteCamera(c.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RTSP STREAM PREVIEW GUI MODAL */}
      {testingStreamUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#070b19] border border-cyan-500/50 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold">
                <Video size={16} /> Live RTSP Test Stream Preview GUI
              </div>
              <button onClick={() => setTestingStreamUrl(null)} className="p-1 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-700 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col justify-between p-4">
              <img 
                src={`http://${HOST_IP}:1984/api/frame.jpeg?src=${getGo2rtcStreamKey(testingStreamUrl)}`} 
                alt="WebRTC Stream Feed" 
                className="absolute inset-0 w-full h-full object-cover z-0"
                onError={(e) => { e.target.src = `http://${HOST_IP}:8005/static/captures/capture_init.jpg`; }}
              />

              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-slate-950 font-extrabold text-[9px] rounded-lg">
                    <Wifi size={10} /> WEBRTC LIVE
                  </span>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 font-mono text-[9px] rounded-lg border border-cyan-500/30">
                    H.264 / TCP
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <Activity size={12} className="animate-pulse" /> 25.0 FPS
                </div>
              </div>

              <div className="z-10 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-mono">
                <div className="text-slate-300">
                  URL: <span className="text-cyan-400">{testingStreamUrl}</span>
                </div>
                <div className="text-slate-400">
                  Frames Decoded: <span className="text-amber-400 font-bold">{1240 + previewFrameCount}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setTestingStreamUrl(null)} className="px-5 py-2 bg-slate-900 text-slate-300 font-bold rounded-xl cursor-pointer hover:bg-slate-800">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
