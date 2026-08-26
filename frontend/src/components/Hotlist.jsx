import React, { useState, useEffect } from 'react';
import { Flame, Plus, Trash2, Search, AlertTriangle, ShieldCheck } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname || 'localhost'}:8005/api/v1`;

export default function Hotlist({ setSuccessMsg }) {
  const [watchlist, setWatchlist] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [category, setCategory] = useState('Stolen / Wanted');
  const [severity, setSeverity] = useState('CRITICAL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWatchlist = () => {
    fetch(`${API_BASE_URL}/hotlist`)
      .then(r => r.json())
      .then(data => setWatchlist(Array.isArray(data) ? data : []))
      .catch(() => setWatchlist([]));
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddHotlist = (e) => {
    e.preventDefault();
    if (!plateNumber) {
      alert("Please enter a vehicle license plate or identifier.");
      return;
    }

    const payload = {
      id: `hl_${Date.now()}`,
      plateNumber,
      vehicleModel: vehicleModel || 'Unspecified Vehicle',
      category,
      severity,
      addedBy: 'Super Admin',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    fetch(`${API_BASE_URL}/hotlist/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(res => {
        if (setSuccessMsg) setSuccessMsg(res.message || "Target added to Hotlist!");
        setPlateNumber('');
        setVehicleModel('');
        fetchWatchlist();
      });
  };

  const handleDelete = (id) => {
    fetch(`${API_BASE_URL}/hotlist/delete/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => fetchWatchlist());
  };

  const filteredList = watchlist.filter(item => 
    !searchQuery || 
    (item.plateNumber && item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* HEADER */}
      <div className="bg-[#070b19] border border-slate-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
            <Flame size={28} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wider uppercase">Hotlist &amp; Target Watchlist</h1>
            <p className="text-slate-400">Blacklisted License Plates, Flagged Vehicles &amp; Automated Alert Triggers</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-extrabold rounded-xl text-[10px] uppercase">
          {watchlist.length} Active Targets
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ADD HOTLIST FORM */}
        <div className="lg:col-span-4 bg-[#070b19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus size={16} className="text-red-400" /> Register Hotlist Target
            </h2>
          </div>

          <form onSubmit={handleAddHotlist} className="space-y-3 pt-2">
            <div>
              <label className="text-slate-400 font-bold block pb-1">License Plate Number</label>
              <input 
                type="text" 
                value={plateNumber} 
                onChange={e => setPlateNumber(e.target.value)}
                placeholder="e.g. KL 13 AY 4500" 
                className="w-full p-2.5 bg-slate-900 border border-slate-800 text-white font-extrabold rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block pb-1">Vehicle Description / Model</label>
              <input 
                type="text" 
                value={vehicleModel} 
                onChange={e => setVehicleModel(e.target.value)}
                placeholder="e.g. White Mahindra Bolero" 
                className="w-full p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block pb-1">Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none"
                >
                  <option value="Stolen / Wanted">Stolen / Wanted</option>
                  <option value="Wildwatch Intruder">Wildwatch Intruder</option>
                  <option value="VIP Watch">VIP Watch</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block pb-1">Alert Severity</label>
                <select 
                  value={severity} 
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 text-red-400 font-bold rounded-xl outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer pt-3"
            >
              <Flame size={16} /> Add Target to Hotlist
            </button>
          </form>
        </div>

        {/* WATCHLIST TABLE */}
        <div className="lg:col-span-8 bg-[#070b19] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" /> Registered Watchlist Database
            </h2>
            <div className="w-64">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Plate or Category..."
                className="w-full p-2 bg-slate-900 border border-slate-800 text-white rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="p-3">Plate / Target</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-500 italic">No hotlist targets registered.</td>
                  </tr>
                ) : (
                  filteredList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 font-extrabold text-red-400">{item.plateNumber}</td>
                      <td className="p-3 text-slate-300">{item.vehicleModel}</td>
                      <td className="p-3 text-amber-400 font-bold">{item.category}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
                          {item.severity}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
