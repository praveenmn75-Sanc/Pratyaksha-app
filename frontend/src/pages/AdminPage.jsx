import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, Camera, Users, LogOut, LayoutDashboard, Radio, 
  AlertTriangle, ListFilter, Sliders, MapPin, CheckCircle, Plus, Key, 
  Trash2, Edit3, Lock, RefreshCw, ChevronDown, ChevronUp, Shield, Eye, Play
} from 'lucide-react';

import { useAuth } from '../App';
import CommandCenter from '../components/CommandCenter';
import LiveMatrix from '../components/LiveMatrix';
import EventsAlerts from '../components/EventsAlerts';
import Hotlist from '../components/Hotlist';
import AppConfig from '../components/AppConfig';

// Dynamic Network Base Endpoints (Fixes CORS and WS Disconnects)
const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;
const WS_URL = `ws://${HOST_IP}:8005/api/v1/ws/events`;
const GO2RTC_BASE_URL = `http://${HOST_IP}:1984`;

export default function AdminPage() {
  const navigate = useNavigate();
  const { moduleName } = useParams();
  const { logout } = useAuth();

  const activeTab = moduleName || 'command-center';
  const setActiveTab = (tab) => { navigate(`/admin/${tab}`); };

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(true);
  const [currentUserEmail] = useState(() => localStorage.getItem('pratyaksha_user_email') || 'pratyaksha@suryasanc.in');

  const currentUserRole = currentUserEmail === 'pratyaksha@suryasanc.in' 
    ? 'Super Admin' 
    : (currentUserEmail.includes('admin') ? 'Org Admin' : 'Field Operator');

  const consoleLabel = currentUserRole === 'Super Admin' ? 'Admin Console' : 'Config Console';
  const hasConsoleAccess = currentUserRole === 'Super Admin' || currentUserRole === 'Org Admin';

  const [organizations, setOrganizations] = useState([
    { 
      id: 1, 
      name: 'SuryaSANC', 
      code: 'SURYASANC_PRIMARY', 
      email: 'info@suryasanc.in', 
      phone: '+91 9876543210', 
      region: 'Thrissur / Kerala',
      licenseKey: 'PRATYAKSHA-ENTERPRISE-8A91B2C3-4D5E6F78',
      tier: 'Enterprise Suite',
      maxCameras: 64,
      expiryDate: '2027-12-31',
      licenseStatus: 'Active'
    }
  ]);

  const [users, setUsers] = useState([
    { id: 1, email: 'pratyaksha@suryasanc.in', name: 'Super Administrator', org: 'SuryaSANC', role: 'Super Admin', status: 'Active' },
    { id: 2, email: 'praveen@suryasanc.in', name: 'Praveen Kumar', org: 'SuryaSANC', role: 'Org Admin', status: 'Active' }
  ]);

  const [areas, setAreas] = useState([
    { id: 1, name: 'Thrissur Division', subAreas: ['Town Centre', 'Highway Toll'], lat: '10.5276', lng: '76.2144' },
    { id: 2, name: 'Wayanad North Division', subAreas: ['Forest Perimeter', 'Checkpost 1'], lat: '11.6854', lng: '76.1320' }
  ]);

  const [cameras, setCameras] = useState([
    { id: 1, camName: 'ANPR_TEST_C1', rtsp: 'rtsp://admin:surya@321@192.168.100.229:554/profile1', area: 'Thrissur Division', subArea: 'Highway Toll', lat: '10.5276', lng: '76.2144' },
    { id: 2, camName: 'FACE_TEST_C1', rtsp: 'rtsp://admin:123456@192.168.100.227:554/profile1', area: 'Thrissur Division', subArea: 'Town Centre', lat: '10.5350', lng: '76.2200' }
  ]);

  const [eventsList, setEventsList] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const [expandedConsoleTile, setExpandedConsoleTile] = useState('cameras');
  const [testStreamUrl, setTestStreamUrl] = useState(null);
  const [isTestingStream, setIsTestingStream] = useState(false);

  const [orgForm, setOrgForm] = useState({
    name: '', code: '', email: '', phone: '', region: '',
    tier: 'Enterprise Suite', maxCameras: 32, validityDays: 365,
    licenseKey: '', expiryDate: '', licenseStatus: 'Active'
  });
  const [userForm, setUserForm] = useState({ email: '', name: '', org: 'SuryaSANC', role: 'Org Admin' });
  const [areaForm, setAreaForm] = useState({ name: '', subAreas: '', lat: '10.5276', lng: '76.2144' });
  const [camForm, setCamForm] = useState({ 
    camName: '', 
    rtsp: '', 
    area: 'Thrissur Division', 
    subArea: 'Town Centre', 
    lat: '10.5276', 
    lng: '76.2144' 
  });

  const [eventsSubTab, setEventsSubTab] = useState('live');
  const [selectedAppFilter, setSelectedAppFilter] = useState('All Applications');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All Classes');
  const [selectedCamFilter, setSelectedCamFilter] = useState('All Cameras');
  const [selectedDateFilter, setSelectedDateFilter] = useState('2026-08-18');

  const [activeImageModal, setActiveImageModal] = useState(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);
  const [activeDetailsModal, setActiveDetailsModal] = useState(null);

  const [matrixGridSize, setMatrixGridSize] = useState(4);
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [assignedStreams, setAssignedStreams] = useState({});
  const [isCameraTreeOpen, setIsCameraTreeOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState({ 'Thrissur Division': true });

  const [currentTimeIST, setCurrentTimeIST] = useState('');
  const [hwStats] = useState({ cpu: 38, ram: 54, gpu: 42 });

  const allAIApps = [
    { name: 'FACE REC', desc: 'Biometric identification & watchlist matching', active: true },
    { name: 'Traffic - ANPR & ATCC', desc: 'Automatic number plate recognition', active: true },
    { name: 'WildWatch', desc: 'Wildlife monitoring & conflict mitigation', active: true },
    { name: 'Perimeter Intrusion', desc: 'Virtual fence boundary monitoring', active: true },
    { name: 'Fire & Smoke', desc: 'Early flame and smoke anomaly detection', active: currentUserRole === 'Super Admin' }
  ];

  const [selectedAppModule, setSelectedAppModule] = useState('Traffic - ANPR & ATCC');

  useEffect(() => {
    fetch(`${API_BASE_URL}/orgs`).then(r => r.json()).then(data => { if (data && data.length) setOrganizations(data); }).catch(() => {});
    fetch(`${API_BASE_URL}/users`).then(r => r.json()).then(data => { if (data && data.length) setUsers(data); }).catch(() => {});
    fetch(`${API_BASE_URL}/areas`).then(r => r.json()).then(data => { if (data && data.length) setAreas(data); }).catch(() => {});
    fetch(`${API_BASE_URL}/cameras`).then(r => r.json()).then(data => { if (data && data.length) setCameras(data); }).catch(() => {});
  }, []);

  useEffect(() => {
    let ws;
    const connectWS = () => {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        try {
          const newEvent = JSON.parse(event.data);
          setEventsList(prev => [newEvent, ...prev]);
        } catch (e) {}
      };
      ws.onclose = () => setTimeout(connectWS, 3000);
    };
    connectWS();
    return () => ws && ws.close();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeIST(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' IST');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showFeedback = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSecureLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleTestRTSPPreview = () => {
    if (!camForm.rtsp) {
      showFeedback('Please enter an RTSP Stream URI to preview!');
      return;
    }
    const streamKey = camForm.camName ? camForm.camName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'anpr_test_c1';
    setTestStreamUrl(`${GO2RTC_BASE_URL}/api/frame.jpeg?src=${streamKey}`);
    setIsTestingStream(true);
  };

  const selectedAreaObj = areas.find(a => a.name === camForm.area) || areas[0] || { subAreas: ['Town Centre'] };
  const currentSubAreaList = selectedAreaObj.subAreas || ['Default Area'];

  const handleSaveOrg = (e) => {
    e.preventDefault();
    if (!orgForm.name) return;
    if (editingItem) {
      setOrganizations(organizations.map(o => o.id === editingItem.id ? { ...o, ...orgForm } : o));
      setEditingItem(null);
      showFeedback(`Updated Organisation: ${orgForm.name}`);
    } else {
      setOrganizations([...organizations, { id: Date.now(), ...orgForm }]);
      showFeedback(`Created Organisation: ${orgForm.name}`);
    }
    setOrgForm({ name: '', code: '', email: '', phone: '', region: '', tier: 'Enterprise Suite', maxCameras: 32, validityDays: 365, licenseKey: '', expiryDate: '', licenseStatus: 'Active' });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.email) return;
    if (editingItem) {
      setUsers(users.map(u => u.id === editingItem.id ? { ...u, ...userForm } : u));
      setEditingItem(null);
      showFeedback(`Updated User: ${userForm.email}`);
    } else {
      setUsers([...users, { id: Date.now(), ...userForm, status: 'Active' }]);
      showFeedback(`Provisioned User: ${userForm.email}`);
    }
    setUserForm({ email: '', name: '', org: 'SuryaSANC', role: 'Org Admin' });
  };

  const handleSaveArea = (e) => {
    e.preventDefault();
    if (!areaForm.name) return;
    const subList = areaForm.subAreas ? areaForm.subAreas.split(',').map(s => s.trim()) : ['Default Area'];
    if (editingItem) {
      setAreas(areas.map(a => a.id === editingItem.id ? { ...a, name: areaForm.name, subAreas: subList, lat: areaForm.lat, lng: areaForm.lng } : a));
      setEditingItem(null);
      showFeedback(`Updated Zone: ${areaForm.name}`);
    } else {
      setAreas([...areas, { id: Date.now(), name: areaForm.name, subAreas: subList, lat: areaForm.lat, lng: areaForm.lng }]);
      showFeedback(`Registered Geographic Area: ${areaForm.name}`);
    }
    setAreaForm({ name: '', subAreas: '', lat: '10.5276', lng: '76.2144' });
  };

  const handleSaveCamera = (e) => {
    e.preventDefault();
    if (!camForm.camName || !camForm.rtsp) return;
    if (editingItem) {
      setCameras(cameras.map(c => c.id === editingItem.id ? { ...c, ...camForm } : c));
      setEditingItem(null);
      showFeedback(`Updated Camera Node: ${camForm.camName}`);
    } else {
      setCameras([...cameras, { id: Date.now(), ...camForm }]);
      showFeedback(`Provisioned RTSP Stream: ${camForm.camName}`);
    }
    setCamForm({ camName: '', rtsp: '', area: areas[0]?.name || 'Thrissur Division', subArea: 'Town Centre', lat: '10.5276', lng: '76.2144' });
  };

  const activeOrg = organizations[0] || { name: 'SuryaSANC' };

  return (
    <div className={`flex h-screen bg-[#050814] text-slate-100 font-sans overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50 p-0' : ''}`}>
      {!isFullScreen && (
        <div className={`${isSubMenuOpen ? 'w-64' : 'w-16'} bg-[#070b19] border-r border-slate-800 flex flex-col justify-between flex-shrink-0 transition-all duration-300 z-30`}>
          <div className="p-3 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
              {isSubMenuOpen && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Navigation</span>}
              <button onClick={() => setIsSubMenuOpen(!isSubMenuOpen)} className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 flex items-center justify-center text-xs font-bold cursor-pointer transition ml-auto">
                {isSubMenuOpen ? '◀' : '▶'}
              </button>
            </div>

            <div className="space-y-1">
              <button onClick={() => setActiveTab('command-center')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'command-center' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
                <LayoutDashboard size={18} /> {isSubMenuOpen && <span>Command Centre</span>}
              </button>
              <button onClick={() => setActiveTab('matrix')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'matrix' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
                <Radio size={18} /> {isSubMenuOpen && <span>Live Matrix</span>}
              </button>
              <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'events' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
                <AlertTriangle size={18} /> {isSubMenuOpen && <span>Events & Alerts</span>}
              </button>
              <button onClick={() => setActiveTab('hotlist')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'hotlist' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
                <ListFilter size={18} /> {isSubMenuOpen && <span>Hotlist</span>}
              </button>
              <button onClick={() => setActiveTab('app-config')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'app-config' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
                <Sliders size={18} /> {isSubMenuOpen && <span>App Config</span>}
              </button>

              {hasConsoleAccess && (
                <button 
                  onClick={() => setActiveTab('console')} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'console' || activeTab === 'orgs' || activeTab === 'users' || activeTab === 'areas' || activeTab === 'cameras'
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-lg' 
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Shield size={18} className="text-pink-400" /> 
                  {isSubMenuOpen && <span>{consoleLabel}</span>}
                </button>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-slate-800 space-y-3 relative">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <img src="/pratyaksha-icon.png" alt="Avatar" className="w-8 h-8 rounded-full border border-cyan-500 object-cover flex-shrink-0" />
              {isSubMenuOpen && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{activeOrg.name}</div>
                  <div className="text-[9px] text-pink-400 font-mono">{currentUserRole}</div>
                </div>
              )}
            </div>

            <button onClick={handleSecureLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition cursor-pointer">
              <LogOut size={16} /> {isSubMenuOpen && <span>Secure Logout</span>}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!isFullScreen && (
          <div className="h-16 bg-[#070b19] border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src="/pratyaksha-icon.png" alt="Master Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">Pratyaksha Enterprise AI Surveillance Platform</h1>
                <p className="text-[10px] text-cyan-400 font-mono">Logged in as: <span className="text-white font-bold">{currentUserEmail}</span> ({currentUserRole})</p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400">Backend API: <span className="text-emerald-400">Port 8005 Live</span></div>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs">
          {successMsg && !isFullScreen && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-3">
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          {activeTab === 'command-center' && (
            <CommandCenter 
              activeOrg={activeOrg} currentTimeIST={currentTimeIST} hwStats={hwStats} cameras={cameras}
              activeCamerasCount={cameras.length} inactiveCamerasCount={0} recentEvents={eventsList}
            />
          )}

          {activeTab === 'matrix' && (
            <LiveMatrix 
              isCameraTreeOpen={isCameraTreeOpen} setIsCameraTreeOpen={setIsCameraTreeOpen}
              matrixGridSize={matrixGridSize} setMatrixGridSize={setMatrixGridSize}
              selectedCellIndex={selectedCellIndex} setSelectedCellIndex={setSelectedCellIndex}
              isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen}
              activeOrg={activeOrg} areas={areas} cameras={cameras} expandedAreas={expandedAreas}
              setExpandedAreas={setExpandedAreas} assignedStreams={assignedStreams}
              assignCameraToCell={(cam) => setAssignedStreams({ ...assignedStreams, [selectedCellIndex]: cam })}
              removeCameraFromCell={(idx, e) => { e.stopPropagation(); const updated = { ...assignedStreams }; delete updated[idx]; setAssignedStreams(updated); }}
            />
          )}

          {activeTab === 'events' && (
            <EventsAlerts 
              eventsSubTab={eventsSubTab} setEventsSubTab={setEventsSubTab} autoRefreshCountdown={30}
              exportCSV={()=>{}} exportPDF={()=>{}} selectedAppFilter={selectedAppFilter} setSelectedAppFilter={setSelectedAppFilter}
              selectedClassFilter={selectedClassFilter} setSelectedClassFilter={setSelectedClassFilter}
              selectedCamFilter={selectedCamFilter} setSelectedCamFilter={setSelectedCamFilter}
              selectedDateFilter={selectedDateFilter} setSelectedDateFilter={setSelectedDateFilter}
              cameras={cameras} activeOrg={activeOrg} filteredEvents={eventsList} setFilteredEvents={setEventsList}
              activeImageModal={activeImageModal} setActiveImageModal={setActiveImageModal}
              imageZoomLevel={imageZoomLevel} setImageZoomLevel={setImageZoomLevel}
              activeDetailsModal={activeDetailsModal} setActiveDetailsModal={setActiveDetailsModal}
              setSuccessMsg={showFeedback}
            />
          )}

          {activeTab === 'hotlist' && <Hotlist activeOrg={activeOrg} cameras={cameras} setSuccessMsg={showFeedback} />}

          {activeTab === 'app-config' && (
            <AppConfig 
              allAIApps={allAIApps} selectedAppModule={selectedAppModule} 
              setSelectedAppModule={setSelectedAppModule} cameras={cameras} 
              currentUserRole={currentUserRole} handleRequestActivation={()=>{}} setSuccessMsg={showFeedback} 
            />
          )}

          {(activeTab === 'console' || activeTab === 'orgs' || activeTab === 'users' || activeTab === 'areas' || activeTab === 'cameras') && (
            hasConsoleAccess ? (
              <div className="space-y-6 font-mono text-xs">
                <div className="bg-[#070b19] border border-pink-500/30 rounded-3xl p-5 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/10 border border-pink-500/30 rounded-2xl flex items-center justify-center text-pink-400">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">{consoleLabel}</h2>
                      <p className="text-[10px] text-pink-400">Enterprise Tenant, Privilege, Area Hierarchy & Camera Stream Management</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 font-bold text-[10px]">
                    Role: <strong className="text-white">{currentUserRole}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUserRole === 'Super Admin' && (
                    <div className={`bg-[#070b19] border rounded-3xl transition shadow-xl overflow-hidden flex flex-col ${
                      expandedConsoleTile === 'orgs' ? 'border-pink-500/80 shadow-pink-500/10 col-span-1 md:col-span-2' : 'border-slate-800 hover:border-slate-700'
                    }`}>
                      <div 
                        onClick={() => setExpandedConsoleTile(expandedConsoleTile === 'orgs' ? null : 'orgs')}
                        className="p-5 flex items-center justify-between cursor-pointer bg-slate-950/60"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 size={18} className="text-cyan-400" />
                          <div>
                            <h3 className="text-xs font-extrabold text-white uppercase">Organisations & Licensing</h3>
                            <p className="text-[10px] text-slate-400">Manage Tenants, Keys & Camera Quotas</p>
                          </div>
                        </div>
                        {expandedConsoleTile === 'orgs' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>

                      {expandedConsoleTile === 'orgs' && (
                        <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-6">
                          <form onSubmit={handleSaveOrg} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">Organisation Name</label>
                                <input type="text" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="e.g. Kerala Forest Dept" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">Tenant Code</label>
                                <input type="text" value={orgForm.code} onChange={e => setOrgForm({ ...orgForm, code: e.target.value })} placeholder="e.g. KFD_SOUTH" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold mb-1">Region / Location</label>
                                <input type="text" value={orgForm.region} onChange={e => setOrgForm({ ...orgForm, region: e.target.value })} placeholder="e.g. Wayanad / Thrissur" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                              </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer">
                              <Plus size={16} /> {editingItem ? 'Save Changes' : 'Provision Organisation'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`bg-[#070b19] border rounded-3xl transition shadow-xl overflow-hidden flex flex-col ${
                    expandedConsoleTile === 'users' ? 'border-pink-500/80 shadow-pink-500/10 col-span-1 md:col-span-2' : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div 
                      onClick={() => setExpandedConsoleTile(expandedConsoleTile === 'users' ? null : 'users')}
                      className="p-5 flex items-center justify-between cursor-pointer bg-slate-950/60"
                    >
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-amber-400" />
                        <div>
                          <h3 className="text-xs font-extrabold text-white uppercase">User Roles & Access Privileges</h3>
                          <p className="text-[10px] text-slate-400">Configure Personnel Accounts & Privilege Levels</p>
                        </div>
                      </div>
                      {expandedConsoleTile === 'users' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {expandedConsoleTile === 'users' && (
                      <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-6">
                        <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Officer Email</label>
                            <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="officer@suryasanc.in" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Full Name</label>
                            <input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="Praveen Kumar" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Assigned Privilege Role</label>
                            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 font-bold outline-none cursor-pointer">
                              <option value="Super Admin">Super Admin</option>
                              <option value="Org Admin">Org Admin</option>
                              <option value="Field Operator">Field Operator</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button type="submit" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20">
                              <Plus size={16} /> {editingItem ? 'Save User' : 'Provision User'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className={`bg-[#070b19] border rounded-3xl transition shadow-xl overflow-hidden flex flex-col ${
                    expandedConsoleTile === 'areas' ? 'border-pink-500/80 shadow-pink-500/10 col-span-1 md:col-span-2' : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div 
                      onClick={() => setExpandedConsoleTile(expandedConsoleTile === 'areas' ? null : 'areas')}
                      className="p-5 flex items-center justify-between cursor-pointer bg-slate-950/60"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-emerald-400" />
                        <div>
                          <h3 className="text-xs font-extrabold text-white uppercase">Areas & Sub-Areas Setup</h3>
                          <p className="text-[10px] text-slate-400">Geographic Divisions, Zones & Forest Perimeters with Lat/Long</p>
                        </div>
                      </div>
                      {expandedConsoleTile === 'areas' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {expandedConsoleTile === 'areas' && (
                      <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-6">
                        <form onSubmit={handleSaveArea} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Parent Area / Division</label>
                            <input type="text" value={areaForm.name} onChange={e => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="e.g. Thrissur Division" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Sub-Areas (Comma Separated)</label>
                            <input type="text" value={areaForm.subAreas} onChange={e => setAreaForm({ ...areaForm, subAreas: e.target.value })} placeholder="Town Centre, Toll Gate" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">GIS Latitude</label>
                            <input type="text" value={areaForm.lat} onChange={e => setAreaForm({ ...areaForm, lat: e.target.value })} placeholder="10.5276" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">GIS Longitude</label>
                            <input type="text" value={areaForm.lng} onChange={e => setAreaForm({ ...areaForm, lng: e.target.value })} placeholder="76.2144" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                          </div>
                          <div className="md:col-span-4 flex justify-end">
                            <button type="submit" className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20">
                              <Plus size={16} /> {editingItem ? 'Save Zone' : 'Register Area'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className={`bg-[#070b19] border rounded-3xl transition shadow-xl overflow-hidden flex flex-col ${
                    expandedConsoleTile === 'cameras' ? 'border-pink-500/80 shadow-pink-500/10 col-span-1 md:col-span-2' : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div 
                      onClick={() => setExpandedConsoleTile(expandedConsoleTile === 'cameras' ? null : 'cameras')}
                      className="p-5 flex items-center justify-between cursor-pointer bg-slate-950/60"
                    >
                      <div className="flex items-center gap-3">
                        <Camera size={18} className="text-cyan-400" />
                        <div>
                          <h3 className="text-xs font-extrabold text-white uppercase">Cameras & RTSP Streams</h3>
                          <p className="text-[10px] text-slate-400">Configure Edge Node Stream Endpoints, Preview Stream & Map Coordinates</p>
                        </div>
                      </div>
                      {expandedConsoleTile === 'cameras' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {expandedConsoleTile === 'cameras' && (
                      <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-6">
                        <form onSubmit={handleSaveCamera} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Camera Node Identifier</label>
                              <input type="text" value={camForm.camName} onChange={e => setCamForm({ ...camForm, camName: e.target.value })} placeholder="ANPR_TEST_C1" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">RTSP Stream URI</label>
                              <input type="text" value={camForm.rtsp} onChange={e => setCamForm({ ...camForm, rtsp: e.target.value })} placeholder="rtsp://admin:pass@ip:554/profile1" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Assigned Area</label>
                              <select 
                                value={camForm.area} 
                                onChange={e => setCamForm({ ...camForm, area: e.target.value, subArea: currentSubAreaList[0] || 'Default Area' })} 
                                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 font-bold outline-none cursor-pointer"
                              >
                                {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">Assigned Sub-Area</label>
                              <select 
                                value={camForm.subArea} 
                                onChange={e => setCamForm({ ...camForm, subArea: e.target.value })} 
                                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 font-bold outline-none cursor-pointer"
                              >
                                {currentSubAreaList.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">GIS Latitude</label>
                              <input type="text" value={camForm.lat} onChange={e => setCamForm({ ...camForm, lat: e.target.value })} placeholder="10.5276" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-1">GIS Longitude</label>
                              <input type="text" value={camForm.lng} onChange={e => setCamForm({ ...camForm, lng: e.target.value })} placeholder="76.2144" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button 
                              type="button" 
                              onClick={handleTestRTSPPreview} 
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                            >
                              <Eye size={16} /> Test Stream Preview
                            </button>

                            <button type="submit" className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20">
                              <Plus size={16} /> {editingItem ? 'Save Stream' : 'Add RTSP Node'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#070b19] border border-slate-800 rounded-3xl text-red-400 font-bold">
                Access Restricted: Insufficient privileges to view the Console.
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
