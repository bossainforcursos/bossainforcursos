import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  LogOut, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  Bell, 
  User, 
  LayoutDashboard, 
  Lock, 
  ShieldAlert, 
  Menu, 
  X,
  Download,
  Laptop,
  GraduationCap,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FolderDown,
  Layers,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  thumbUrl: string;
  categoria?: string;
  ordem?: number;
  tipo?: 'curso' | 'software';
  downloadUrl?: string;
  downloadLabel?: string;
  buyUrl?: string;
}

export default function Dashboard() {
  const { logout, profile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userAccess, setUserAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'curso' | 'software' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lockedModalCourse, setLockedModalCourse] = useState<Course | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      
      try {
        // Fetch todos os cursos e ordena via JavaScript para incluir documentos sem o campo 'ordem'
        const qCursos = query(collection(db, 'cursos'));
        const snapCursos = await getDocs(qCursos);
        const fetchedCursos = snapCursos.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Course)).sort((a, b) => {
          const ordemA = a.ordem ?? 999;
          const ordemB = b.ordem ?? 999;
          if (ordemA !== ordemB) return ordemA - ordemB;
          return a.titulo.localeCompare(b.titulo);
        });
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

  const handleCourseClick = (course: Course) => {
    if (userAccess.includes(course.id) || profile?.isAdmin) {
      navigate(`/course/${course.id}`);
    } else {
      // Abre a vitrine do produto para venda/aquisição em vez de alerta simples
      setLockedModalCourse(course);
    }
  };

  const filteredCourses = courses.filter(c => {
    // Tab filter
    if (activeTab === 'curso' && (c.tipo || 'curso') !== 'curso') return false;
    if (activeTab === 'software' && c.tipo !== 'software') return false;
    if (activeTab === 'mine' && !userAccess.includes(c.id) && !profile?.isAdmin) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.titulo.toLowerCase().includes(q);
      const matchDesc = c.descricao.toLowerCase().includes(q);
      const matchCat = (c.categoria || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="flex h-screen w-screen text-slate-300 font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 flex flex-col glass-panel shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">M</div>
            <span className="text-white font-bold text-lg tracking-tight uppercase">MESTRIA<span className="text-indigo-500">DIGITAL</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          <div 
            onClick={() => { setActiveTab('all'); setIsSidebarOpen(false); }}
            className={cn(
              "p-3 rounded flex items-center justify-between cursor-pointer transition-all",
              activeTab === 'all' ? "sidebar-item-active" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Todos os Produtos</span>
            </div>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded font-bold text-slate-400">{courses.length}</span>
          </div>

          <div 
            onClick={() => { setActiveTab('curso'); setIsSidebarOpen(false); }}
            className={cn(
              "p-3 rounded flex items-center justify-between cursor-pointer transition-all",
              activeTab === 'curso' ? "sidebar-item-active" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Cursos & Treinamentos</span>
            </div>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded font-bold text-slate-400">
              {courses.filter(c => (c.tipo || 'curso') === 'curso').length}
            </span>
          </div>

          <div 
            onClick={() => { setActiveTab('software'); setIsSidebarOpen(false); }}
            className={cn(
              "p-3 rounded flex items-center justify-between cursor-pointer transition-all",
              activeTab === 'software' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">Programas & Softwares</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
              {courses.filter(c => c.tipo === 'software').length}
            </span>
          </div>

          <div 
            onClick={() => { setActiveTab('mine'); setIsSidebarOpen(false); }}
            className={cn(
              "p-3 rounded flex items-center justify-between cursor-pointer transition-all",
              activeTab === 'mine' ? "sidebar-item-active" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Play className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium">Meus Acessos</span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
              {profile?.isAdmin ? courses.length : userAccess.length}
            </span>
          </div>
          
          <div className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Proteção Anti-Pirataria</span>
          </div>

          {profile?.isAdmin && (
            <div 
              onClick={() => { navigate('/admin'); setIsSidebarOpen(false); }}
              className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-indigo-600/10 transition-all text-indigo-400 hover:text-indigo-300 border border-transparent hover:border-indigo-500/30 group mt-4"
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
      <main className="flex-1 flex flex-col bg-[#0f1115] relative overflow-hidden w-full">
        <header className="h-20 lg:h-16 border-b border-white/5 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-4 lg:px-8 glass-panel z-10 gap-2 py-2 lg:py-0">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="security-badge py-1 text-[9px] lg:text-[10px]">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="truncate max-w-[150px] lg:max-w-none ml-1">
                Dispositivo Vinculado: <span className="font-mono text-indigo-400">{profile?.deviceId?.substring(0, 8) || 'Detectando...'}</span>
              </span>
            </div>

            <div className="w-8 lg:hidden"></div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            {/* Live Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text"
                placeholder="Buscar cursos ou programas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="whitespace-nowrap">Sessão Segura</span>
              <Bell className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto hide-scrollbar">
          {/* Header & Tabs */}
          <div className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-1 uppercase tracking-tight flex items-center gap-2">
                {activeTab === 'software' ? (
                  <>
                    <Laptop className="w-6 h-6 text-emerald-400" /> Programas & Softwares
                  </>
                ) : activeTab === 'curso' ? (
                  <>
                    <GraduationCap className="w-6 h-6 text-indigo-400" /> Cursos & Treinamentos
                  </>
                ) : activeTab === 'mine' ? (
                  <>
                    <Play className="w-6 h-6 text-indigo-400" /> Meus Treinamentos Liberados
                  </>
                ) : (
                  <>
                    Catálogo de Cursos & Softwares
                  </>
                )}
              </h2>
              <p className="text-slate-500 text-xs lg:text-sm italic font-medium tracking-tight">
                Acesse suas videoaulas e faça o download dos programas com instaladores diretos.
              </p>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  activeTab === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                Todos ({courses.length})
              </button>
              <button 
                onClick={() => setActiveTab('curso')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all",
                  activeTab === 'curso' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Cursos ({courses.filter(c => (c.tipo || 'curso') === 'curso').length})
              </button>
              <button 
                onClick={() => setActiveTab('software')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all",
                  activeTab === 'software' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                Softwares ({courses.filter(c => c.tipo === 'software').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="space-y-12">
              {Object.entries(
                filteredCourses.reduce((acc, c) => {
                  const cat = c.categoria || 'Geral';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(c);
                  return acc;
                }, {} as Record<string, Course[]>)
              ).map(([categoria, items]) => (
                <div key={categoria} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500 bg-indigo-500/5 px-4 py-1 rounded border border-indigo-500/10 inline-block">
                      {categoria}
                    </h3>
                    <div className="flex-1 h-[1px] bg-white/5"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((course) => {
                      const hasAccess = userAccess.includes(course.id) || profile?.isAdmin;
                      const isSoftware = course.tipo === 'software';

                      return (
                        <motion.div 
                          key={course.id}
                          whileHover={{ y: hasAccess ? -5 : -2 }}
                          onClick={() => handleCourseClick(course)}
                          className={cn(
                            "glass-panel p-2.5 rounded-xl group cursor-pointer shadow-xl transition-all border flex flex-col justify-between",
                            hasAccess 
                              ? isSoftware
                                ? "hover:border-emerald-500/40 border-white/5"
                                : "hover:border-indigo-500/30 border-white/5"
                              : "border-white/5 opacity-80 hover:opacity-100 hover:border-amber-500/30"
                          )}
                        >
                          <div>
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              <img 
                                src={course.thumbUrl || `https://picsum.photos/seed/${course.id}/600/400`} 
                                alt={course.titulo}
                                className={cn(
                                  "w-full h-full object-cover transition-all duration-500",
                                  hasAccess ? "grayscale group-hover:grayscale-0" : "grayscale"
                                )}
                              />

                              {/* Badges no topo da imagem */}
                              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                {isSoftware ? (
                                  <span className="bg-emerald-600/95 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-1 backdrop-blur-sm">
                                    <Laptop className="w-2.5 h-2.5" /> Software
                                  </span>
                                ) : (
                                  <span className="bg-indigo-600/95 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-1 backdrop-blur-sm">
                                    <GraduationCap className="w-2.5 h-2.5" /> Curso
                                  </span>
                                )}
                              </div>

                              {/* Badge de Download se tiver link do Drive */}
                              {course.downloadUrl && (
                                <div className="absolute top-2 right-2">
                                  <span className="bg-black/80 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-1 backdrop-blur-sm">
                                    <Download className="w-2.5 h-2.5" /> Arquivos
                                  </span>
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                 {hasAccess ? (
                                   <div className={cn(
                                     "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl",
                                     isSoftware ? "bg-emerald-600 shadow-emerald-600/40" : "bg-indigo-600 shadow-indigo-600/40"
                                   )}>
                                      <Play className="w-6 h-6 fill-current" />
                                   </div>
                                 ) : (
                                   <div className="px-4 py-2 rounded-xl bg-amber-500/90 text-black font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-1.5 backdrop-blur-sm">
                                      <Lock className="w-4 h-4" /> Conhecer / Adquirir
                                   </div>
                                 )}
                              </div>
                            </div>

                            <div className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                 <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate">
                                   {course.titulo}
                                 </h4>
                                 {!hasAccess && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{course.descricao}</p>
                            </div>
                          </div>

                          {/* Rodapé do Card */}
                          <div className="px-3 pb-2 pt-2 border-t border-white/5 flex items-center justify-between">
                            {hasAccess ? (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                <Check className="w-3 h-3" /> Acesso Liberado
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                <Lock className="w-3 h-3" /> Não Adquirido
                              </div>
                            )}

                            {hasAccess && course.downloadUrl && (
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <Download className="w-3 h-3 text-emerald-400" /> Download
                              </span>
                            )}

                            {!hasAccess && (
                              <span className="text-[10px] text-amber-300 font-bold uppercase hover:underline">
                                Saiba Mais &rarr;
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center glass-panel rounded-2xl border-white/5 border-dashed">
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] italic">
                {searchQuery ? "Nenhum resultado encontrado para sua busca." : "Nenhum item encontrado nesta categoria."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Vitrine / Produto Bloqueado */}
      <AnimatePresence>
        {lockedModalCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="max-w-lg w-full glass-panel rounded-3xl shadow-3xl overflow-hidden border border-white/10"
            >
              <div className="relative aspect-video">
                <img 
                  src={lockedModalCourse.thumbUrl || `https://picsum.photos/seed/${lockedModalCourse.id}/600/400`} 
                  alt={lockedModalCourse.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-black/40 to-transparent"></div>
                
                <button 
                  onClick={() => setLockedModalCourse(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-slate-400 hover:text-white transition-all backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-6 right-6">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md mb-2 inline-flex items-center gap-1 ${
                    lockedModalCourse.tipo === 'software' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {lockedModalCourse.tipo === 'software' ? <Laptop className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                    {lockedModalCourse.tipo === 'software' ? 'Software & Ferramenta' : 'Curso & Treinamento'}
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{lockedModalCourse.titulo}</h3>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Sobre o Conteúdo</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{lockedModalCourse.descricao}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">O que está incluso:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Aulas em Vídeo HD
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acesso Seguro no Seu PC
                    </div>
                    {lockedModalCourse.downloadUrl ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Download Direto (Google Drive)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Materiais Exclusivos
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Suporte e Atualizações
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setLockedModalCourse(null)}
                    className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Voltar
                  </button>

                  <a 
                    href={
                      lockedModalCourse.buyUrl || 
                      `https://wa.me/?text=${encodeURIComponent(`Olá! Tenho interesse em adquirir o acesso ao produto "${lockedModalCourse.titulo}". Como faço?`)}`
                    }
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/30"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Adquirir Acesso / Falar no WhatsApp</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
