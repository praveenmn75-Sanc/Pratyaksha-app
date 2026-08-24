import React, { useEffect, useRef } from 'react';
import { 
  ShieldAlert, Radio, AlertTriangle, Cpu, Camera, Clock, 
  Car, UserCheck, Flame, Trees, UserX, MapPin
} from 'lucide-react';

export default function CommandCenter({
  activeOrg, currentTimeIST, hwStats, cameras = [],
  activeCamerasCount, inactiveCamerasCount, recentEvents = []
}) {
  const displayEvents = recentEvents.slice(0, 10);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Inject Leaflet CSS & JS dynamically
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const defaultLat = cameras[0]?.lat ? parseFloat(cameras[0].lat) : 10.5276;
        const defaultLng = cameras[0]?.lng ? parseFloat(cameras[0].lng) : 76.2144;

        const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      // Dynamically Render Camera Pins using Lat/Long
      cameras.forEach(cam => {
        const lat = parseFloat(cam.lat) || 10.5276;
        const lng = parseFloat(cam.lng) || 76.2144;

        const marker = window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <strong style="color: #06b6d4;">${cam.camName}</strong><br/>
            <span>Area: ${cam.area || 'N/A'}</span><br/>
            <span>Sub-Area: ${cam.subArea || 'N/A'}</span><br/>
            <span>Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
          </div>
        `);
      });
    }
  }, [cameras]);

  const getEventIcon = (eventClass = '', appModule = '') => {
    const cls = eventClass.toUpperCase();
    const app = appModule.toUpperCase();

    if (cls.includes('CAR') || cls.includes('BUS') || cls.includes('TRUCK') || cls.includes('ANPR')) {
      return <Car size={16} className="text-cyan-400" />;
    }
    if (cls.includes('FACE') || cls.includes('STAFF') || cls.includes('VIP')) {
      return <UserCheck size={16} className="text-emerald-400" />;
    }
    if (cls.includes('WANTED') || cls.includes('VISITOR') || cls.includes('UNKNOWN')) {
      return <UserX size={16} className="text-red-400" />;
    }
    if (app.includes('WILD') || cls.includes('ELEPHANT') || cls.includes('TIGER')) {
      return <Trees size={16} className="text-amber-400" />;
    }
    if (app.includes('FIRE') || cls.includes('FLAME') || cls.includes('SMOKE')) {
      return <Flame size={16} className="text-orange-500" />;
    }
    return <AlertTriangle size={16} className="text-amber-400" />;
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Active System Time</div>
            <div className="text-sm font-bold text-cyan-400">{currentTimeIST || 'Syncing IST...'}</div>
          </div>
          <Clock size={20} className="text-cyan-400" />
        </div>

        <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Camera Nodes</div>
            <div className="text-sm font-bold text-emerald-400">{activeCamerasCount} Active / {inactiveCamerasCount} Offline</div>
          </div>
          <Camera size={20} className="text-emerald-400" />
        </div>

        <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">GPU Acceleration</div>
            <div className="text-sm font-bold text-amber-400">{hwStats.gpu}% Load</div>
          </div>
          <Cpu size={20} className="text-amber-400" />
        </div>

        <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Dispatched Alerts</div>
            <div className="text-sm font-bold text-red-400">{recentEvents.length} Total Triggered</div>
          </div>
          <ShieldAlert size={20} className="text-red-400" />
        </div>
      </div>

      {/* GIS Leaflet Map (Left) + Live Dispatched Alerts Stream (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#070b19] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-cyan-400" /> GIS Real-Time Camera Map Overlay
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold">OpenStreetMap Lat/Long Active</span>
          </div>

          <div ref={mapContainerRef} className="h-96 rounded-2xl border border-slate-800 overflow-hidden z-10" />
        </div>

        <div className="lg:col-span-5 bg-[#070b19] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio size={16} className="text-cyan-400 animate-pulse" /> Live Alerts Stream (Max 10)
            </h2>
            <span className="text-[10px] text-slate-500">Real-Time WS</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
            {displayEvents.length > 0 ? (
              displayEvents.map((ev, idx) => (
                <div key={ev.id || idx} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
                      {getEventIcon(ev.class, ev.app)}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span>{ev.cam}</span>
                        <span className="text-cyan-400 text-[9px]">[{ev.app}]</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{ev.data}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-bold text-amber-400">{ev.class}</div>
                    <div className="text-[9px] text-slate-500">{ev.time ? ev.time.split(' ')[1] : ''}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">Listening for WebSocket stream events...</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
