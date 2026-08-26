import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Cpu, Activity, Video, Radio, Shield, AlertTriangle } from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

const customPinIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: #06b6d4; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export default function CommandCentre() {
  const [telemetry, setTelemetry] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCam, setSelectedCam] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_BASE_URL}/system/telemetry`).then(r => r.json()).then(setTelemetry).catch(() => {});
      fetch(`${API_BASE_URL}/admin/cameras`).then(r => r.json()).then(cams => {
        if (Array.isArray(cams) && cams.length > 0) {
          setCameras(cams);
          localStorage.setItem('pratyaksha_cams', JSON.stringify(cams));
          if (!selectedCam) setSelectedCam(cams[0]);
        }
      }).catch(() => {
        const saved = localStorage.getItem('pratyaksha_cams');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCameras(parsed);
          if (!selectedCam && parsed.length > 0) setSelectedCam(parsed[0]);
        }
      });
      fetch(`${API_BASE_URL}/events`).then(r => r.json()).then(setEvents).catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  const activeCamCount = cameras.filter(c => c.status === 'ACTIVE' || !c.status).length;
  const mapCenter = selectedCam && selectedCam.lat ? [parseFloat(selectedCam.lat), parseFloat(selectedCam.lng)] : [10.5276, 76.2144];

  return (
    <div className="space-y-4 font-mono text-xs">
      
      {/* TOP STATUS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">COMMAND CLOCK</div>
            <div className="text-lg font-extrabold text-cyan-400 flex items-center gap-1.5 mt-1">
              <Clock size={16} /> {new Date().toLocaleTimeString()}
            </div>
          </div>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">IST UTC+5:30</span>
        </div>

        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between col-span-2">
          <div className="flex items-center gap-3">
            <Cpu size={24} className="text-cyan-400" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">SYSTEM HARDWARE &amp; CUDA ALLOCATION</div>
              <div className="text-white font-extrabold text-xs mt-1">
                CPU: <span className="text-cyan-400">{telemetry?.cpu_usage || 14.2}%</span> | 
                RAM: <span className="text-cyan-400">{telemetry?.ram?.used_gb || 6.1} / 16 GB</span> | 
                GPU: <span className="text-emerald-400">{telemetry?.gpu_temp || 42}°C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">ACTIVE EDGE NODES</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-1">{activeCamCount} Active</div>
          </div>
          <Radio size={20} className="text-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* GIS MAP & NODE INSPECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* LEAFLET SPATIAL MAP */}
        <div className="md:col-span-8 bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
              <Activity size={14} className="text-cyan-400" /> LIVE GIS SPATIAL MAP (KERALA SECTOR)
            </span>
            <span className="text-cyan-400 text-[9px] font-bold bg-cyan-500/10 border border-cyan-500/30 px-2 rounded-full">LIVE OSM TILE FEED</span>
          </div>

          <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 relative z-0">
            <MapContainer center={mapCenter} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {cameras.map((c, idx) => {
                const lat = parseFloat(c.lat || 10.5276);
                const lng = parseFloat(c.lng || 76.2144);
                return (
                  <Marker 
                    key={c.id || idx} 
                    position={[lat, lng]} 
                    icon={customPinIcon}
                    eventHandlers={{ click: () => setSelectedCam(c) }}
                  >
                    <Popup className="font-mono text-xs">
                      <div className="font-bold text-cyan-600">{c.camName}</div>
                      <div>{c.area} / {c.subArea}</div>
                      <div className="text-[10px] text-gray-500">[{lat.toFixed(4)}, {lng.toFixed(4)}]</div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* NODE INSPECTOR SIDEBAR */}
        <div className="md:col-span-4 bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">NODE INSPECTOR</span>
              <span className="text-emerald-400 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 rounded-full">STREAM READY</span>
            </div>

            {selectedCam ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <div className="text-cyan-400 font-extrabold text-sm">{selectedCam.camName}</div>
                  <div className="text-slate-400 text-[10px]">App Engine: <span className="text-white">{selectedCam.appModule || 'Traffic - ANPR & ATCC'}</span></div>
                  <div className="text-slate-400 text-[10px]">Location: <span className="text-amber-400">{selectedCam.area} &gt; {selectedCam.subArea}</span></div>
                  <div className="text-slate-400 text-[10px]">GIS Lat/Long: <span className="text-emerald-400 font-mono">[{selectedCam.lat || '10.5276'}, {selectedCam.lng || '76.2144'}]</span></div>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <img 
                    src={`http://${HOST_IP}:1984/api/frame.jpeg?src=anpr_test_c1`} 
                    alt="Inspector Stream" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `http://${HOST_IP}:8005/static/captures/capture_init.jpg`; }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">Select a camera pin on the GIS map to inspect details.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
