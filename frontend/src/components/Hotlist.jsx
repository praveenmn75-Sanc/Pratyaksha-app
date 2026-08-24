import React, { useState } from 'react';
import { 
  Bell, Mail, MessageSquare, Send, Cpu, Users, List, Database, 
  ChevronDown, ChevronUp, Check, X, Edit, Trash2, Plus, Download, 
  Eye, ToggleLeft, ToggleRight, Camera, ShieldAlert, Car, UserCheck, Image
} from 'lucide-react';

export default function Hotlist({ activeOrg, cameras, setSuccessMsg }) {
  // Collapsible Accordion Sub-Module Toggle State
  const [openSubModules, setOpenSubModules] = useState({
    channels: true,
    users: true,
    logs: true,
    watchlists: true,
    database: true,
  });

  const toggleSubModule = (key) => {
    setOpenSubModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- SUB-MODULE (i) STATES: ALERT CHANNELS ---
  const [emailConfig, setEmailConfig] = useState({
    senderEmail: 'alerts@suryasanc.com',
    senderPassword: '••••••••••••',
    smtpPort: '587',
    active: true,
    activeSessions: 1,
    totalSessions: 142
  });

  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '8856353879:AAFd-Vqj5FaWzjSbYYTSZZKK7y8n99MfPws',
    channelId: '@Wayanad_Forest_Alerts',
    active: true,
    activeSessions: 3,
    totalSessions: 890
  });

  const [smsConfig, setSmsConfig] = useState({
    gatewayUrl: 'https://sms.kerala.gov.in/api/v1/send',
    senderId: 'KLFRST',
    active: false,
    activeSessions: 0,
    totalSessions: 45
  });

  const [gpioConfig, setGpioConfig] = useState({
    assignedPins: 'Pin 18 (Hooter), Pin 22 (Relay 1)',
    active: true,
    activeSessions: 1,
    totalSessions: 68
  });

  // --- SUB-MODULE (ii) STATES: ALERT USERS ---
  const [alertUsers, setAlertUsers] = useState([
    { id: 'AU-01', name: 'Ranger Anil Kumar', app: 'WildWatch', email: 'anil@kerala.gov.in', mobile: '+91 9847012345', telegram: '@AnilK_Forest' },
    { id: 'AU-02', name: 'Inspector S. Suresh', app: 'Traffic - ANPR & ATCC', email: 'suresh.police@kerala.gov.in', mobile: '+91 9447112233', telegram: '@Suresh_ANPR' },
  ]);
  const [userForm, setUserForm] = useState({ name: '', app: 'WildWatch', email: '', mobile: '', telegram: '' });

  // --- SUB-MODULE (iii) STATES: ALERT SESSION LOGS ---
  const [sessionLogs] = useState([
    { id: '2089', group: 'Telegram-Alert', app: 'WildWatch', cam: 'KOLLIVAYAL GROUND 1', watchlist: 'TELEGRAM_WILDLIFE', category: 'Telegram', status: 'Failed', message: 'Connection timeout to API server', event: 'ID #150480 (ELEPHANT)', recipients: '@Wayanad_Forest_Alerts', time: '2026-08-18 19:15:22 IST' },
    { id: '2088', group: 'EMAIL-ALERT', app: 'WildWatch', cam: 'KOLLIVAYAL GROUND 1', watchlist: 'EMAIL_HIGH_SEVERITY', category: 'Email Address', status: 'Sent', message: 'Alert notification dispatched', event: 'ID #150476 (ELEPHANT)', recipients: 'anil@kerala.gov.in', time: '2026-08-18 19:12:05 IST' },
    { id: '2087', group: 'GPIO-Trigger', app: 'Perimeter Intrusion', cam: 'MUTHANGA POST 2', watchlist: 'FENCE_HOOTER', category: 'GPIO Pin 18', status: 'Sent', statusMsg: 'Relay triggered high for 10s', event: 'ID #150440 (Intrusion)', recipients: 'Hardware Relay 1', time: '2026-08-18 18:40:00 IST' },
  ]);

  // --- SUB-MODULE (iv) STATES: WATCHLIST MANAGEMENT ---
  const [watchlists, setWatchlists] = useState([
    { id: 'WL-01', name: 'Telegram Wildlife Alert', app: 'WildWatch', interval: '30', cam: 'KOLLIVAYAL GROUND 1' },
    { id: 'WL-02', name: 'ANPR Hotlist Dispatch', app: 'Traffic - ANPR & ATCC', interval: '10', cam: 'CHECKPOST NORTH' }
  ]);
  const [wlForm, setWlForm] = useState({ name: '', app: 'WildWatch', interval: '30', cam: 'KOLLIVAYAL GROUND 1' });

  // --- SUB-MODULE (v) STATES: HOTLIST DATABASE ---
  const [plateHotlist, setPlateHotlist] = useState([
    { id: 'PL-01', plateNumber: 'KL-10-AW-4091', tag: 'Stolen', notes: 'White Sedan - Wayanad Theft Incident' },
    { id: 'PL-02', plateNumber: 'KL-08-BF-8812', tag: 'Suspicious', notes: 'Logging Truck - Unauthorized Night Entry' }
  ]);
  const [plateForm, setPlateForm] = useState({ plateNumber: '', tag: 'Stolen', notes: '' });

  const [personHotlist, setPersonHotlist] = useState([
    { id: 'PR-01', name: 'Ramesh Kumar', tag: 'Wanted', photo: '', notes: 'Subject ID-908 - Forest Violation Case' },
    { id: 'PR-02', name: 'Ananya S', tag: 'Missing Person', photo: '', notes: 'Lookout notice issued by District HQ' }
  ]);
  const [personForm, setPersonForm] = useState({ name: '', tag: 'Wanted', photo: '', notes: '' });

  // Handlers
  const handleAddUser = (e) => {
    e.preventDefault();
    setAlertUsers([...alertUsers, { ...userForm, id: `AU-${Date.now()}` }]);
    setUserForm({ name: '', app: 'WildWatch', email: '', mobile: '', telegram: '' });
    setSuccessMsg('Alert User added successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteUser = (id) => {
    setAlertUsers(alertUsers.filter(u => u.id !== id));
    setSuccessMsg('Alert User removed.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddWatchlist = (e) => {
    e.preventDefault();
    setWatchlists([...watchlists, { ...wlForm, id: `WL-${Date.now()}` }]);
    setWlForm({ name: '', app: 'WildWatch', interval: '30', cam: 'KOLLIVAYAL GROUND 1' });
    setSuccessMsg('New Active Watchlist configured and saved!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddPlate = (e) => {
    e.preventDefault();
    setPlateHotlist([...plateHotlist, { ...plateForm, id: `PL-${Date.now()}` }]);
    setPlateForm({ plateNumber: '', tag: 'Stolen', notes: '' });
    setSuccessMsg('License Plate added to Hotlist Database!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddPerson = (e) => {
    e.preventDefault();
    setPersonHotlist([...personHotlist, { ...personForm, id: `PR-${Date.now()}` }]);
    setPersonForm({ name: '', tag: 'Wanted', photo: '', notes: '' });
    setSuccessMsg('Person Profile added to Hotlist Database!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePhotoBrowse = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonForm({ ...personForm, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* SUB-MODULE (i): ALERT MANAGEMENT / NOTIFICATION CHANNEL CONFIGURATION */}
      {/* ========================================================================= */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <button 
          onClick={() => toggleSubModule('channels')}
          className="w-full p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/60 transition"
        >
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sub-Module (i): Alert Management & Notification Channels</h2>
              <p className="text-[10px] text-slate-400 font-mono">Configure Email, Telegram, SMS, and Hardware GPIO triggers</p>
            </div>
          </div>
          {openSubModules.channels ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openSubModules.channels && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Widget 1: EMAIL ALERT */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Email Alert</h3>
                    <p className="text-[9px] text-slate-400 font-mono">SMTP Gateway</p>
                  </div>
                </div>

                <button 
                  onClick={() => setEmailConfig({ ...emailConfig, active: !emailConfig.active })}
                  className={`text-xl cursor-pointer ${emailConfig.active ? 'text-emerald-400' : 'text-slate-600'}`}
                >
                  {emailConfig.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              <div className="grid grid-cols-2 text-center py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl font-mono text-xs">
                <div>
                  <div className="text-white font-bold">{emailConfig.activeSessions}</div>
                  <div className="text-[9px] text-slate-500">Active Sessions</div>
                </div>
                <div className="border-l border-slate-800">
                  <div className="text-white font-bold">{emailConfig.totalSessions}</div>
                  <div className="text-[9px] text-slate-500">Total Sessions</div>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-mono text-slate-300">
                <div><span className="text-slate-500">Sender:</span> {emailConfig.senderEmail}</div>
                <div><span className="text-slate-500">SMTP Port:</span> {emailConfig.smtpPort}</div>
              </div>
            </div>

            {/* Widget 2: TELEGRAM ALERT */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Send size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Telegram Alert</h3>
                    <p className="text-[9px] text-slate-400 font-mono">Telethon HTTP Bot</p>
                  </div>
                </div>

                <button 
                  onClick={() => setTelegramConfig({ ...telegramConfig, active: !telegramConfig.active })}
                  className={`text-xl cursor-pointer ${telegramConfig.active ? 'text-emerald-400' : 'text-slate-600'}`}
                >
                  {telegramConfig.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              <div className="grid grid-cols-2 text-center py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl font-mono text-xs">
                <div>
                  <div className="text-emerald-400 font-bold">{telegramConfig.activeSessions}</div>
                  <div className="text-[9px] text-slate-500">Active Sessions</div>
                </div>
                <div className="border-l border-slate-800">
                  <div className="text-white font-bold">{telegramConfig.totalSessions}</div>
                  <div className="text-[9px] text-slate-500">Total Sessions</div>
                </div>
              </div>

              <div className="space-y-1 text-[10px] font-mono text-slate-300">
                <div><span className="text-slate-500">Channel:</span> {telegramConfig.channelId}</div>
                <div className="text-slate-500 truncate">Bot Token: <span className="text-cyan-400">••••••••30879:AAFd</span></div>
              </div>
            </div>

            {/* Widget 3: MOBILE - SMS */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Mobile - SMS</h3>
                    <p className="text-[9px] text-slate-400 font-mono">Mobile Sewa Gateway</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSmsConfig({ ...smsConfig, active: !smsConfig.active })}
                  className={`text-xl cursor-pointer ${smsConfig.active ? 'text-emerald-400' : 'text-slate-600'}`}
                >
                  {smsConfig.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              <div className="grid grid-cols-2 text-center py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl font-mono text-xs">
                <div>
                  <div className="text-slate-400 font-bold">{smsConfig.activeSessions}</div>
                  <div className="text-[9px] text-slate-500">Active Sessions</div>
                </div>
                <div className="border-l border-slate-800">
                  <div className="text-white font-bold">{smsConfig.totalSessions}</div>
                  <div className="text-[9px] text-slate-500">Total Sessions</div>
                </div>
              </div>

              <div className="space-y-1 text-[10px] font-mono text-slate-300">
                <div><span className="text-slate-500">Sender ID:</span> {smsConfig.senderId}</div>
                <div><span className="text-slate-500">Gateway:</span> Active API</div>
              </div>
            </div>

            {/* Widget 4: GPIO RELAY TRIGGER */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">GPIO Relay Trigger</h3>
                    <p className="text-[9px] text-slate-400 font-mono">Hardware Hooter Controller</p>
                  </div>
                </div>

                <button 
                  onClick={() => setGpioConfig({ ...gpioConfig, active: !gpioConfig.active })}
                  className={`text-xl cursor-pointer ${gpioConfig.active ? 'text-emerald-400' : 'text-slate-600'}`}
                >
                  {gpioConfig.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              <div className="grid grid-cols-2 text-center py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl font-mono text-xs">
                <div>
                  <div className="text-white font-bold">{gpioConfig.activeSessions}</div>
                  <div className="text-[9px] text-slate-500">Active Sessions</div>
                </div>
                <div className="border-l border-slate-800">
                  <div className="text-white font-bold">{gpioConfig.totalSessions}</div>
                  <div className="text-[9px] text-slate-500">Total Sessions</div>
                </div>
              </div>

              <div className="space-y-1 text-[10px] font-mono text-slate-300">
                <div><span className="text-slate-500">Assigned Pins:</span> {gpioConfig.assignedPins}</div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODULE (ii): ALERT USER MANAGEMENT */}
      {/* ========================================================================= */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <button 
          onClick={() => toggleSubModule('users')}
          className="w-full p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/60 transition"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sub-Module (ii): Alert User Management</h2>
              <p className="text-[10px] text-slate-400 font-mono">Provision recipients bound to AI Applications and notification handles</p>
            </div>
          </div>
          {openSubModules.users ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openSubModules.users && (
          <div className="p-6 space-y-6">
            
            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs font-mono">
              <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">Add Alert User Recipient</div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">User Full Name</label>
                  <input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="e.g. Officer Name" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">AI Application Bound</label>
                  <select value={userForm.app} onChange={e => setUserForm({ ...userForm, app: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 outline-none cursor-pointer">
                    <option>WildWatch</option>
                    <option>FACE REC</option>
                    <option>Traffic - ANPR & ATCC</option>
                    <option>Perimeter Intrusion</option>
                    <option>Fire & Smoke</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SSO Email</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="officer@domain.com" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Number (SMS)</label>
                  <input type="text" value={userForm.mobile} onChange={e => setUserForm({ ...userForm, mobile: e.target.value })} placeholder="+91 9847000000" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Telegram Username / Number</label>
                  <input type="text" value={userForm.telegram} onChange={e => setUserForm({ ...userForm, telegram: e.target.value })} placeholder="@TelegramHandle" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                <Plus size={16} /> Add Recipient User
              </button>
            </form>

            {/* Recipient Users Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">User Name</th>
                    <th className="p-3">Bound AI App</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Telegram</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {alertUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white">{u.name}</td>
                      <td className="p-3 text-cyan-400">{u.app}</td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3 text-slate-400">{u.mobile}</td>
                      <td className="p-3 text-amber-400">{u.telegram}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODULE (iii): ALERT SESSION LOGS */}
      {/* ========================================================================= */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <button 
          onClick={() => toggleSubModule('logs')}
          className="w-full p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/60 transition"
        >
          <div className="flex items-center gap-3">
            <List size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sub-Module (iii): Alert Session Logs</h2>
              <p className="text-[10px] text-slate-400 font-mono">Real-time synced dispatch history for all triggered notification channels</p>
            </div>
          </div>
          {openSubModules.logs ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openSubModules.logs && (
          <div className="p-6 space-y-4">
            
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">Total Logs Synced: <strong className="text-cyan-400">{sessionLogs.length}</strong></span>
              <button className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 hover:bg-amber-400 cursor-pointer">
                <Download size={14} /> Download CSV
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Id</th>
                    <th className="p-3">Group Name</th>
                    <th className="p-3">Application</th>
                    <th className="p-3">Camera Node</th>
                    <th className="p-3">Watchlist Name</th>
                    <th className="p-3">Delivery Status</th>
                    <th className="p-3">Event Link</th>
                    <th className="p-3">Recipients</th>
                    <th className="p-3">DateTime (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sessionLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-3 text-amber-400 font-bold">{log.id}</td>
                      <td className="p-3 text-white">{log.group}</td>
                      <td className="p-3 text-cyan-400">{log.app}</td>
                      <td className="p-3 text-slate-400">{log.cam}</td>
                      <td className="p-3 text-slate-300">{log.watchlist}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'Sent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-amber-400 underline cursor-pointer">{log.event}</td>
                      <td className="p-3 text-slate-400">{log.recipients}</td>
                      <td className="p-3 text-slate-500 text-[10px]">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODULE (iv): WATCHLIST MANAGEMENT */}
      {/* ========================================================================= */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <button 
          onClick={() => toggleSubModule('watchlists')}
          className="w-full p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/60 transition"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sub-Module (iv): Watchlist Management</h2>
              <p className="text-[10px] text-slate-400 font-mono">Create Watchlists with alert trigger interval throttling and linked camera nodes</p>
            </div>
          </div>
          {openSubModules.watchlists ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openSubModules.watchlists && (
          <div className="p-6 space-y-6">
            
            {/* Create Watchlist Form */}
            <form onSubmit={handleAddWatchlist} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs font-mono">
              <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">Create New Watchlist</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Watchlist Name</label>
                  <input type="text" value={wlForm.name} onChange={e => setWlForm({ ...wlForm, name: e.target.value })} placeholder="e.g. Telegram Wildlife Alert" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Applicable AI Application</label>
                  <select value={wlForm.app} onChange={e => setWlForm({ ...wlForm, app: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 outline-none cursor-pointer">
                    <option>WildWatch</option>
                    <option>FACE REC</option>
                    <option>Traffic - ANPR & ATCC</option>
                    <option>Perimeter Intrusion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Alert Throttling Interval (Seconds)</label>
                  <input type="number" value={wlForm.interval} onChange={e => setWlForm({ ...wlForm, interval: e.target.value })} placeholder="30" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-bold outline-none" required />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Link Camera Node</label>
                  <select value={wlForm.cam} onChange={e => setWlForm({ ...wlForm, cam: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none cursor-pointer">
                    {cameras.map(c => <option key={c.id} value={c.camName}>{c.camName}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2">
                <Plus size={16} /> Save Active Watchlist
              </button>
            </form>

            {/* Active Watchlist Cards Tile Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlists.map(wl => (
                <div key={wl.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-white font-bold truncate">{wl.name}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIVE</span>
                  </div>

                  <div className="space-y-1 text-slate-400">
                    <div>AI App: <span className="text-cyan-400">{wl.app}</span></div>
                    <div>Throttling: <span className="text-amber-400">{wl.interval}s interval</span></div>
                    <div>Camera Node: <span className="text-slate-200">{wl.cam}</span></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODULE (v): HOTLIST DATABASE */}
      {/* ========================================================================= */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <button 
          onClick={() => toggleSubModule('database')}
          className="w-full p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/60 transition"
        >
          <div className="flex items-center gap-3">
            <Database size={20} className="text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sub-Module (v): Hotlist Database</h2>
              <p className="text-[10px] text-slate-400 font-mono">Manage target License Plates and Face Recognition profiles</p>
            </div>
          </div>
          {openSubModules.database ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {openSubModules.database && (
          <div className="p-6 space-y-8">
            
            {/* Section A: License Plate Database */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Car size={16} className="text-amber-400" /> ANPR Hotlist Plates
              </h3>

              <form onSubmit={handleAddPlate} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">License Plate Number</label>
                    <input type="text" value={plateForm.plateNumber} onChange={e => setPlateForm({ ...plateForm, plateNumber: e.target.value })} placeholder="e.g. KL-10-AW-4091" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white uppercase font-bold outline-none" required />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Profile Tag</label>
                    <select value={plateForm.tag} onChange={e => setPlateForm({ ...plateForm, tag: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 outline-none cursor-pointer">
                      <option>Stolen</option>
                      <option>Suspicious</option>
                      <option>VIP</option>
                      <option>Look Out Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Case / Reason Notes</label>
                    <input type="text" value={plateForm.notes} onChange={e => setPlateForm({ ...plateForm, notes: e.target.value })} placeholder="Reason for hotlisting..." className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                  </div>
                </div>

                <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer">
                  Add Plate to Database
                </button>
              </form>

              {/* License Plate Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plateHotlist.map(p => (
                  <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="text-sm font-extrabold text-white">{p.plateNumber}</div>
                      <div className="text-[10px] text-slate-400">{p.notes}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {p.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Person Profiles Database */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <UserCheck size={16} className="text-cyan-400" /> Face Rec Hotlist Profiles
              </h3>

              <form onSubmit={handleAddPerson} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Person Full Name</label>
                    <input type="text" value={personForm.name} onChange={e => setPersonForm({ ...personForm, name: e.target.value })} placeholder="Subject Name" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Profile Tag</label>
                    <select value={personForm.tag} onChange={e => setPersonForm({ ...personForm, tag: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 outline-none cursor-pointer">
                      <option>Wanted</option>
                      <option>Look Out Notice</option>
                      <option>Missing Person</option>
                      <option>Staff</option>
                      <option>VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Photo Upload (Local Browse)</label>
                    <input type="file" accept="image/*" onChange={handlePhotoBrowse} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Case Summary Notes</label>
                  <input type="text" value={personForm.notes} onChange={e => setPersonForm({ ...personForm, notes: e.target.value })} placeholder="FIR details or case notes..." className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" required />
                </div>

                <button type="submit" className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer">
                  Add Person Profile to Database
                </button>
              </form>

              {/* Person Profiles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personHotlist.map(pr => (
                  <div key={pr.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 font-mono text-xs">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {pr.photo ? <img src={pr.photo} alt="Person" className="w-full h-full object-cover" /> : <Image size={20} className="text-slate-600" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate">{pr.name}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">{pr.tag}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-1">{pr.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
