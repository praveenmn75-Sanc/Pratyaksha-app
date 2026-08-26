import React, { useState } from 'react';
import AdminConsole from '../components/AdminConsole';

export default function AdminPage({ activeTab, setActiveTab, handleLogout }) {
  const [successMsg, setSuccessMsg] = useState('');

  return (
    <div className="w-full space-y-4">
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-extrabold rounded-2xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <AdminConsole setSuccessMsg={setSuccessMsg} />
    </div>
  );
}
