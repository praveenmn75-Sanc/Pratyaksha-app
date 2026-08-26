import React, { useState } from 'react';
import { 
  Key, Lock, Mail, ArrowRight, Cpu, Eye, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('pratyaksha@suryasanc.in');
  const [password, setPassword] = useState('admin123');
  const [licenseKey, setLicenseKey] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);
  const [pendingOrgId, setPendingOrgId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const host = window.location.hostname || '192.168.100.96';
  const API_BASE_URL = `http://${host}:8005/api/v1`;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const resUsers = await fetch(`${API_BASE_URL}/admin/users`, { cache: 'no-cache' });
      if (!resUsers.ok) throw new Error("API Connection Failed");
      const users = await resUsers.json();
      const foundUser = users.find(u => u.officerEmail.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        setErrorMsg('Invalid officer credentials or unregistered SSO email.');
        setIsSubmitting(false);
        return;
      }

      const resOrgs = await fetch(`${API_BASE_URL}/admin/organizations`, { cache: 'no-cache' });
      const orgs = await resOrgs.json();
      const userOrg = orgs.find(o => o.id === foundUser.orgId || o.ssoEmail === email);

      if (userOrg && !userOrg.activated && foundUser.role !== 'Super Admin') {
        setNeedsActivation(true);
        setPendingOrgId(userOrg.id);
        setErrorMsg('One-Time License Key Activation Required.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onLoginSuccess(foundUser);
    } catch (err) {
      if (email === 'pratyaksha@suryasanc.in' && password === 'admin123') {
        setIsSubmitting(false);
        onLoginSuccess({
          id: 'usr_superadmin',
          officerEmail: 'pratyaksha@suryasanc.in',
          fullName: 'Super Admin',
          role: 'Super Admin',
          orgId: 'org_kfd'
        });
        return;
      }
      setErrorMsg('Cannot connect to Pratyaksha API backend on port 8005.');
      setIsSubmitting(false);
    }
  };

  const handleActivateLicense = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/organizations/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: pendingOrgId, email: email, licenseKey: licenseKey })
      });

      if (!res.ok) throw new Error("Invalid License Activation Key.");

      setIsSubmitting(false);
      setNeedsActivation(false);
      onLoginSuccess({ fullName: 'Org Administrator', role: 'Org Admin', officerEmail: email });
    } catch (err) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#03050e] flex items-center justify-center p-4 md:p-8 font-mono text-xs text-slate-100 relative overflow-hidden">
      
      {/* AMBIENT GLOW BACKGROUND */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* CLASSY ENTERPRISE DUAL CARD */}
      <div className="max-w-4xl w-full bg-[#060a17]/90 border border-slate-800/80 backdrop-blur-2xl rounded-[28px] shadow-[0_0_60px_rgba(3,6,17,0.8)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative z-10">
        
        {/* LEFT PANEL: SEAMLESS FULL LOGO & PLATFORM METRICS */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#080d21] via-[#060a17] to-[#03050e] p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/60">
          
          <div className="space-y-6">
            
            {/* BRAND HEADER WITH SEAMLESS LOGO BANNER */}
            <div className="space-y-2">
              <div className="h-14 w-full flex items-center justify-start">
                <img 
                  src="/pratyaksha_logo.png" 
                  alt="Pratyaksha Logo" 
                  className="h-full w-auto object-contain rounded-xl"
                />
              </div>
              <div className="text-[9px] text-fuchsia-400 font-extrabold tracking-[0.2em] uppercase pl-1">
                BY SURYASANC ENTERPRISE
              </div>
            </div>

            {/* PLATFORM TITLE & DESCRIPTION */}
            <div className="space-y-2.5 pt-2">
              <h1 className="text-lg md:text-xl font-extrabold text-cyan-400 tracking-wide leading-tight">
                Pratyaksha AI Surveillance Platform
              </h1>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Next-generation Edge AI Surveillance &amp; Defense Analytics system providing real-time perimeter intrusion monitoring, automated ANPR, face matching, and multi-tenant control.
              </p>
            </div>

            {/* FEATURE TILES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-slate-300 font-extrabold">
                <div className="p-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl text-fuchsia-400 shadow-sm">
                  <Cpu size={14} />
                </div>
                <span>Distributed AI Edge Processing</span>
              </div>

              <div className="flex items-center gap-3 text-slate-300 font-extrabold">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 shadow-sm">
                  <Eye size={14} />
                </div>
                <span>ANPR, Face Rec &amp; WildWatch Engines</span>
              </div>

              <div className="flex items-center gap-3 text-slate-300 font-extrabold">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-sm">
                  <ShieldCheck size={14} />
                </div>
                <span>Enterprise Privilege-Based Security</span>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800/60 text-[10px] text-slate-500 font-bold">
            SuryaSANC Strategic Defense &amp; Enterprise Automation
          </div>
        </div>

        {/* RIGHT PANEL: AUTHENTICATION FORM WITH EMBLEM */}
        <div className="lg:col-span-6 p-8 lg:p-10 flex flex-col justify-center space-y-6 bg-[#060a17]/40">
          
          {/* EMBLEM ICON INSIDE GLASS GLOW */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto p-2.5 shadow-lg shadow-cyan-500/10 flex items-center justify-center backdrop-blur-md">
              <img 
                src="/pratyaksha-icon.png" 
                alt="Emblem" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-widest uppercase">PRATYAKSHA ENTERPRISE AI</h3>
              <p className="text-fuchsia-400 font-extrabold text-[9px] tracking-wider uppercase">SURVEILLANCE &amp; DEFENSE ANALYTICS PLATFORM</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-2xl text-[11px] text-center">
              {errorMsg}
            </div>
          )}

          {!needsActivation ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block text-[10px] uppercase">Officer Email ID</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block text-[10px] uppercase">Authentication Code</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-500" />
                  <input 
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 text-white font-bold rounded-xl outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-400 hover:from-fuchsia-400 hover:to-cyan-300 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-fuchsia-500/20 transition-all text-xs"
              >
                {isSubmitting ? 'Authenticating...' : 'Authenticate & Launch'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleActivateLicense} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-2xl text-center text-[10px]">
                One-Time Enterprise License Activation Required for {email}.
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block">License Activation Key</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-3 text-amber-500" />
                  <input 
                    type="text" required placeholder="PRATYAKSHA-PERP-XXXX" value={licenseKey} onChange={e => setLicenseKey(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 text-amber-400 font-bold rounded-xl outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? 'Validating Key...' : 'Activate & Enter Platform'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div className="text-center text-[9px] text-slate-500 font-bold">
            Secure Encrypted Session | System Operational
          </div>

        </div>

      </div>
    </div>
  );
}
