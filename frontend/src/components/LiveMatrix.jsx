import React, { useState, useEffect } from 'react';
import { Video, Maximize, Tv } from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

export default function LiveMatrix() {
  const [cameras, setCameras] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_cams');
    return saved ? JSON.parse(saved) : [
      { id: 'cam_anpr_entry', camName: 'ANPR_TEST_ENTRY', area: 'TZP', subArea: 'TZP_OC', rtsp: 'rtsp://192.168.100.229:554/profile1' }
    ];
  });
  
  const [gridSize, setGridSize] = useState('2x2');
  const [activeCell, setActiveCell] = useState(0);
  const [cellFeeds, setCellFeeds] = useState({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/cameras`)
      .then(r => r.json())
      .then(cams => {
        if (Array.isArray(cams) && cams.length > 0) {
          setCameras(cams);
          localStorage.setItem('pratyaksha_cams', JSON.stringify(cams));
        }
      })
      .catch(() => {});
  }, []);

  const totalCells = gridSize === '1x1' ? 1 : gridSize === '2x2' ? 4 : gridSize === '3x3' ? 9 : 16;

  const assignCameraToCell = (cam) => {
    setCellFeeds(prev => ({ ...prev, [activeCell]: cam }));
  };

  const getGo2rtcStreamKey = (camName) => {
    const name = (camName || '').toLowerCase();
    if (name.includes('anpr') || name.includes('tzp')) return 'anpr_test_c1';
    if (name.includes('face')) return 'face_test_c1';
    return 'anpr_test_c1';
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      
      {/* HEADER TOOLBAR */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl flex items-center gap-1.5">
            <Tv size={14} /> Hide Camera Tree
          </button>
          
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['1x1', '2x2', '3x3', '4x4'].map(sz => (
              <button 
                key={sz} 
                onClick={() => setGridSize(sz)}
                className={`px-3 py-1 rounded-lg font-extrabold ${gridSize === sz ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold">Active Tile: <span className="text-amber-400">Cell #{activeCell + 1}</span></span>
          <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl flex items-center gap-1">
            <Maximize size={13} /> Full Screen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* NODE HIERARCHY TREE */}
        <div className="md:col-span-3 bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Node Hierarchy Tree</span>
            <span className="text-cyan-400 font-bold text-[10px] bg-cyan-500/10 border border-cyan-500/30 px-2 rounded-full">{cameras.length} Nodes</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {cameras.map((c, i) => (
              <div 
                key={c.id || i}
                onClick={() => assignCameraToCell(c)}
                className="p-3 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-cyan-500 transition space-y-1"
              >
                <div className="font-extrabold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-cyan-400"><Video size={13} /> {c.camName}</span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 rounded-full">ACTIVE</span>
                </div>
                <div className="text-slate-500 text-[10px] truncate">{c.area || 'TZP'} &gt; {c.subArea || 'TZP_OC'}</div>
                <div className="text-slate-600 text-[9px] font-mono truncate">{c.rtsp}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE MATRIX VIDEO GRID */}
        <div className={`md:col-span-9 grid gap-3 ${gridSize === '1x1' ? 'grid-cols-1' : gridSize === '2x2' ? 'grid-cols-2' : gridSize === '3x3' ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {Array.from({ length: totalCells }).map((_, idx) => {
            const assignedCam = cellFeeds[idx];
            const isSelected = activeCell === idx;

            return (
              <div 
                key={idx}
                onClick={() => setActiveCell(idx)}
                className={`aspect-video rounded-3xl overflow-hidden border relative flex flex-col justify-between p-3 bg-slate-950 cursor-pointer transition ${isSelected ? 'border-cyan-500 shadow-xl shadow-cyan-500/10' : 'border-slate-800'}`}
              >
                {assignedCam ? (
                  <>
                    <img 
                      src={`http://${HOST_IP}:1984/api/frame.jpeg?src=${getGo2rtcStreamKey(assignedCam.camName)}`} 
                      alt="WebRTC Stream Feed" 
                      className="absolute inset-0 w-full h-full object-cover z-0"
                      onError={(e) => { e.target.src = `http://${HOST_IP}:8005/static/captures/capture_init.jpg`; }}
                    />
                    <div className="z-10 flex justify-between items-center bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-cyan-400 font-extrabold text-[10px]">{assignedCam.camName}</span>
                      <span className="text-emerald-400 font-bold text-[9px]">WEBRTC LIVE</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-[10px] space-y-1">
                    <Tv size={24} />
                    <span>CELL #{idx + 1} IDLE</span>
                    <span className="text-[8px] text-slate-700">Click node in tree to assign</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
