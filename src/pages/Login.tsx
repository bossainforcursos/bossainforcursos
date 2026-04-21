import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { generateDeviceId } from '../lib/utils';
import { LogIn, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        throw new Error("Por favor, verifique seu e-mail antes de acessar a plataforma.");
      }

      const deviceId = generateDeviceId();
      const sessionId = crypto.randomUUID();
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // 1. Check if account is active
        if (userData.ativo === false) {
          throw new Error("Sua conta está desativada. Entre em contato com o suporte.");
        }

        // 2. Anti-sharing check (Device Lock)
        if (userData.deviceId && userData.deviceId !== deviceId) {
          await auth.signOut();
          throw new Error("Acesso bloqueado: Esta conta já está vinculada a outro dispositivo.");
        }

        // 3. Update device (if first time) and Session ID (force unique session)
        await updateDoc(userDocRef, {
          deviceId: userData.deviceId || deviceId,
          currentSessionId: sessionId,
          ultimoLogin: new Date().toISOString(),
          ip: "Detectado no servidor" 
        });
      } else {
        // Heal: Create missing profile if auth exists but firestore doesn't
        await setDoc(userDocRef, {
          email: user.email,
          deviceId: deviceId,
          ativo: true,
          ultimoLogin: new Date().toISOString(),
          isAdmin: false,
          currentSessionId: sessionId
        });
      }

      sessionStorage.setItem('sessionId', sessionId);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else {
        setError(err.message || "Ocorreu um erro ao entrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError("Erro ao enviar e-mail de recuperação.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-10 grayscale"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-black text-2xl text-white shadow-lg shadow-indigo-600/20">M</div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight uppercase">MESTRIA<span className="text-indigo-500">DIGITAL</span></h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Área de Membros Pro</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl mb-6 text-center">
            <p className="text-sm font-medium">Link de recuperação enviado!</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                placeholder="nome@exemplo.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2 px-1">
              <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Senha</label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Acessar Plataforma
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-slate-500 text-xs font-medium">Não possui uma licença?</p>
          <Link to="/register" className="text-white hover:text-indigo-400 font-bold uppercase tracking-wider mt-1 block transition-colors text-xs">
            Criar Registro Seguro
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
