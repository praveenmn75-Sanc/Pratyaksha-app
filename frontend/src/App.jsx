import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import { Lock, ArrowRight, Eye, ShieldCheck, Cpu } from 'lucide-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read session token explicitly
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pratyaksha_user_email');
    return (saved && saved.trim() !== '') ? saved : null;
  });

  const login = (email) => {
    localStorage.setItem('pratyaksha_user_email', email);
    setUser(email);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Strict Route Guard Component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Strict check: If user state is empty or invalid, redirect immediately to /login
  if (!user || typeof user !== 'string' || user.trim() === '') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  
  const [email, setEmail] = useState('pratyaksha@suryasanc.in');
  const [password, setPassword] = useState('••••••••••••');

  const fromPath = location.state?.from?.pathname || '/admin/command-center';

  useEffect(() => {
    if (user && user.trim() !== '') {
      navigate(fromPath, { replace: true });
    }
  }, [user, navigate, fromPath]);

  const handleLogin = (e) => {
    e.preventDefault();
    login(email);
    navigate(fromPath, { replace: true });
  };

  return (
    <div className="h-screen w-screen bg-[#050814] flex items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="absolute w-[700px] h-[700px] bg-gradient-to-tr from-pink-600/20 via-fuchsia-500/10 to-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-[#070b19] border border-pink-500/30 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.15)] overflow-hidden relative z-10">
        <div className="md:col-span-5 bg-gradient-to-b from-slate-950 via-[#0b081a] to-slate-950 p-8 flex flex-col justify-between border-r border-slate-800/80 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src="/pratyaksha-icon.png" alt="Pratyaksha Logo" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(236,72,153,0.6)] object-contain" />
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wider">PRATYAKSHA</h2>
                <p className="text-[9px] text-pink-400 font-bold uppercase tracking-widest">By SuryaSANC</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-cyan-300 leading-snug">
                Pratyaksha AI Surveillance Platform
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Next-generation Edge AI Surveillance & Defense Analytics system providing real-time perimeter intrusion monitoring, automated ANPR, face matching, and multi-tenant control.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2.5 text-[10px] text-slate-300">
                <Cpu size={14} className="text-pink-400 flex-shrink-0" />
                <span>Distributed AI Edge Processing</span>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] text-slate-300">
                <Eye size={14} className="text-cyan-400 flex-shrink-0" />
                <span>ANPR, Face Rec & WildWatch Engines</span>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] text-slate-300">
                <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Enterprise Privilege-Based Security</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-600 font-mono border-t border-slate-900 pt-3">
            SuryaSANC Strategic Defense & Enterprise Automation
          </div>
        </div>

        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center space-y-6 bg-[#070b19]">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 border border-pink-500/40 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-pink-500/10">
              <img src="/pratyaksha-icon.png" alt="Logo Badge" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(236,72,153,0.6)]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white uppercase tracking-wider">PRATYAKSHA ENTERPRISE AI</h1>
              <p className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 font-bold uppercase tracking-widest">Surveillance & Defense Analytics Platform</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Officer Email ID</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-pink-500 transition shadow-inner" 
                required 
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Authentication Code</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-pink-500 transition shadow-inner" 
                  required 
                />
                <Lock size={14} className="absolute right-3 top-3.5 text-slate-500" />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/20 transition transform active:scale-98"
            >
              Authenticate & Launch <ArrowRight size={16} />
            </button>
          </form>

          <div className="text-[9px] text-center text-slate-500 font-mono">
            Secure Encrypted Session | System Operational
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Navigate to="/admin/command-center" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/:moduleName" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
