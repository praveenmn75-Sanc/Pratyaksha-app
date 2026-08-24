import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, MapPin, Camera, ChevronDown, ChevronUp, 
  Plus, Edit3, Trash2, Save, Key, Shield, Mail, Layers, CheckCircle2, Eye, Play
} from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

const ALL_AI_APPS = [
  "Traffic - ANPR & ATCC",
  "FACE REC",
  "WildWatch",
  "Perimeter Intrusion",
  "Fire & Smoke"
];

export default function AdminConsole({ setSuccessMsg }) {
  // Collapsible Accordion States matching exact screenshot structure
  const [openOrgs, setOpenOrgs] = useState(true);
  const [openUsers, setOpenUsers] = useState(false);
  const [openAreas, setOpenAreas] = useState(false);
  const [openCameras, setOpenCameras] = useState(false);

  // Data Persistence States
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cameras, setCameras] = useState([]);

  // Form States - Organizations & Licensing
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [orgForm, setOrgForm] = useState({
    orgName: '',
    tenantCode: '',
    region: '',
    ssoEmail: '',
    licenseType: 'Perpetual',
    cameraQuota: 64,
    applications: ["Traffic - ANPR & ATCC", "WildWatch"]
  });

  // Form States - Users
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    officerEmail: '',
    fullName: '',
    role: 'Org Admin',
    orgId: ''
  });

  // Form States - Areas & Sub-Areas
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [areaForm, setAreaForm] = useState({
    parentArea: '',
    subAreasStr: 'Town Centre, Toll Gate',
    lat: '10.5276',
    lng: '76.2144',
    orgId: ''
  });

  // Form States - Cameras & RTSP Streams
  const [editingCamId, setEditingCamId] = useState(null);
  const [camForm, setCamForm] = useState({
    camName: '',
    rtsp: 'rtsp://admin:pass@ip:554/profile1',
    area: '',
    subArea: '',
    lat: '10.5276',
    lng: '76.2144',
    orgId: ''
  });

  const fetchAllAdminData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/admin/organizations`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/users`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/areas`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/cameras`).then(r => r.json()).catch(() => [])
    ])
    .then(([orgData, userData, areaData, camData]) => {
      setOrganizations(orgData || []);
      setUsers(userData || []);
      setAreas(areaData || []);
      setCameras(camData || []);

      if (orgData && orgData.length > 0) {
        if (!userForm.orgId) setUserForm(prev => ({ ...prev, orgId: orgData[0].id }));
        if (!areaForm.orgId) setAreaForm(prev => ({ ...prev, orgId: orgData[0].id }));
        if (!camForm.orgId) setCamForm(prev => ({ ...prev, orgId: orgData[0].id }));
      }
    });
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // Compute available Sub-Areas dynamically based on selected Area
  const availableSubAreas = useMemo(() => {
    const selectedAreaObj = areas.find(a => a.parentArea === camForm.area);
    if (selectedAreaObj && Array.isArray(selectedAreaObj.subAreas)) {
      return selectedAreaObj.subAreas;
    }
    return ["Default Area", "Town Centre", "Toll Gate"];
  }, [camForm.area, areas]);

  // --- PROVISION ORGANIZATION & LICENSE ---
  const handleProvisionOrg = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/admin/organizations/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orgForm, id: editingOrgId })
    })
    .then(r => r.json())
    .then(res => {
      if (setSuccessMsg) setSuccessMsg(res.message);
      setEditingOrgId(null);
      setOrgForm({
        orgName: '', tenantCode: '', region: '', ssoEmail: '',
        licenseType: 'Perpetual', cameraQuota: 64, applications: ["Traffic - ANPR & ATCC"]
      });
      fetchAllAdminData();
    });
  };

  const handleDeleteOrg = (orgId) => {
    if (!window.confirm("Remove organization record?")) return;
    fetch(`${API_BASE_URL}/admin/organizations/${orgId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (setSuccessMsg) setSuccessMsg(res.message);
        fetchAllAdminData();
      });
  };

  // --- PROVISION USER ---
  const handleProvisionUser = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/admin/users/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userForm, id: editingUserId })
    })
    .then(r => r.json())
    .then(res => {
      if (setSuccessMsg) setSuccessMsg(res.message);
      setEditingUserId(null);
      setUserForm({ officerEmail: '', fullName: '', role: 'Org Admin', orgId: organizations[0]?.id || '' });
      fetchAllAdminData();
    });
  };

  const handleDeleteUser = (usrId) => {
    if (!window.confirm("Delete user account?")) return;
    fetch(`${API_BASE_URL}/admin/users/${usrId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (setSuccessMsg) setSuccessMsg(res.message);
        fetchAllAdminData();
      });
  };

  // --- REGISTER AREA & SUB-AREAS ---
  const handleRegisterArea = (e) => {
    e.preventDefault();
    const subAreasArray = areaForm.subAreasStr.split(',').map(s => s.trim()).filter(Boolean);

    fetch(`${API_BASE_URL}/admin/areas/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingAreaId,
        parentArea: areaForm.parentArea,
        subAreas: subAreasArray,
        lat: areaForm.lat,
        lng: areaForm.lng,
        orgId: areaForm.orgId
      })
    })
    .then(r => r.json())
    .then(res => {
      if (setSuccessMsg) setSuccessMsg(res.message);
      setEditingAreaId(null);
      setAreaForm({ parentArea: '', subAreasStr: 'Town Centre, Toll Gate', lat: '10.5276', lng: '76.2144', orgId: organizations[0]?.id || '' });
      fetchAllAdminData();
    });
  };

  const handleDeleteArea = (areaId) => {
    if (!window.confirm("Delete area zone?")) return;
    fetch(`${API_BASE_URL}/admin/areas/${areaId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (setSuccessMsg) setSuccessMsg(res.message);
        fetchAllAdminData();
      });
  };

  // --- ADD CAMERA NODE & RTSP STREAM ---
  const handleAddCamera = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/admin/cameras/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...camForm, id: editingCamId })
    })
    .then(r => r.json())
    .then(res => {
      if (setSuccessMsg) setSuccessMsg(res.message);
      setEditingCamId(null);
      setCamForm({ camName: '', rtsp: 'rtsp://admin:pass@ip:554/profile1', area: areas[0]?.parentArea || '', subArea: '', lat: '10.5276', lng: '76.2144', orgId: organizations[0]?.id || '' });
      fetchAllAdminData();
    });
  };

  const handleDeleteCamera = (camId) => {
    if (!window.confirm("Remove camera node?")) return;
    fetch(`${API_BASE_URL}/admin/cameras/${camId}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (setSuccessMsg) setSuccessMsg(res.message);
        fetchAllAdminData();
      });
  };

  const toggleAppSelection = (app) => {
    setOrgForm(prev => {
      const exists = prev.applications.includes(app);
      if (exists) {
        return { ...prev, applications: prev.applications.filter(a => a !== app) };
      } else {
        return { ...prev, applications: [...prev.applications, app] };
      }
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* HEADER BANNER */}
      <div className="bg-[#070b19] border border-pink-500/30 rounded-3xl p-5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-pink-400">
            <Shield size={22} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-wider uppercase">Admin Console</div>
            <div className="text-[10px] text-pink-400 font-bold">Enterprise Tenant, Privilege, Area Hierarchy &amp; Camera Stream Management</div>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-900 border border-slate-700 text-cyan-400 font-bold rounded-xl text-[10px]">
          Role: Super Admin
        </span>
      </div>

      {/* 1. ORGANISATIONS & LICENSING ACCORDION */}
      <div className="bg-[#070b19] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden transition-all">
        <button 
          onClick={() => setOpenOrgs(!openOrgs)}
          className="w-full p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-wider">
            <Building2 size={18} className="text-cyan-400" />
            <div className="text-left">
              <div>Organisations &amp; Licensing</div>
              <div className="text-[10px] text-slate-500 font-normal lowercase">Manage Tenants, Keys &amp; Camera Quotas</div>
            </div>
          </div>
          {openOrgs ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openOrgs && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleProvisionOrg} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Organisation Name</label>
                  <input 
                    type="text" placeholder="e.g. Kerala Forest Dept" required
                    value={orgForm.orgName} onChange={e => setOrgForm({ ...orgForm, orgName: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Tenant Code</label>
                  <input 
                    type="text" placeholder="e.g. KFD_SOUTH" required
                    value={orgForm.tenantCode} onChange={e => setOrgForm({ ...orgForm, tenantCode: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Region / Location</label>
                  <input 
                    type="text" placeholder="e.g. Wayanad / Thrissur" required
                    value={orgForm.region} onChange={e => setOrgForm({ ...orgForm, region: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">SSO Registered Officer Email (For Key Dispatch)</label>
                  <input 
                    type="email" placeholder="officer@suryasanc.in" required
                    value={orgForm.ssoEmail} onChange={e => setOrgForm({ ...orgForm, ssoEmail: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">License Type</label>
                  <select 
                    value={orgForm.licenseType} onChange={e => setOrgForm({ ...orgForm, licenseType: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none"
                  >
                    <option value="Perpetual">Perpetual License (Enterprise)</option>
                    <option value="Standard">Standard Annual License</option>
                    <option value="Demo">Demo / Evaluation Key</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Max Camera Quota</label>
                  <input 
                    type="number" min="1" max="256" required
                    value={orgForm.cameraQuota} onChange={e => setOrgForm({ ...orgForm, cameraQuota: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Applications Modules License Selection */}
              <div>
                <label className="text-slate-400 block mb-2 font-bold">Licensed AI Applications for Tenant</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AI_APPS.map(app => {
                    const isSelected = orgForm.applications.includes(app);
                    return (
                      <button
                        key={app} type="button" onClick={() => toggleAppSelection(app)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          isSelected ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{app}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20"
              >
                <Plus size={16} /> {editingOrgId ? 'Update Organisation' : '+ Provision Organisation'}
              </button>
            </form>

            {/* Existing Records Display Table */}
            {organizations.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="text-xs font-bold text-white uppercase flex items-center justify-between">
                  <span>Provisioned Tenant Records ({organizations.length})</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="p-3">Tenant Name</th>
                        <th className="p-3">Code / Region</th>
                        <th className="p-3">SSO Email</th>
                        <th className="p-3">Generated Key</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {organizations.map(o => (
                        <tr key={o.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-bold text-white">{o.orgName}</td>
                          <td className="p-3 text-amber-400 font-bold">{o.tenantCode} ({o.region})</td>
                          <td className="p-3 text-cyan-300">{o.ssoEmail}</td>
                          <td className="p-3 text-emerald-400 font-bold truncate max-w-xs">{o.licenseKey || 'PRATYAKSHA-KEY'}</td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingOrgId(o.id); setOrgForm(o); }} className="p-1.5 bg-slate-900 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 rounded-lg transition cursor-pointer"><Edit3 size={12} /></button>
                              <button onClick={() => handleDeleteOrg(o.id)} className="p-1.5 bg-slate-900 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 2. USER ROLES & ACCESS PRIVILEGES ACCORDION */}
      <div className="bg-[#070b19] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden transition-all">
        <button 
          onClick={() => setOpenUsers(!openUsers)}
          className="w-full p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-wider">
            <Users size={18} className="text-amber-400" />
            <div className="text-left">
              <div>User Roles &amp; Access Privileges</div>
              <div className="text-[10px] text-slate-500 font-normal lowercase">Configure Personnel Accounts &amp; Privilege Levels</div>
            </div>
          </div>
          {openUsers ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openUsers && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleProvisionUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Officer Email</label>
                  <input 
                    type="email" placeholder="officer@suryasanc.in" required
                    value={userForm.officerEmail} onChange={e => setUserForm({ ...userForm, officerEmail: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Full Name</label>
                  <input 
                    type="text" placeholder="Praveen Kumar" required
                    value={userForm.fullName} onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Assigned Privilege Role</label>
                  <select 
                    value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Org Admin">Org Admin</option>
                    <option value="Operator">Operator</option>
                    <option value="Auditor">Auditor (Read-Only)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20"
                  >
                    <Plus size={16} /> {editingUserId ? 'Update User' : '+ Provision User'}
                  </button>
                </div>
              </div>
            </form>

            {/* Users List */}
            {users.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Officer Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role Privilege</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 font-bold text-white">{u.fullName}</td>
                        <td className="p-3 text-cyan-300">{u.officerEmail}</td>
                        <td className="p-3 font-bold text-amber-400">{u.role}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingUserId(u.id); setUserForm(u); }} className="p-1.5 bg-slate-900 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 rounded-lg transition cursor-pointer"><Edit3 size={12} /></button>
                            {u.id !== 'usr_superadmin' && (
                              <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-slate-900 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"><Trash2 size={12} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. AREAS & SUB-AREAS SETUP ACCORDION */}
      <div className="bg-[#070b19] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden transition-all">
        <button 
          onClick={() => setOpenAreas(!openAreas)}
          className="w-full p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-wider">
            <MapPin size={18} className="text-emerald-400" />
            <div className="text-left">
              <div>Areas &amp; Sub-Areas Setup</div>
              <div className="text-[10px] text-slate-500 font-normal lowercase">Geographic Divisions, Zones &amp; Forest Perimeters with Lat/Long</div>
            </div>
          </div>
          {openAreas ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openAreas && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleRegisterArea} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Parent Area / Division</label>
                  <input 
                    type="text" placeholder="e.g. Thrissur Division" required
                    value={areaForm.parentArea} onChange={e => setAreaForm({ ...areaForm, parentArea: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Sub-Areas (Comma Separated)</label>
                  <input 
                    type="text" placeholder="Town Centre, Toll Gate" required
                    value={areaForm.subAreasStr} onChange={e => setAreaForm({ ...areaForm, subAreasStr: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">GIS Latitude</label>
                  <input 
                    type="text" required
                    value={areaForm.lat} onChange={e => setAreaForm({ ...areaForm, lat: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">GIS Longitude</label>
                  <input 
                    type="text" required
                    value={areaForm.lng} onChange={e => setAreaForm({ ...areaForm, lng: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20"
              >
                <Plus size={16} /> {editingAreaId ? 'Update Area Zone' : '+ Register Area'}
              </button>
            </form>

            {/* Areas Table */}
            {areas.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Parent Division</th>
                      <th className="p-3">Sub-Areas Included</th>
                      <th className="p-3">Coordinates</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {areas.map(a => (
                      <tr key={a.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 font-bold text-white">{a.parentArea}</td>
                        <td className="p-3 text-amber-400 font-bold">{Array.isArray(a.subAreas) ? a.subAreas.join(', ') : ''}</td>
                        <td className="p-3 text-cyan-300">{a.lat}, {a.lng}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingAreaId(a.id); setAreaForm({ ...a, subAreasStr: (a.subAreas || []).join(', ') }); }} className="p-1.5 bg-slate-900 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 rounded-lg transition cursor-pointer"><Edit3 size={12} /></button>
                            <button onClick={() => handleDeleteArea(a.id)} className="p-1.5 bg-slate-900 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. CAMERAS & RTSP STREAMS ACCORDION */}
      <div className="bg-[#070b19] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden transition-all">
        <button 
          onClick={() => setOpenCameras(!openCameras)}
          className="w-full p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-wider">
            <Camera size={18} className="text-cyan-400" />
            <div className="text-left">
              <div>Cameras &amp; RTSP Streams</div>
              <div className="text-[10px] text-slate-500 font-normal lowercase">Configure Edge Node Stream Endpoints, Preview Stream &amp; Map Coordinates</div>
            </div>
          </div>
          {openCameras ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openCameras && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleAddCamera} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Camera Node Identifier</label>
                  <input 
                    type="text" placeholder="ANPR_TEST_C1" required
                    value={camForm.camName} onChange={e => setCamForm({ ...camForm, camName: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">RTSP Stream URI</label>
                  <input 
                    type="text" placeholder="rtsp://admin:pass@ip:554/profile1" required
                    value={camForm.rtsp} onChange={e => setCamForm({ ...camForm, rtsp: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Assigned Area</label>
                  <select 
                    value={camForm.area} onChange={e => setCamForm({ ...camForm, area: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none"
                  >
                    <option value="">Select Parent Division</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.parentArea}>{a.parentArea}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Assigned Sub-Area</label>
                  <select 
                    value={camForm.subArea} onChange={e => setCamForm({ ...camForm, subArea: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-xl outline-none"
                  >
                    <option value="">Select Sub-Area Zone</option>
                    {availableSubAreas.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">GIS Latitude</label>
                  <input 
                    type="text" required
                    value={camForm.lat} onChange={e => setCamForm({ ...camForm, lat: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">GIS Longitude</label>
                  <input 
                    type="text" required
                    value={camForm.lng} onChange={e => setCamForm({ ...camForm, lng: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-bold rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => alert(`Testing stream reachability for RTSP URI: ${camForm.rtsp}`)}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Eye size={16} /> Test Stream Preview
                </button>

                <button 
                  type="submit" 
                  className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold rounded-xl uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20"
                >
                  <Plus size={16} /> {editingCamId ? 'Update Camera Node' : '+ Add RTSP Node'}
                </button>
              </div>
            </form>

            {/* Cameras Records Table */}
            {cameras.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                    <tr>
                      <th className="p-3">Camera Node</th>
                      <th className="p-3">RTSP Stream URI</th>
                      <th className="p-3">Area / Sub-Area</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cameras.map(c => (
                      <tr key={c.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 font-bold text-white">{c.camName}</td>
                        <td className="p-3 text-cyan-300 font-bold truncate max-w-xs">{c.rtsp}</td>
                        <td className="p-3 text-amber-400 font-bold">{c.area} ({c.subArea})</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                            {c.status || 'ONLINE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingCamId(c.id); setCamForm(c); }} className="p-1.5 bg-slate-900 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 rounded-lg transition cursor-pointer"><Edit3 size={12} /></button>
                            <button onClick={() => handleDeleteCamera(c.id)} className="p-1.5 bg-slate-900 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
