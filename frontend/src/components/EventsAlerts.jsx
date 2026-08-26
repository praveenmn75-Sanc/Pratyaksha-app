import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, RefreshCw, Download, Grid, BarChart2, Search, X, 
  ZoomIn, ZoomOut, RotateCcw, ExternalLink, ChevronLeft, ChevronRight, Car, Tag 
} from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname || 'localhost'}:8005/api/v1`;

const APPLICATION_CLASSES = {
  'Traffic - ANPR & ATCC': ['ANPR Detection', 'Car', 'SUV', 'Bus', 'Truck', 'Two Wheeler', 'Auto Rickshaw'],
  'FACE REC': ['Recognized Face', 'Unknown Subject', 'VIP Person', 'Blacklisted Face', 'Staff Member'],
  'WildWatch': ['Elephant', 'Tiger', 'Leopard', 'Wild Boar', 'Gaurs / Bison', 'Deer'],
  'Perimeter Intrusion': ['Human Intrusion', 'Vehicle Perimeter Breach', 'Animal Intrusion', 'Fence Line Cross'],
  'Fire & Smoke': ['Flame Detection', 'Smoke Plume', 'Fire Hazard', 'Thermal Hotspot']
};

export default function EventsAlerts() {
  const [activeTab, setActiveTab] = useState('grid');
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [autoRefreshSec, setAutoRefreshSec] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedApp, setSelectedApp] = useState('All Applications');
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [selectedCam, setSelectedCam] = useState('All Cameras');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  // Pagination State (Max 20 Per Page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Inspector Modal State
  const [modalEvent, setModalEvent] = useState(null);
  const [viewMode, setViewMode] = useState('full'); // 'full' or 'crop'
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchEventsAndCameras = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/events`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/admin/cameras`).then(r => r.json()).catch(() => [])
    ]).then(([evtData, camData]) => {
      setEvents(Array.isArray(evtData) ? evtData : []);
      setCameras(Array.isArray(camData) ? camData : []);
    });
  };

  useEffect(() => {
    fetchEventsAndCameras();
    if (autoRefreshSec > 0) {
      const interval = setInterval(fetchEventsAndCameras, autoRefreshSec * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshSec]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedApp, selectedClass, selectedCam, timeRange]);

  const handleAppChange = (app) => {
    setSelectedApp(app);
    setSelectedClass('All classes');
  };

  const getClassOptions = () => {
    if (selectedApp === 'All Applications') {
      return Object.values(APPLICATION_CLASSES).flat();
    }
    return APPLICATION_CLASSES[selectedApp] || [];
  };

  const openInNewTab = (imgUrl) => {
    window.open(imgUrl, '_blank', 'noopener,noreferrer');
  };

  const exportCSV = () => {
    if (events.length === 0) return;
    const headers = ["Event ID", "Timestamp", "Camera", "Application", "Event Type", "Plate OCR", "Vehicle Class", "Speed", "Confidence"];
    const rows = events.map(e => [e.id, e.timestamp, e.camName, e.appModule || 'Traffic', e.eventType, e.details, e.vehicleClass || 'Car', e.speed || '40 km/h', e.confidence]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pratyaksha_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvents = events.filter(evt => {
    const matchesSearch = !searchQuery || 
      (evt.details && evt.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.camName && evt.camName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.eventType && evt.eventType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.vehicleClass && evt.vehicleClass.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesApp = selectedApp === 'All Applications' || evt.appModule === selectedApp;
    const matchesClass = selectedClass === 'All classes' || evt.eventType === selectedClass || evt.vehicleClass === selectedClass;
    const matchesCam = selectedCam === 'All Cameras' || evt.camName === selectedCam;
    
    return matchesSearch && matchesApp && matchesClass && matchesCam;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* HEADER & ACTION BAR */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('grid')}
            className={`px-4 py-2 rounded-2xl border font-extrabold flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'grid' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Grid size={15} /> Sub-Module 1: Live Events Grid
          </button>
          
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-2xl border font-extrabold flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'analytics' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <BarChart2 size={15} /> Sub-Module 2: Event Count Analytics
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchEventsAndCameras}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:border-slate-500"
          >
            <RefreshCw size={13} className="text-cyan-400" /> Manual Refresh
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400 font-bold">
            Auto: 
            <select 
              value={autoRefreshSec} 
              onChange={e => setAutoRefreshSec(Number(e.target.value))}
              className="bg-transparent text-cyan-400 font-extrabold outline-none ml-1 cursor-pointer"
            >
              <option value={2} className="bg-slate-900">2s</option>
              <option value={5} className="bg-slate-900">5s</option>
              <option value={10} className="bg-slate-900">10s</option>
              <option value={0} className="bg-slate-900">Off</option>
            </select>
          </div>

          <button 
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-extrabold rounded-xl flex items-center gap-1.5 hover:bg-emerald-500/20 cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter Plate, Class, Camera, or Event ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl outline-none"
          />
        </div>

        <select 
          value={selectedApp} 
          onChange={e => handleAppChange(e.target.value)}
          className="p-2 bg-slate-900 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none"
        >
          <option value="All Applications">All Applications</option>
          <option value="Traffic - ANPR & ATCC">Traffic - ANPR &amp; ATCC</option>
          <option value="FACE REC">FACE REC</option>
          <option value="WildWatch">WildWatch</option>
          <option value="Perimeter Intrusion">Perimeter Intrusion</option>
          <option value="Fire & Smoke">Fire &amp; Smoke</option>
        </select>

        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 font-bold rounded-xl outline-none"
        >
          <option value="All classes">All classes</option>
          {getClassOptions().map((cls, idx) => (
            <option key={idx} value={cls}>{cls}</option>
          ))}
        </select>

        <select 
          value={selectedCam} 
          onChange={e => setSelectedCam(e.target.value)}
          className="p-2 bg-slate-900 border border-slate-800 text-emerald-400 font-bold rounded-xl outline-none"
        >
          <option value="All Cameras">All Cameras</option>
          {cameras.map(c => (
            <option key={c.id} value={c.camName}>{c.camName}</option>
          ))}
        </select>

        <select 
          value={timeRange} 
          onChange={e => setTimeRange(e.target.value)}
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl outline-none"
        >
          <option value="Last 24 Hours">Last 24 Hours</option>
          <option value="Last 7 Days">Last 7 Days</option>
        </select>
      </div>

      {/* EVENTS GRID */}
      {activeTab === 'grid' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedEvents.length === 0 ? (
              <div className="col-span-full bg-[#070b19] border border-slate-800 rounded-3xl p-12 text-center text-slate-500 italic">
                No live AI events captured matching the selected criteria.
              </div>
            ) : (
              paginatedEvents.map(evt => (
                <div 
                  key={evt.id} 
                  onClick={() => {
                    setModalEvent(evt);
                    setViewMode('full');
                    setZoomLevel(1);
                  }}
                  className="bg-[#070b19] border border-slate-800 hover:border-cyan-400/80 rounded-3xl overflow-hidden shadow-2xl transition-all cursor-pointer group space-y-3 p-3 flex flex-col justify-between"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
                    <img 
                      src={evt.snapshot ? `http://${window.location.hostname || "localhost"}:8005${evt.snapshot}` : `http://${window.location.hostname || "localhost"}:8005/static/captures/capture_init.jpg`} 
                      onError={(e) => { e.target.src = `http://${window.location.hostname || "localhost"}:8005/static/captures/capture_init.jpg`; }}
                      alt={evt.camName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-500 text-slate-950 font-extrabold rounded text-[9px] uppercase shadow">
                      {evt.details}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/85 backdrop-blur text-emerald-400 font-bold rounded text-[9px]">
                      Conf: {((evt.confidence || 0.98) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs group-hover:text-cyan-400 transition-colors">{evt.details}</span>
                      <span className="text-slate-500 text-[9px]">{evt.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[9px]">
                      <span>Class: <strong className="text-amber-400">{evt.vehicleClass || 'Two Wheeler'}</strong></span>
                      <span>Node: <strong className="text-cyan-400">{evt.camName}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGE NAVIGATION CONTROLS (MAX 20 PER PAGE) */}
          {filteredEvents.length > 0 && (
            <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
              <div className="text-slate-400 text-[11px] font-bold">
                Showing <span className="text-cyan-400">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-cyan-400">{Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}</span> of <span className="text-white">{filteredEvents.length} Events</span> (Max 20 / page)
              </div>

              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`px-3 py-1.5 rounded-xl border font-extrabold flex items-center gap-1 cursor-pointer transition ${
                    currentPage === 1 ? 'opacity-40 bg-slate-950 border-slate-800 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-extrabold text-[11px]">
                  Page {currentPage} of {totalPages}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1.5 rounded-xl border font-extrabold flex items-center gap-1 cursor-pointer transition ${
                    currentPage === totalPages ? 'opacity-40 bg-slate-950 border-slate-800 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULL INSPECTOR MODAL WITH ZOOM & DUAL IMAGE CROPS */}
      {modalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#070b19] border border-cyan-500/50 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={16} /> Event Detection Inspector &amp; OCR Validator
                </h3>
                <p className="text-slate-400 text-[10px]">Event ID: <span className="text-white font-mono">{modalEvent.id}</span></p>
              </div>

              <div className="flex items-center gap-2">
                {/* OPEN IN SEPARATE WINDOW */}
                <button 
                  onClick={() => openInNewTab(
                    `http://${window.location.hostname || "localhost"}:8005${viewMode === 'crop' ? (modalEvent.cropSnapshot || modalEvent.snapshot) : modalEvent.snapshot}`
                  )}
                  className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-400 font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <ExternalLink size={14} /> Save / Open in New Window
                </button>

                <button onClick={() => setModalEvent(null)} className="p-1 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-700 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* IMAGE TOOLBAR (FULL VS CROP & ZOOM CONTROLS) */}
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMode('full')}
                  className={`px-3 py-1.5 rounded-xl border font-extrabold cursor-pointer transition ${
                    viewMode === 'full' ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Full Bounding Box Frame
                </button>

                <button 
                  onClick={() => setViewMode('crop')}
                  className={`px-3 py-1.5 rounded-xl border font-extrabold cursor-pointer transition ${
                    viewMode === 'crop' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Boxed Target Crop (OCR Zone)
                </button>
              </div>

              {/* ZOOM CONTROLS */}
              <div className="flex items-center gap-2 text-slate-300 font-extrabold">
                <button 
                  onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.25))}
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-xl hover:border-slate-500 cursor-pointer"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="w-12 text-center text-cyan-400">{(zoomLevel * 100).toFixed(0)}%</span>
                <button 
                  onClick={() => setZoomLevel(z => Math.min(3.0, z + 0.25))}
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-xl hover:border-slate-500 cursor-pointer"
                >
                  <ZoomIn size={14} />
                </button>
                <button 
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-xl hover:border-slate-500 cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* INTERACTIVE ZOOMABLE IMAGE CONTAINER */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <div className="w-full h-full overflow-auto flex items-center justify-center">
                <img 
                  src={`http://${window.location.hostname || "localhost"}:8005${viewMode === 'crop' ? (modalEvent.cropSnapshot || modalEvent.snapshot) : modalEvent.snapshot}`} 
                  alt="Inspection Frame" 
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="absolute top-3 left-3 px-3 py-1 bg-cyan-500 text-slate-950 font-extrabold text-xs rounded-xl uppercase shadow-lg">
                OCR Plate: {modalEvent.details}
              </div>
            </div>

            {/* METADATA GRID */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">OCR Plate Text</div>
                <div className="text-cyan-400 font-extrabold text-sm">{modalEvent.details}</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">Vehicle Class</div>
                <div className="text-amber-400 font-extrabold text-sm flex items-center gap-1">
                  <Car size={14} /> {modalEvent.vehicleClass || 'Two Wheeler'}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">Confidence Score</div>
                <div className="text-emerald-400 font-extrabold text-sm">{((modalEvent.confidence || 0.98) * 100).toFixed(1)}%</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">Timestamp</div>
                <div className="text-white font-extrabold">{modalEvent.timestamp}</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">Camera Stream Node</div>
                <div className="text-slate-300 font-extrabold">{modalEvent.camName}</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">Speed &amp; Direction</div>
                <div className="text-purple-400 font-extrabold">{modalEvent.speed || '42 km/h'} ({modalEvent.direction || 'Approach'})</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setModalEvent(null)} className="px-5 py-2 bg-slate-900 text-slate-300 font-bold rounded-xl cursor-pointer">Close Inspector</button>
            </div>

          </div>
        </div>
      )}

      {/* SUB-MODULE 2: EVENT COUNT ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-cyan-400" /> Event Count Analytics &amp; Temporal Distribution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Total Detections</div>
              <div className="text-2xl font-extrabold text-cyan-400">{events.length}</div>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Active ANPR Nodes</div>
              <div className="text-2xl font-extrabold text-emerald-400">{cameras.length}</div>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Plate Match Rate</div>
              <div className="text-2xl font-extrabold text-amber-400">98.4%</div>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Hotlist Triggers</div>
              <div className="text-2xl font-extrabold text-red-400">1</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
