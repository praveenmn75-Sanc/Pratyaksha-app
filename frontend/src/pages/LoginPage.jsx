import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Fingerprint, Cpu } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Temporary bypass directly to the Admin Console
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#050814] flex relative overflow-hidden font-sans">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Left Side - Branding & Description */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 relative z-10 border-r border-slate-800/60 bg-[#03050c]/50 backdrop-blur-sm">
        <img src="/pratyaksha_logo.png" alt="Pratyaksha Logo" className="w-80 mb-8 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
        
        <h1 className="text-3xl font-extrabold text-white tracking-wide mb-4">
          Enterprise AI Surveillance <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Platform by SuryaSANC</span>
        </h1>
        
        <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-10">
          Advanced threat detection, edge AI analytics, and distributed hardware management. Synchronize your perimeter intrusion detection and facial biometrics in real-time.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><ShieldAlert size={20} /></div>
            Military-Grade Access Control
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400"><Cpu size={20} /></div>
            AI Edge Node Synchronization
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Fingerprint size={20} /></div>
            Encrypted SSO Biometrics
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <div className="w-full max-w-md bg-[#0a0f25]/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            {/* Mobile Logo Fallback */}
            <img src="/pratyaksha-icon.png" alt="Icon" className="w-16 h-16 mx-auto mb-4 lg:hidden" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Secure Login</h2>
            <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-widest">Authentication Gateway</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">SSO Email / Mobile</label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition placeholder-slate-600"
                placeholder="pratyaksha@suryasanc.in"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex justify-between">
                <span>Password</span>
                <a href="#" className="text-cyan-500 hover:text-cyan-400">Forgot?</a>
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white outline-none transition placeholder-slate-600"
                placeholder="••••••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl px-4 py-3.5 mt-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition transform hover:-translate-y-0.5"
            >
              Authenticate & Enter
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
            <p className="text-[10px] text-slate-500 font-mono">
              UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED.<br/>
              IP LOGGED: {new Date().toISOString().replace('T', ' ').substring(0, 19)}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
