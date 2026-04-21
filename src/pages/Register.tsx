import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { generateDeviceId } from '../lib/utils';
import { UserPlus, Mail, Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Create initial profile
      const deviceId = generateDeviceId();
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        deviceId: deviceId, // Lock to registering device
        ativo: true,
        ultimoLogin: new Date().toISOString(),
        isAdmin: false
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("O login por e-mail ainda está sendo ativado pelo Google. Por favor, aguarde 1 minuto e ATUALIZE ESTA PÁGINA (F5) antes de tentar novamente.");
      } else if (err.code === 'permission-denied') {
        setError("Erro de permissão no banco de dados. Por favor, tente novamente ou contate o suporte.");
      } else {
        setError(`Erro: ${err.message || "Ocorreu um erro ao criar a conta."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-emerald-500/20 p-10 rounded-3xl"
        >
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Conta Criada!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Enviamos um link de verificação para seu e-mail.<br/> 
            <b>Por favor, verifique sua caixa de entrada</b> para ativar seu acesso.
          </p>
          <Link to="/login" className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all uppercase tracking-tighter">
            Ir para Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-5"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-black text-2xl text-white shadow-lg shadow-indigo-600/20">M</div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight uppercase">MESTRIA<span className="text-indigo-500">DIGITAL</span></h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Crie sua conta segura</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">Seu melhor E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="exemplo@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">Defina uma Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="Mínimo 6 dígitos"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">Confirme a Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="Repita a senha"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] mt-6 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            Criar Registro Seguro
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-slate-500 text-xs font-medium">Já possui acesso?</p>
          <Link to="/login" className="text-white hover:text-indigo-400 font-bold uppercase tracking-wider mt-1 block transition-colors text-xs">
            Entrar Agora
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
