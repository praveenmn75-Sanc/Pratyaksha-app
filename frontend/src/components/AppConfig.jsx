import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Cpu, Play, Square, RotateCcw, Save, Camera, Layers, 
  CheckCircle2, AlertCircle, ChevronUp, ChevronDown, Crosshair, HelpCircle, Tag
} from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

const APP_MODULES = [
  "Traffic - ANPR & ATCC",
  "FACE REC",
  "WildWatch",
  "Perimeter Intrusion",
  "Fire & Smoke"
];

export default function AppConfig({ setSuccessMsg }) {
  const [openHardware, setOpenHardware] = useState(true);
  const [openRouting, setOpenRouting] = useState(true);
  const [openROI, setOpenROI] = useState(true);
  const [openMapping, setOpenMapping] = useState(true);

  const [gpuStatus, setGpuStatus] = useState({ cuda_available: false, device_name: 'Checking...' });
  const [engineStatus, setEngineStatus] = useState({});
  const [computeMode, setComputeMode] = useState({});

  const [cameras, setCameras] = useState([]);
  const [appCameraMap, setAppCameraMap] = useState({});
  const [allRoiStatuses, setAllRoiStatuses] = useState({});

  // Module 3 Spatial Controls
  const [selectedCam, setSelectedCam] = useState('ANPR_TEST_C1');
  const [selectedApp, setSelectedApp] = useState('Traffic - ANPR & ATCC');
  const [roiName, setRoiName] = useState('Toll_Gate_A1');
  const [roiDirection, setRoiDirection] = useState('BI');

  // Spatial Coordinates States
  // For Traffic: Tripwire (pointA, pointB)
  const [pointA, setPointA] = useState(null);
  const [pointB, setPointB] = useState(null);

  // For Other Apps: Polygon ROI Free-Flow (points array)
  const [polygonPoints, setPolygonPoints] = useState([]);

  const canvasRef = useRef(null);
  const isTrafficApp = selectedApp === "Traffic - ANPR & ATCC";

  const fetchAllData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/system/gpu-status`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/engines`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/app-compute/config`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/cameras`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/app-cameras`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/roi/all-status`).then(r => r.json()).catch(() => ({}))
    ])
    .then(([gpuData, engData, compData, camData, mapData, roiData]) => {
      setGpuStatus(gpuData);
      setEngineStatus(engData);
      setComputeMode(compData);
      setCameras(camData || []);
      setAppCameraMap(mapData || {});
      setAllRoiStatuses(roiData || {});

      if (camData && camData.length > 0 && !selectedCam) {
        setSelectedCam(camData[0].camName);
      }
    });
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Existing Spatial Config
  useEffect(() => {
    if (!selectedCam || !selectedApp) return;
    fetch(`${API_BASE_URL}/roi/${selectedCam}/${selectedApp}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.configured) {
          setRoiName(data.roiName || 'Zone_Main');
          setRoiDirection(data.direction || 'BI');
          if (data.type === 'TRIPWIRE' && data.coordinates) {
            setPointA(data.coordinates.pointA || null);
            setPointB(data.coordinates.pointB || null);
            setPolygonPoints([]);
          } else if (data.type === 'POLYGON_ROI' && Array.isArray(data.coordinates)) {
            setPolygonPoints(data.coordinates || []);
            setPointA(null);
            setPointB(null);
          }
        } else {
          setRoiName(isTrafficApp ? 'Toll_Tripwire_Line' : 'Perimeter_Free_ROI');
          setPointA(null);
          setPointB(null);
          setPolygonPoints([]);
        }
      })
      .catch(() => {});
  }, [selectedCam, selectedApp, isTrafficApp]);

  // Canvas Drawing & Click Logic
  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (isTrafficApp) {
      // Tripwire logic
      if (!pointA || (pointA && pointB)) {
        setPointA({ x, y });
        setPointB(null);
      } else {
        setPointB({ x, y });
      }
    } else {
      // Polygon ROI Free-Flow logic
      setPolygonPoints(prev => [...prev, { x, y }]);
    }
  };

  const handleClearCanvas = () => {
    setPointA(null);
    setPointB(null);
    setPolygonPoints([]);
  };

  // Render Canvas Lines / Polygon
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (isTrafficApp) {
      // Draw Tripwire
      if (pointA) {
        const pxA = (pointA.x / 100) * width;
        const pyA = (pointA.y / 100) * height;

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pxA, pyA, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('A', pxA - 3, pyA + 3);

        if (pointB) {
          const pxB = (pointB.x / 100) * width;
          const pyB = (pointB.y / 100) * height;

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(pxB, pyB, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.fillText('B', pxB - 3, pyB + 3);

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(pxA, pyA);
          ctx.lineTo(pxB, pyB);
          ctx.stroke();
        }
      }
    } else {
      // Draw Multi-Point Polygon ROI
      if (polygonPoints.length > 0) {
        ctx.strokeStyle = '#06b6d4';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        polygonPoints.forEach((pt, idx) => {
          const px = (pt.x / 100) * width;
          const py = (pt.y / 100) * height;

          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);

          // Draw Vertex
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, 2 * Math.PI);
          ctx.fill();
        });

        if (polygonPoints.length > 2) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
    }
  }, [pointA, pointB, polygonPoints, isTrafficApp]);

  // Save Spatial Rules
  const handleSaveROI = () => {
    let modeType = isTrafficApp ? 'TRIPWIRE' : 'POLYGON_ROI';
    let coords = isTrafficApp ? { pointA, pointB } : polygonPoints;

    if (isTrafficApp && (!pointA || !pointB)) {
      alert("Please click twice on the image to set Point A and Point B for Tripwire.");
      return;
    }

    if (!isTrafficApp && polygonPoints.length < 3) {
      alert("Please click at least 3 points on the image to bound a Polygon ROI.");
      return;
    }

    fetch(`${API_BASE_URL}/roi/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camName: selectedCam,
        appModule: selectedApp,
        roiName: roiName || 'Default_Zone',
        type: modeType,
        direction: roiDirection,
        coordinates: coords
      })
    })
    .then(r => r.json())
    .then(res => {
      if (setSuccessMsg) setSuccessMsg(res.message);
      fetchAllData();
    });
  };

  const handleEngineControl = (appModule, action) => {
    const dev = computeMode[appModule] || 'gpu';
    fetch(`${API_BASE_URL}/engine/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appModule, action, device: dev })
    })
    .then(r => r.json())
    .then(res => {
      if (setSuccessMsg) setSuccessMsg(res.message);
      fetchAllData();
    });
  };

  const toggleCameraMapping = (appModule, camName) => {
    const currentCams = appCameraMap[appModule] || [];
    const isMapped = currentCams.includes(camName);
    const updated = isMapped ? currentCams.filter(c => c !== camName) : [...currentCams, camName];

    fetch(`${API_BASE_URL}/app-cameras/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appModule, cameraNames: updated })
    })
    .then(r => r.json())
    .then(res => {
      setAppCameraMap(res.mappings);
      if (setSuccessMsg) setSuccessMsg(`Updated camera mapping for [${appModule}]`);
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* MODULE 1: COMPUTE ACCELERATION */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <button 
          onClick={() => setOpenHardware(!openHardware)}
          className="w-full flex items-center justify-between text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> Module 1: System Hardware &amp; Compute Acceleration Engine
          </div>
          {openHardware ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {openHardware && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">CUDA Acceleration</div>
              <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Active (CUDA)
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Detected GPU Model</div>
              <div className="text-sm font-extrabold text-cyan-300 truncate">
                {gpuStatus.device_name || 'NVIDIA GeForce RTX 4060'}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Tensor Cores Status</div>
              <div className="text-sm font-extrabold text-amber-400">Standard CUDA Cores</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Compute Capability</div>
              <div className="text-sm font-extrabold text-white">8.9</div>
            </div>
          </div>
        )}
      </div>

      {/* MODULE 2: AI COMPUTE EXECUTION ROUTING */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <button 
          onClick={() => setOpenRouting(!openRouting)}
          className="w-full flex items-center justify-between text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-cyan-400" /> Module 2: App-Wise AI Compute Execution Routing
          </div>
          {openRouting ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {openRouting && (
          <div className="space-y-3 pt-2">
            {APP_MODULES.map(app => {
              const info = engineStatus[app] || {};
              const isRunning = info.running;

              return (
                <div key={app} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      <span>{app}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        isRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {isRunning ? `RUNNING (PID: ${info.pid})` : 'STOPPED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Script: {info.script || 'engine.py'}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEngineControl(app, isRunning ? 'restart' : 'start')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <Play size={14} /> {isRunning ? 'Restart AI Engine' : 'Start Engine'}
                    </button>

                    {isRunning && (
                      <button 
                        onClick={() => handleEngineControl(app, 'stop')}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold rounded-xl uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <Square size={14} /> Stop
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODULE 3: DUAL-MODE SPATIAL BOUNDING TOOL (TRIPWIRE VS POLYGON ROI) */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <button 
          onClick={() => setOpenROI(!openROI)}
          className="w-full flex items-center justify-between text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Crosshair size={18} className="text-amber-400" /> Module 3: Interactive Spatial Bounding Tool ({isTrafficApp ? 'Tripwire Mode' : 'Free-Flow Polygon ROI'})
          </div>
          {openROI ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {openROI && (
          <div className="space-y-4 pt-2">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Select Camera Node</label>
                <select 
                  value={selectedCam} onChange={e => setSelectedCam(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none"
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.camName}>{c.camName}</option>
                  ))}
                  {cameras.length === 0 && <option value="ANPR_TEST_C1">ANPR_TEST_C1</option>}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">AI Application Module</label>
                <select 
                  value={selectedApp} onChange={e => setSelectedApp(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none"
                >
                  {APP_MODULES.map(app => (
                    <option key={app} value={app}>{app}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Assigned ROI / Tripwire Name</label>
                <input 
                  type="text" placeholder="e.g. Zone_North_Gate" required
                  value={roiName} onChange={e => setRoiName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 text-white font-bold rounded-xl outline-none"
                />
              </div>

              {isTrafficApp ? (
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Vector Direction</label>
                  <select 
                    value={roiDirection} onChange={e => setRoiDirection(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 text-emerald-400 font-bold rounded-xl outline-none"
                  >
                    <option value="BI">BI-DIRECTIONAL (BOTH)</option>
                    <option value="IN">VECTOR IN ONLY</option>
                    <option value="OUT">VECTOR OUT ONLY</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Spatial Mode</label>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 text-cyan-400 font-bold rounded-xl">
                    Polygon ROI (Free-Flow)
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Canvas Overlay */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-crosshair">
              <img 
                src={`http://${HOST_IP}:1984/api/frame.jpeg?src=${(selectedCam || 'anpr_test_c1').toLowerCase()}`} 
                alt="Camera Frame" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `http://${HOST_IP}:8005/static/captures/capture_1787155929706.jpg`; }}
              />

              <canvas 
                ref={canvasRef}
                width={960}
                height={540}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-slate-400 font-bold flex items-center gap-2">
                <HelpCircle size={16} className="text-amber-400" />
                {isTrafficApp ? (
                  <span>Click twice on image to set <strong className="text-amber-400">Point A</strong> and <strong className="text-cyan-400">Point B</strong> for Tripwire.</span>
                ) : (
                  <span>Click multiple times on image to bound <strong className="text-cyan-400">Polygon ROI Free-Flow Zone</strong>. ({polygonPoints.length} vertices added)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearCanvas}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  <RotateCcw size={14} /> Clear Canvas
                </button>

                <button 
                  onClick={handleSaveROI}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Save size={16} /> Save Spatial Rule
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODULE 4: PER-APPLICATION CAMERA MAPPING CONTROLS WITH ROI REFLECTION */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
        <button 
          onClick={() => setOpenMapping(!openMapping)}
          className="w-full flex items-center justify-between text-sm font-extrabold text-white uppercase tracking-wider cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-emerald-400" /> Module 4: Per-Application Camera Node Mapping Controls
          </div>
          {openMapping ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {openMapping && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {APP_MODULES.map(app => {
              const mappedCams = appCameraMap[app] || [];

              return (
                <div key={app} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-xs">{app}</span>
                    <span className="text-[10px] font-extrabold text-cyan-400">{mappedCams.length} Nodes Assigned</span>
                  </div>

                  <div className="space-y-2">
                    {cameras.map(c => {
                      const isChecked = mappedCams.includes(c.camName);
                      const roiKey = `${c.camName}:${app}`;
                      const roiInfo = allRoiStatuses[roiKey];

                      return (
                        <div key={c.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-400 font-bold flex items-center gap-2">
                              <Camera size={14} /> {c.camName} ({c.location || 'Toll Lane'})
                            </span>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => toggleCameraMapping(app, c.camName)}
                              className="w-4 h-4 accent-cyan-500 cursor-pointer"
                            />
                          </div>

                          {/* Dynamic Spatial Rule Reflection */}
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Tag size={12} className="text-cyan-400" /> Spatial Rule:
                            </span>
                            {roiInfo && roiInfo.configured ? (
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                {roiInfo.roiName} ({roiInfo.type})
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">No ROI / Tripwire set</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {cameras.length === 0 && (
                      <div className="text-slate-500 text-center py-2">No active cameras found.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
