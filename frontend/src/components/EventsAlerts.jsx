import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid, BarChart2, RefreshCw, Camera, Eye, Clock, DownloadCloud, 
  Edit3, Save, Search, Filter, ExternalLink, Tag, CheckCircle2,
  ZoomIn, ZoomOut, RotateCcw, Download, Calendar, Activity, TrendingUp, Layers
} from 'lucide-react';

const HOST_IP = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${HOST_IP}:8005/api/v1`;

const APP_CLASS_MAP = {
  'Traffic - ANPR & ATCC': ['Car', 'SUV', 'Bus', 'Truck', 'Auto', 'Bike'],
  'FACE REC': ['Person', 'VIP', 'Blacklisted', 'Authorized Staff', 'Visitor'],
  'WildWatch': ['Elephant', 'Leopard', 'Tiger', 'Wild Boar', 'Deer', 'Gaur'],
  'Perimeter Intrusion': ['Human Crossing', 'Vehicle Intrusion', 'Object Line Cross', 'Loitering'],
  'Fire & Smoke': ['Fire Flame', 'Smoke Plume', 'Thermal Hotspot']
};

export default function EventsAlerts({
  eventsSubTab, setEventsSubTab,
  autoRefreshCountdown, exportCSV,
  selectedAppFilter, setSelectedAppFilter,
  selectedClassFilter, setSelectedClassFilter,
  selectedCamFilter, setSelectedCamFilter,
  cameras = [], activeOrg, filteredEvents = [], setFilteredEvents,
  activeDetailsModal, setActiveDetailsModal,
  setSuccessMsg
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('24h');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editClass, setEditClass] = useState('Car');
  const [editEventData, setEditEventData] = useState('');
  const [editDirection, setEditDirection] = useState('IN');
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchEventsData = () => {
    fetch(`${API_BASE_URL}/events`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && setFilteredEvents) {
          setFilteredEvents(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  const uniqueEvents = useMemo(() => {
    const map = new Map();
    (filteredEvents || []).forEach(ev => {
      if (ev && ev.id && !map.has(ev.id)) {
        map.set(ev.id, ev);
      }
    });
    return Array.from(map.values());
  }, [filteredEvents]);

  const availableClasses = useMemo(() => {
    if (!selectedAppFilter || selectedAppFilter === 'All Applications') {
      return Object.values(APP_CLASS_MAP).flat();
    }
    return APP_CLASS_MAP[selectedAppFilter] || [];
  }, [selectedAppFilter]);

  // Multi-Variable Filter Engine
  const filteredData = useMemo(() => {
    const nowEpoch = Date.now() / 1000;
    let timeframeSeconds = 24 * 3600;

    if (timelineFilter === '7d') timeframeSeconds = 7 * 24 * 3600;
    else if (timelineFilter === '15d') timeframeSeconds = 15 * 24 * 3600;
    else if (timelineFilter === '30d') timeframeSeconds = 30 * 24 * 3600;

    return uniqueEvents.filter(ev => {
      const appName = ev.app || ev.appModule || '';
      const className = ev.class || ev.vehicleType || 'UNKNOWN';
      const camName = ev.cam || ev.camName || '';
      const eventDataStr = ev.data || ev.plateNumber || '';
      const eventIdStr = ev.id || '';
      const eventEpoch = ev.timestamp_epoch || (ev.time ? new Date(ev.time).getTime() / 1000 : nowEpoch);

      const matchSearch = searchQuery === '' || 
        eventDataStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eventIdStr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchApp = (!selectedAppFilter || selectedAppFilter === 'All Applications')
        ? true : appName.toLowerCase().trim() === selectedAppFilter.toLowerCase().trim();

      const matchClass = (!selectedClassFilter || selectedClassFilter === 'All Classes')
        ? true : className.toLowerCase().trim() === selectedClassFilter.toLowerCase().trim();

      const matchCam = (!selectedCamFilter || selectedCamFilter === 'All Cameras')
        ? true : camName.toLowerCase().trim() === selectedCamFilter.toLowerCase().trim();

      const matchTimeline = (nowEpoch - eventEpoch) <= timeframeSeconds;

      return matchSearch && matchApp && matchClass && matchCam && matchTimeline;
    });
  }, [uniqueEvents, searchQuery, selectedAppFilter, selectedClassFilter, selectedCamFilter, timelineFilter]);

  // Dynamic Real Data Analytics Computation
  const analyticsSummary = useMemo(() => {
    const totalCount = filteredData.length;
    const classCounts = {};
    const appCounts = {};
    const camCounts = {};
    const dirCounts = { IN: 0, OUT: 0 };

    filteredData.forEach(ev => {
      const cls = ev.class || ev.vehicleType || 'Unknown';
      const app = ev.app || ev.appModule || 'Traffic - ANPR & ATCC';
      const cam = ev.cam || ev.camName || 'ANPR_TEST_C1';
      const dir = ev.direction || 'IN';

      classCounts[cls] = (classCounts[cls] || 0) + 1;
      appCounts[app] = (appCounts[app] || 0) + 1;
      camCounts[cam] = (camCounts[cam] || 0) + 1;
      dirCounts[dir] = (dirCounts[dir] || 0) + 1;
    });

    return { totalCount, classCounts, appCounts, camCounts, dirCounts };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const openDetailsModal = (ev) => {
    setActiveDetailsModal(ev);
    setEditClass(ev.class || ev.vehicleType || 'Car');
    setEditEventData(ev.data || ev.plateNumber || 'None');
    setEditDirection(ev.direction || 'IN');
    setIsEditingModal(false);
    setZoomLevel(1);
  };

  const handleSaveLocalImage = () => {
    if (!activeDetailsModal) return;
    const imageUrl = activeDetailsModal.snapshotUrl || `http://${HOST_IP}:1984/api/frame.jpeg?src=anpr_test_c1`;
    
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Event_${activeDetailsModal.id || 'capture'}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (setSuccessMsg) setSuccessMsg(`Image saved to local folder for Event #${activeDetailsModal.id}`);
      })
      .catch(() => {
        window.open(imageUrl, '_blank');
      });
  };

  const handleSaveModalEdits = () => {
    if (!activeDetailsModal) return;

    fetch(`${API_BASE_URL}/events/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: activeDetailsModal.id,
        eventClass: editClass,
        eventData: editEventData,
        direction: editDirection
      })
    })
    .then(r => r.json())
    .then(() => {
      const updatedList = (filteredEvents || []).map(e => {
        if (e.id === activeDetailsModal.id) {
          return { ...e, class: editClass, vehicleType: editClass, data: editEventData, plateNumber: editEventData, direction: editDirection };
        }
        return e;
      });

      if (setFilteredEvents) setFilteredEvents(updatedList);
      setActiveDetailsModal(prev => ({ ...prev, class: editClass, vehicleType: editClass, data: editEventData, plateNumber: editEventData, direction: editDirection }));
      setIsEditingModal(false);
      if (setSuccessMsg) setSuccessMsg(`Metadata corrected & saved for Event #${activeDetailsModal.id}`);
    })
    .catch(() => {});
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Navigation Toolbar */}
      <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEventsSubTab('live')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              eventsSubTab === 'live' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400'
            }`}
          >
            <Grid size={16} /> Sub-Module 1: Live Events Grid
          </button>
          <button
            onClick={() => setEventsSubTab('analytics')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              eventsSubTab === 'analytics' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400'
            }`}
          >
            <BarChart2 size={16} /> Sub-Module 2: Event Count Analytics
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchEventsData} 
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw size={14} /> Manual Refresh
          </button>

          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 flex items-center gap-2 font-bold">
            <Clock size={14} className="text-cyan-400" />
            <span>Auto: {autoRefreshCountdown}s</span>
          </div>

          <button onClick={exportCSV} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer">
            <DownloadCloud size={14} className="text-cyan-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-1 min-w-[200px]">
          <Search size={16} className="text-cyan-400" />
          <input
            type="text"
            placeholder="Filter Plate, Class, Camera, or Event ID..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="bg-transparent text-white font-bold outline-none w-full placeholder-slate-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
            <Tag size={14} className="text-amber-400 ml-1" />
            <select
              value={selectedAppFilter || 'All Applications'}
              onChange={e => { 
                setSelectedAppFilter(e.target.value); 
                setSelectedClassFilter('All Classes');
                setCurrentPage(1); 
              }}
              className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer p-1"
            >
              <option value="All Applications">All Applications</option>
              {Object.keys(APP_CLASS_MAP).map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
            <Filter size={14} className="text-cyan-400 ml-1" />
            <select
              value={selectedClassFilter || 'All Classes'}
              onChange={e => { setSelectedClassFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer p-1"
            >
              <option value="All Classes">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
            <Camera size={14} className="text-emerald-400 ml-1" />
            <select
              value={selectedCamFilter || 'All Cameras'}
              onChange={e => { setSelectedCamFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-emerald-300 font-bold outline-none cursor-pointer p-1"
            >
              <option value="All Cameras">All Cameras</option>
              {cameras.map(c => (
                <option key={c.id} value={c.camName}>{c.camName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
            <Calendar size={14} className="text-amber-400 ml-1" />
            <select
              value={timelineFilter}
              onChange={e => { setTimelineFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer p-1"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="15d">Last 15 Days</option>
              <option value="30d">Last 1 Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* SUB-MODULE 1: LIVE EVENTS GRID */}
      {eventsSubTab === 'live' && (
        <div className="space-y-4">
          {paginatedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedEvents.map((ev) => {
                const frameSnapshotUrl = ev.snapshotUrl || `http://${HOST_IP}:1984/api/frame.jpeg?src=anpr_test_c1`;
                const eventId = ev.id;
                const camDisplayName = ev.cam || ev.camName || 'ANPR_TEST_C1';
                const appDisplayName = ev.app || ev.appModule || 'Traffic - ANPR & ATCC';
                const classDisplayName = ev.class || ev.vehicleType || 'Car';
                const dataDisplayName = ev.data || ev.plateNumber || 'None';
                const timeDisplayName = ev.time || ev.timestamp || '2026-08-19 IST';
                const directionTag = ev.direction || 'IN';

                return (
                  <div
                    key={eventId}
                    className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-cyan-500/50 transition cursor-pointer shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <Camera size={14} className="text-cyan-400" /> {camDisplayName}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          directionTag === 'IN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {directionTag}
                        </span>
                      </div>
                    </div>

                    <div 
                      onClick={() => openDetailsModal(ev)}
                      className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-pointer"
                    >
                      <img src={frameSnapshotUrl} alt="Real Live Capture" className="w-full h-full object-cover" />
                      {ev.bbox && (
                        <div
                          style={{ top: ev.bbox.top, left: ev.bbox.left, width: ev.bbox.width, height: ev.bbox.height }}
                          className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded flex items-start p-0.5 pointer-events-none"
                        >
                          <span className="bg-emerald-500 text-slate-950 font-extrabold text-[8px] px-1 rounded uppercase">{classDisplayName}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>ID: <strong className="text-slate-300 font-bold">{eventId}</strong></span>
                        <span className="text-amber-400 font-bold">{classDisplayName}</span>
                      </div>
                      <div className="text-xs font-bold text-cyan-300 truncate">{dataDisplayName}</div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={12} /> {timeDisplayName}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailsModal(ev); }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 font-bold rounded-lg text-[10px] transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-[#070b19] border border-slate-800 rounded-2xl font-mono">
              No matching events found for the selected filters.
            </div>
          )}

          <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="text-[11px] text-slate-400">
              Showing <strong className="text-white">{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to <strong className="text-white">{Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> of <strong className="text-white">{filteredData.length}</strong> events
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-40 cursor-pointer font-bold"
              >
                &lt; Prev
              </button>
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-40 cursor-pointer font-bold"
              >
                Next &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 2: LIVE REAL-DATA EVENT COUNT ANALYTICS */}
      {eventsSubTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#070b19] border border-slate-800 p-5 rounded-2xl space-y-1 shadow-xl">
              <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-400" /> Total Filtered Events
              </div>
              <div className="text-2xl font-extrabold text-amber-400">{analyticsSummary.totalCount}</div>
            </div>

            <div className="bg-[#070b19] border border-slate-800 p-5 rounded-2xl space-y-1 shadow-xl">
              <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-400" /> Dynamic Vector IN
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">{analyticsSummary.dirCounts.IN || 0}</div>
            </div>

            <div className="bg-[#070b19] border border-slate-800 p-5 rounded-2xl space-y-1 shadow-xl">
              <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <TrendingUp size={14} className="text-cyan-400" /> Dynamic Vector OUT
              </div>
              <div className="text-2xl font-extrabold text-cyan-400">{analyticsSummary.dirCounts.OUT || 0}</div>
            </div>

            <div className="bg-[#070b19] border border-slate-800 p-5 rounded-2xl space-y-1 shadow-xl">
              <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <Layers size={14} className="text-amber-400" /> Active Camera Nodes
              </div>
              <div className="text-2xl font-extrabold text-white">{Object.keys(analyticsSummary.camCounts).length}</div>
            </div>
          </div>

          {/* Breakdown Bars by Class & Camera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Event Counts by Target Class */}
            <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Real Event Distribution by Class</span>
                <span className="text-amber-400 text-[10px]">{Object.keys(analyticsSummary.classCounts).length} Classes Tracked</span>
              </div>

              <div className="space-y-3">
                {Object.entries(analyticsSummary.classCounts).map(([cls, cnt]) => {
                  const pct = analyticsSummary.totalCount > 0 ? (cnt / analyticsSummary.totalCount) * 100 : 0;
                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white">{cls}</span>
                        <span className="text-cyan-400">{cnt} events ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                        <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}

                {Object.keys(analyticsSummary.classCounts).length === 0 && (
                  <div className="text-slate-500 text-center py-6">No real class metrics available.</div>
                )}
              </div>
            </div>

            {/* Event Counts by Camera Node */}
            <div className="bg-[#070b19] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Real Event Counts by Camera Node</span>
                <span className="text-cyan-400 text-[10px]">{Object.keys(analyticsSummary.camCounts).length} Cameras Active</span>
              </div>

              <div className="space-y-3">
                {Object.entries(analyticsSummary.camCounts).map(([cam, cnt]) => {
                  const pct = analyticsSummary.totalCount > 0 ? (cnt / analyticsSummary.totalCount) * 100 : 0;
                  return (
                    <div key={cam} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-amber-400 flex items-center gap-1.5"><Camera size={14} /> {cam}</span>
                        <span className="text-emerald-400">{cnt} events ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}

                {Object.keys(analyticsSummary.camCounts).length === 0 && (
                  <div className="text-slate-500 text-center py-6">No real camera metrics available.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* INSPECTION DETAILS MODAL */}
      {activeDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 max-w-5xl w-full space-y-4 shadow-2xl relative font-mono text-xs max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Tag size={16} className="text-cyan-400" />
                {activeDetailsModal.app || activeDetailsModal.appModule || 'Traffic - ANPR'} Event Details
              </span>
              <button onClick={() => setActiveDetailsModal(null)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-[10px]">
                    Captured Frame Snapshot
                  </span>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setZoomLevel(z => Math.max(1, z - 0.4))}
                      className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-cyan-400 font-bold text-[10px]">{Math.round(zoomLevel * 100)}%</span>
                    <button 
                      onClick={() => setZoomLevel(z => Math.min(3.5, z + 0.4))}
                      className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button 
                      onClick={() => setZoomLevel(1)}
                      className="p-1.5 bg-slate-900 border border-slate-800 text-amber-400 rounded-lg cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <div 
                    className="w-full h-full transition-transform duration-200 origin-center cursor-grab"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img 
                      src={activeDetailsModal.snapshotUrl || `http://${HOST_IP}:1984/api/frame.jpeg?src=anpr_test_c1`} 
                      alt="Captured Snapshot" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
                  <div className="w-24 h-24 bg-slate-900 border border-cyan-500/40 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                    <img 
                      src={activeDetailsModal.cropUrl || activeDetailsModal.snapshotUrl || `http://${HOST_IP}:1984/api/frame.jpeg?src=anpr_test_c1`} 
                      alt="Cropped Target" 
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-1 right-1 bg-cyan-500 text-slate-950 font-extrabold text-[7px] px-1 rounded">CROPPED TARGET</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Localized Evidence Target</div>
                    <div className="text-xs font-bold text-amber-400">Event_Class: {activeDetailsModal.class || activeDetailsModal.vehicleType || 'Car'}</div>
                    <div className="text-xs font-bold text-cyan-300">Event_Data (OCR): {activeDetailsModal.data || activeDetailsModal.plateNumber || 'None'}</div>
                    <div className="text-[10px] text-emerald-400 font-bold">Direction: {activeDetailsModal.direction || 'IN'}</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={handleSaveLocalImage}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl border border-amber-400 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Download size={14} /> Save Image to Local
                  </button>

                  <button 
                    onClick={() => setIsEditingModal(!isEditingModal)} 
                    className="px-3 py-1.5 bg-slate-900 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Edit3 size={14} /> {isEditingModal ? 'Cancel Edit' : 'Edit Metadata'}
                  </button>
                </div>

                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">General Information</div>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-500">Event_ID</span>
                      <span className="font-bold text-amber-400">{activeDetailsModal.id}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-500">Event_Direction</span>
                      {isEditingModal ? (
                        <select 
                          value={editDirection} 
                          onChange={e => setEditDirection(e.target.value)} 
                          className="bg-slate-900 border border-cyan-500 rounded p-1 text-emerald-400 font-bold outline-none"
                        >
                          <option value="IN">IN</option>
                          <option value="OUT">OUT</option>
                        </select>
                      ) : (
                        <span className="font-extrabold text-emerald-400 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded">
                          {activeDetailsModal.direction || 'IN'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-500 font-bold">Event_Class</span>
                      {isEditingModal ? (
                        <select
                          value={editClass} 
                          onChange={e => setEditClass(e.target.value)} 
                          className="p-2 bg-slate-900 border border-cyan-500 rounded-lg text-amber-400 font-bold outline-none" 
                        >
                          {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-bold text-amber-400">{activeDetailsModal.class || activeDetailsModal.vehicleType}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-500 font-bold">Event_Data (OCR)</span>
                      {isEditingModal ? (
                        <input 
                          type="text" 
                          value={editEventData} 
                          onChange={e => setEditEventData(e.target.value)} 
                          className="p-2 bg-slate-900 border border-cyan-500 rounded-lg text-white font-bold outline-none" 
                        />
                      ) : (
                        <span className="font-bold text-white">{activeDetailsModal.data || activeDetailsModal.plateNumber}</span>
                      )}
                    </div>

                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-500">Event_DateTime</span>
                      <span className="font-bold text-white">{activeDetailsModal.time || activeDetailsModal.timestamp}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-500">Device_Name</span>
                      <span className="font-bold text-cyan-400">{activeDetailsModal.cam || activeDetailsModal.camName || 'ANPR_TEST_C1'}</span>
                    </div>

                    <div className="flex justify-between pb-1.5">
                      <span className="text-slate-500">Notification Status</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {activeDetailsModal.syncStatus || 'Sent to Cloud'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditingModal ? (
                  <button onClick={handleSaveModalEdits} className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20">
                    <Save size={16} /> Save Corrected Metadata
                  </button>
                ) : (
                  <button onClick={() => setActiveDetailsModal(null)} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl uppercase cursor-pointer">
                    Close Inspection Window
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
