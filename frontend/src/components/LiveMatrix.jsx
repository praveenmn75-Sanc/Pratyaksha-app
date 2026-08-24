import React, { useEffect, useRef, useState } from 'react';
import { Camera, Radio, Maximize2, Minimize2 } from 'lucide-react';

const GO2RTC_HOST = window.location.hostname || 'localhost';
const GO2RTC_API_URL = `http://${GO2RTC_HOST}:1984`;
const GO2RTC_WS_URL = `ws://${GO2RTC_HOST}:1984`;

function StreamCell({ cam, index, selectedCellIndex, setSelectedCellIndex, removeCameraFromCell }) {
  const videoRef = useRef(null);
  const [useFallback, setUseFallback] = useState(false);
  const [frameUrl, setFrameUrl] = useState('');

  // Controlled Snapshot Interval Fallback (Prevents Broken Pipes)
  useEffect(() => {
    if (!useFallback || !cam) return;

    const streamKey = cam.camName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fetchFrame = () => {
      setFrameUrl(`${GO2RTC_API_URL}/api/frame.jpeg?src=${streamKey}&t=${Date.now()}`);
    };

    fetchFrame();
    const interval = setInterval(fetchFrame, 1000); // Throttled to 1 FPS to eliminate EPIPE errors

    return () => clearInterval(interval);
  }, [useFallback, cam]);

  // WebRTC Stream Negotiation
  useEffect(() => {
    if (!cam) return;
    setUseFallback(false);

    const streamKey = cam.camName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const wsUrl = `${GO2RTC_WS_URL}/api/ws?src=${streamKey}`;
    
    let pc = new RTCPeerConnection();
    let ws;

    pc.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
        });
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'answer') {
            pc.setRemoteDescription(new RTCSessionDescription(msg));
          }
        } catch (err) {
          setUseFallback(true);
        }
      };

      ws.onerror = () => setUseFallback(true);
    } catch (e) {
      setUseFallback(true);
    }

    const timer = setTimeout(() => {
      if (videoRef.current && !videoRef.current.srcObject) {
        setUseFallback(true);
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      pc.close();
    };
  }, [cam]);

  const isSelected = selectedCellIndex === index;

  return (
    <div 
      onClick={() => setSelectedCellIndex(index)}
      className={`relative bg-slate-950 rounded-2xl border overflow-hidden flex items-center justify-center cursor-pointer transition ${
        isSelected ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {cam ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {!useFallback ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={frameUrl}
              alt="Live Stream Frame"
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl text-[10px] font-bold text-white flex items-center gap-2">
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            <span>{cam.camName}</span>
          </div>

          <button
            onClick={(e) => removeCameraFromCell(index, e)}
            className="absolute top-3 right-3 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="text-center space-y-1 text-slate-600 font-mono">
          <Camera size={24} className="mx-auto text-slate-700" />
          <div className="text-[10px]">Slot #{index + 1} Empty</div>
        </div>
      )}
    </div>
  );
}

export default function LiveMatrix({
  isCameraTreeOpen, setIsCameraTreeOpen,
  matrixGridSize, setMatrixGridSize,
  selectedCellIndex, setSelectedCellIndex,
  isFullScreen, setIsFullScreen,
  activeOrg, areas, cameras, expandedAreas, setExpandedAreas,
  assignedStreams, assignCameraToCell, removeCameraFromCell
}) {
  const gridCells = Array.from({ length: matrixGridSize });

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCameraTreeOpen(!isCameraTreeOpen)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
          >
            <Camera size={14} /> {isCameraTreeOpen ? 'Hide Camera Tree' : 'Show Camera Tree'}
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
            {[1, 4, 9, 16].map(size => (
              <button
                key={size}
                onClick={() => setMatrixGridSize(size)}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                  matrixGridSize === size ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {Math.sqrt(size)}x{Math.sqrt(size)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
        >
          {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[75vh]">
        {isCameraTreeOpen && (
          <div className="lg:col-span-3 bg-[#070b19] border border-slate-800 rounded-3xl p-4 space-y-3 overflow-y-auto shadow-xl">
            <div className="text-xs font-extrabold text-white uppercase border-b border-slate-800 pb-2">
              {activeOrg.name || 'SuryaSANC'} Camera Tree
            </div>

            <div className="space-y-2">
              {cameras.map(cam => (
                <div
                  key={cam.id}
                  onClick={() => assignCameraToCell(cam)}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-2xl hover:border-cyan-500/60 transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{cam.camName}</div>
                    <div className="text-[9px] text-slate-500">{cam.area} &gt; {cam.subArea}</div>
                  </div>
                  <Radio size={14} className="text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`${isCameraTreeOpen ? 'lg:col-span-9' : 'lg:col-span-12'} grid grid-cols-${Math.sqrt(matrixGridSize)} gap-3 h-full`}>
          {gridCells.map((_, idx) => (
            <StreamCell
              key={idx}
              index={idx}
              cam={assignedStreams[idx]}
              selectedCellIndex={selectedCellIndex}
              setSelectedCellIndex={setSelectedCellIndex}
              removeCameraFromCell={removeCameraFromCell}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
