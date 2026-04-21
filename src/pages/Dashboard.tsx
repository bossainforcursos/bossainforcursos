import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Play, LogOut, ShieldCheck, ChevronRight, Search, Bell, User, LayoutDashboard, Lock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  thumbUrl: string;
}

export default function Dashboard() {
  const { logout, profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userAccess, setUserAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      
      try {
        // 1. Fetch todos os cursos
        const qCursos = query(collection(db, 'cursos'), orderBy('titulo', 'asc'));
        const snapCursos = await getDocs(qCursos);
        const fetchedCursos = snapCursos.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Course));
        setCourses(fetchedCursos);

        // 2. Fetch acessos do usuário
        const qAcessos = query(collection(db, 'acessos'), where('userId', '==', user.uid));
        const snapAcessos = await getDocs(qAcessos);
        const accessibleCourseIds = snapAcessos.docs.map(doc => doc.data().cursoId);
        setUserAccess(accessibleCourseIds);
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        if (err.code === 'permission-denied') {
          alert("Erro de Permissão: Você não tem autorização para ler o catálogo ou seus acessos. Verifique se seu e-mail foi validado.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.uid]);

  const handleCourseClick = (courseId: string) => {
    if (userAccess.includes(courseId) || profile?.isAdmin) {
      navigate(`/course/${courseId}`);
    } else {
      alert("Acesso Bloqueado: Você ainda não adquiriu este treinamento. Entre em contato com o suporte.");
    }
  };

  return (
    <div className="flex h-screen w-screen text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col glass-panel shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">M</div>
          <span className="text-white font-bold text-lg tracking-tight uppercase">MESTRIA<span className="text-indigo-500">DIGITAL</span></span>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          <div className="sidebar-item-active p-3 rounded flex items-center gap-3 cursor-pointer group">
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">Meus Cursos</span>
          </div>
          
          <div className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Segurança</span>
          </div>

          {profile?.isAdmin && (
            <div 
              onClick={() => navigate('/admin')}
              className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-indigo-600/10 transition-all text-indigo-400 hover:text-indigo-300 border border-transparent hover:border-indigo-500/30 group"
            >
              <ShieldAlert className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-tight">Painel Administrativo</span>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
              {profile?.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{profile?.email}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {profile?.isAdmin ? 'Administrator' : 'Premium Member'}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full py-2 px-4 rounded border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-red-500/80 hover:text-red-500"
          >
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#0f1115] relative overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 glass-panel z-10">
          <div className="flex items-center gap-4">
            <div className="security-badge">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Dispositivo Autorizado: <span className="font-mono ml-1">{profile?.deviceId || 'Detectando...'}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>Sessão Protegida</span>
            <Bell className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Search className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto hide-scrollbar">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">Catálogo de Cursos</h2>
            <p className="text-slate-500 text-sm italic font-medium tracking-tight">Conteúdo exclusivo com proteção anti-pirataria.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse border border-white/5"></div>
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <motion.div 
                  key={course.id}
                  whileHover={{ y: userAccess.includes(course.id) || profile?.isAdmin ? -5 : 0 }}
                  onClick={() => handleCourseClick(course.id)}
                  className={cn(
                    "glass-panel p-2 rounded-xl group cursor-pointer shadow-xl transition-all border-white/5",
                    (userAccess.includes(course.id) || profile?.isAdmin) 
                      ? "hover:border-indigo-500/30" 
                      : "opacity-60 grayscale hover:grayscale-[0.5]"
                  )}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={course.thumbUrl || `https://picsum.photos/seed/${course.id}/600/400`} 
                      alt={course.titulo}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                       {(userAccess.includes(course.id) || profile?.isAdmin) ? (
                         <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40">
                            <Play className="w-6 h-6 fill-current" />
                         </div>
                       ) : (
                         <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white shadow-xl">
                            <Lock className="w-6 h-6" />
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                       <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{course.titulo}</h4>
                       {!(userAccess.includes(course.id) || profile?.isAdmin) && <Lock className="w-3 h-3 text-slate-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{course.descricao}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass-panel rounded-2xl border-white/5 border-dashed">
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] italic">Nenhum curso liberado em sua conta comercial.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
