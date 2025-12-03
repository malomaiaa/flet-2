
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Hexagon, Loader2, AlertTriangle, ShieldCheck, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation!');
      }
      // onLogin prop is handled by auth state change in App.tsx
    } catch (err: any) {
      setError(err.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
     setLoading(true);
     // Note: This requires a real user in Supabase. We can try to sign up anonymously or just log error if fails.
     // For now, let's just simulate the visual action, assuming the user will use the form
     setError("For demo, please create an account or sign in.");
     setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0B0F19] transition-colors duration-300">
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black text-white p-12 flex-col justify-between border-r border-gray-900">
         <div className="absolute inset-0 z-0">
            <img 
               src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920" 
               alt="Background" 
               className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20"></div>
         </div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl shadow-glow">
                  <Hexagon className="w-8 h-8 fill-transparent text-gray-900 stroke-[3]" />
               </div>
               <span className="text-3xl font-extrabold tracking-tight text-white">Fleet<span className="text-emerald-400">Cmd</span></span>
            </div>
         </div>

         <div className="relative z-10 max-w-lg">
            <h2 className="text-5xl font-black mb-6 leading-tight">
               Manage your fleet with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">precision</span>.
            </h2>
            <p className="text-lg text-gray-400">
               The all-in-one platform for rental car agencies. Track bookings, manage clients, and monitor revenue in real-time.
            </p>
         </div>

         <div className="relative z-10 text-sm text-gray-600 font-bold">
            © 2024 FleetCommand Inc. All rights reserved.
         </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
         <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            
            <div className="flex lg:hidden justify-center mb-8">
               <div className="p-3 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl shadow-glow">
                  <Hexagon className="w-8 h-8 text-gray-900 stroke-[3]" />
               </div>
            </div>

            <div className="text-center mb-8">
               <h2 className="text-3xl font-black text-white mb-2">{mode === 'signin' ? t('signIn') : t('signUp')}</h2>
               <p className="text-gray-400">{mode === 'signin' ? t('signInSubtitle') : 'Create a new account to get started.'}</p>
            </div>

            {error && (
               <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in zoom-in-95">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
               </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('email')}</label>
                  <div className="relative">
                     <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                     <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white font-bold placeholder:text-gray-700 transition-all"
                     />
                  </div>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">{t('password')}</label>
                  <div className="relative">
                     <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                     <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white font-bold placeholder:text-gray-700 transition-all"
                     />
                  </div>
               </div>

               <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-400 to-cyan-400 text-gray-900 rounded-full font-black text-sm shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'signin' ? t('signInButton') : t('signUp')}
               </button>
            </form>

            <div className="text-center">
              <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-sm font-bold text-emerald-400 hover:text-emerald-300">
                {mode === 'signin' ? t('dontHaveAccount') : 'Already have an account? Sign In'}
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
