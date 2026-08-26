import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, Cpu, Camera, MapPin, Play, Square, Save, Trash2, 
  ChevronRight, Wifi, Activity, Maximize2, Edit3, RotateCcw, Check, ShieldCheck
} from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

const AI_ENGINES_LIST = [
  'Traffic - ANPR & ATCC',
  'FACE REC',
  'WildWatch',
  'Perimeter Intrusion',
  'Fire & Smoke'
];

export default function AppConfig() {
  const [organizations, setOrganizations] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_orgs');
    return saved ? JSON.parse(saved) : [{ id: 'org_tzp', orgName: 'SuryaSANC Enterprise', tenantCode: 'TZP' }];
  });

  const [areas, setAreas] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_areas');
    return saved ? JSON.parse(saved) : [{ id: 'area_tzp', orgId: 'org_tzp', parentArea: 'TZP', subAreas: ['TZP_OC'] }];
  });

  const [cameras, setCameras] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_cams');
    return saved ? JSON.parse(saved) : [{ id: 'cam_anpr_entry', orgId: 'org_tzp', area: 'TZP', subArea: 'TZP_OC', camName: 'ANPR_TEST_ENTRY', appModule: 'Traffic - ANPR & ATCC', rtsp: 'rtsp://192.168.100.229:554/profile1' }];
  });

  const [activeRules, setActiveRules] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_rules');
    return saved ? JSON.parse(saved) : [];
  });

  const [enginesStatus, setEnginesStatus] = useState({
    'Traffic - ANPR & ATCC': true,
    'FACE REC': false,
    'WildWatch': false,
    'Perimeter Intrusion': false,
    'Fire & Smoke': false
  });

  const [selectedModule, setSelectedModule] = useState('Traffic - ANPR & ATCC');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedAreaName, setSelectedAreaName] = useState('ALL');
  const [selectedCamId, setSelectedCamId] = useState('');

  const [matrixStep, setMatrixStep] = useState(1);
  const [drawTool, setDrawTool] = useState('TRIPWIRE_LINE'); 
  const [ruleName, setRuleName] = useState('');
  const [directionLogic, setDirectionLogic] = useState('INBOUND_ENTRY');
  const [points, setPoints] = useState([]);
  
  const canvasRef = useRef(null);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('pratyaksha_rules', JSON.stringify(activeRules));
  }, [activeRules]);

  const syncAllModulesData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/admin/organizations`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/admin/areas`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE_URL}/admin/cameras`).then(r => r.json()).catch(() => null)
    ]).then(([orgs, ars, cams]) => {
      if (Array.isArray(orgs) && orgs.length > 0) {
        setOrganizations(orgs);
        localStorage.setItem('pratyaksha_orgs', JSON.stringify(orgs));
      }
      if (Array.isArray(cams) && cams.length > 0) {
        setCameras(cams);
        localStorage.setItem('pratyaksha_cams', JSON.stringify(cams));
      }
    });
  };

  useEffect(() => {
    syncAllModulesData();
    const interval = setInterval(syncAllModulesData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) setSelectedOrgId(organizations[0].id);
    if (cameras.length > 0 && !selectedCamId) setSelectedCamId(cameras[0].id);
  }, [organizations, cameras]);

  useEffect(() => {
    let interval;
    if (matrixStep === 2) interval = setInterval(() => setFrameCount(f => f + 1), 40);
    return () => clearInterval(interval);
  }, [matrixStep]);

  useEffect(() => {
    if (matrixStep !== 2 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length === 0) return;

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';

    if (drawTool === 'TRIPWIRE_LINE') {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();

      if (points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      if (points.length > 2) ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }

    points.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 0 ? '#10b981' : '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

  }, [points, drawTool, matrixStep]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (drawTool === 'TRIPWIRE_LINE' && points.length >= 2) {
      setPoints([{ x, y }]);
    } else {
      setPoints([...points, { x, y }]);
    }
  };

  const getGo2rtcStreamKey = (camName) => {
    const name = (camName || '').toLowerCase();
    if (name.includes('anpr') || name.includes('tzp')) return 'anpr_test_c1';
    if (name.includes('face')) return 'face_test_c1';
    return 'anpr_test_c1';
  };

  const activeTargetCam = cameras.find(c => c.id === selectedCamId) || cameras[0] || { camName: 'ANPR_TEST_ENTRY', rtsp: 'rtsp://192.168.100.229:554/profile1' };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* HEADER BAR */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-5 shadow-2xl flex items-center justify-between">
        <div>
          <h1 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Layers size={18} /> APP CONFIGURATION &amp; REAL-TIME SPATIAL ROI
          </h1>
          <p className="text-slate-400 text-[10px]">Compute Execution Routing, Interactive RTSP Vector Tripwire Drawing &amp; Global Module Sync</p>
        </div>
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-extrabold rounded-xl text-[10px]">
          {AI_ENGINES_LIST.length} Modules Online
        </div>
      </div>

      {/* SECTION 1: AI APPLICATIONS STATUS & COMPUTE ALLOCATION */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu size={16} /> AI APPLICATIONS STATUS &amp; COMPUTE ALLOCATION
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {AI_ENGINES_LIST.map(eng => {
            const isRunning = enginesStatus[eng];
            const count = cameras.filter(c => c.appModule === eng).length;

            return (
              <div key={eng} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition ${isRunning ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    {isRunning ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Nodes: <span className="text-cyan-400 font-extrabold">{count}</span>
                  </span>
                </div>

                <div className="font-extrabold text-white text-xs">{eng}</div>

                <button 
                  onClick={() => setEnginesStatus(prev => ({ ...prev, [eng]: !prev[eng] }))}
                  className={`w-full py-2 rounded-xl font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition text-[10px] ${
                    isRunning 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg'
                  }`}
                >
                  {isRunning ? <><Square size={12} /> STOP ENGINE</> : <><Play size={12} /> LAUNCH ENGINE</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: SPATIAL ROI & TRIPWIRE CANVAS MATRIX */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <MapPin size={16} /> SPATIAL ROI &amp; TRIPWIRE CANVAS MATRIX
          </h2>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-[10px] font-bold ${matrixStep === 1 ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-500'}`}>
              1. Target Scope &amp; Node
            </span>
            <span className={`px-3 py-1 rounded-xl text-[10px] font-bold ${matrixStep === 2 ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-500'}`}>
              2. Interactive Canvas Drawing
            </span>
          </div>
        </div>

        {matrixStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">AI Application</label>
                <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2.5 rounded-xl outline-none">
                  {AI_ENGINES_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Organisation</label>
                <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-bold p-2.5 rounded-xl outline-none">
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.orgName} ({o.tenantCode})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Division Area</label>
                <select value={selectedAreaName} onChange={e => setSelectedAreaName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-bold p-2.5 rounded-xl outline-none">
                  <option value="ALL">All Division Areas</option>
                  {areas.map(a => <option key={a.id} value={a.parentArea}>{a.parentArea}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase">Camera Stream Node</label>
                <select value={selectedCamId} onChange={e => setSelectedCamId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-purple-400 font-bold p-2.5 rounded-xl outline-none">
                  {cameras.map(c => <option key={c.id} value={c.id}>{c.camName} ({c.area || 'TZP'})</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setMatrixStep(2)} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-2 cursor-pointer">
                LAUNCH REAL-TIME CANVAS DRAWING <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {matrixStep === 2 && (
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setDrawTool('TRIPWIRE_LINE'); setPoints([]); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer ${drawTool === 'TRIPWIRE_LINE' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
                >
                  <Edit3 size={13} /> 2-Point Directional Tripwire
                </button>
                <button 
                  onClick={() => { setDrawTool('POLYGON_ZONE'); setPoints([]); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer ${drawTool === 'POLYGON_ZONE' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
                >
                  <Maximize2 size={13} /> Multi-Point Polygon Zone
                </button>
                <button 
                  onClick={() => setPoints([])}
                  className="px-3 py-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} /> Clear Points
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={ruleName} 
                  onChange={e => setRuleName(e.target.value)} 
                  placeholder="Rule Identifier (e.g. ENTRY_TRIPWIRE_01)" 
                  className="bg-slate-900 border border-slate-800 text-white p-2 rounded-xl text-[10px] outline-none w-56" 
                />
                <select 
                  value={directionLogic} 
                  onChange={e => setDirectionLogic(e.target.value)} 
                  className="bg-slate-900 border border-slate-800 text-cyan-400 font-bold p-2 rounded-xl text-[10px] outline-none"
                >
                  <option value="INBOUND_ENTRY">Inbound (A → B)</option>
                  <option value="OUTBOUND_EXIT">Outbound (B → A)</option>
                  <option value="BIDIRECTIONAL">Bi-Directional</option>
                </select>
              </div>
            </div>

            {/* WEBRTC LIVE FRAME BACKGROUND VIA GO2RTC WITH CANVAS OVERLAY */}
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col justify-between p-4">
              
              <img 
                src={`http://${HOST_IP}:1984/api/frame.jpeg?src=${getGo2rtcStreamKey(activeTargetCam.camName)}`} 
                alt="WebRTC Stream Feed" 
                className="absolute inset-0 w-full h-full object-cover z-0"
                onError={(e) => { e.target.src = `http://${HOST_IP}:8005/static/captures/capture_init.jpg`; }}
              />

              <div className="flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-slate-950 font-extrabold text-[9px] rounded-lg">
                    <Wifi size={10} /> WEBRTC LIVE STREAM
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900/90 text-cyan-400 font-mono text-[9px] rounded-lg border border-slate-800">
                    {activeTargetCam.camName} ({activeTargetCam.rtsp})
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Activity size={12} className="animate-pulse" /> 25.0 FPS | Frames: {1000 + frameCount}
                </div>
              </div>

              <canvas 
                ref={canvasRef}
                width={800}
                height={450}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              />

              <div className="z-20 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[10px]">
                <div className="text-slate-400">
                  Points Placed: <span className="text-amber-400 font-bold">{points.length}</span> {points.map((p, i) => `[P${i+1}: ${p.x},${p.y}]`).join(' ')}
                </div>
                <div className="text-cyan-400 font-bold">
                  Tool Mode: {drawTool}
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setMatrixStep(1)} className="px-5 py-2 bg-slate-900 text-slate-300 font-bold rounded-xl cursor-pointer">
                Back to Selection
              </button>
              <button 
                onClick={() => {
                  const targetCam = cameras.find(c => c.id === selectedCamId) || cameras[0];
                  const newRule = {
                    id: `rule_${Date.now()}`,
                    ruleName: ruleName || `Tripwire #${activeRules.length + 1}`,
                    module: selectedModule,
                    camName: targetCam ? targetCam.camName : 'ANPR_TEST_ENTRY',
                    direction: directionLogic,
                    drawType: drawTool,
                    coordinates: points
                  };
                  setActiveRules([...activeRules, newRule]);
                  setMatrixStep(1);
                  setRuleName('');
                  setPoints([]);
                  alert(`Spatial ROI Rule "${newRule.ruleName}" saved and synchronized across all modules!`);
                }} 
                disabled={points.length < 2}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
              >
                <Save size={14} /> SAVE &amp; SYNCHRONIZE SPATIAL TRIPWIRE
              </button>
            </div>

          </div>
        )}

      </div>

      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} /> ACTIVE TRIPWIRE RULES &amp; SYNCHRONIZED VECTOR MATRIX
          </h2>
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
            {activeRules.length} Active Rules
          </span>
        </div>

        {activeRules.length > 0 ? (
          <div className="space-y-2">
            {activeRules.map(r => (
              <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="font-extrabold text-white flex items-center gap-2">
                    {r.ruleName} <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 rounded-full">{r.drawType}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Module: <span className="text-cyan-400">{r.module}</span> | Node: <span className="text-amber-400">{r.camName}</span> | Direction: <span className="text-emerald-400">{r.direction}</span> | Points: {Array.isArray(r.coordinates) ? r.coordinates.length : 0}
                  </div>
                </div>
                <button onClick={() => setActiveRules(activeRules.filter(item => item.id !== r.id))} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No ROI tripwire rules configured yet. Launch the canvas drawing tool above to create rules.
          </div>
        )}
      </div>

    </div>
  );
}
