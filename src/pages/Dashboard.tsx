import React, { useEffect, useState, useMemo } from 'react';
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
  Check,
  Phone,
  Tag
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lockedModalCourse, setLockedModalCourse] = useState<Course | null>(null);
  const navigate = useNavigate();

  // Categorias disponíveis calculadas a partir dos cursos cadastrados
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach(c => {
      const cat = (c.categoria || '').trim();
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [courses]);

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

  // Close locked course modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lockedModalCourse) {
        setLockedModalCourse(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockedModalCourse]);

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

    // Category filter
    if (selectedCategory !== 'all') {
      if ((c.categoria || '').trim().toLowerCase() !== selectedCategory.toLowerCase()) return false;
    }

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

        {/* Contato WhatsApp de Vendas & Suporte */}
        <div className="px-3 mb-2">
          <a
            href="https://wa.me/5585992862177?text=Olá!%20Gostaria%20de%20informações%20sobre%20os%20cursos%20e%20softwares."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-200 transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">WhatsApp de Vendas</div>
              <div className="text-xs font-mono font-bold text-white truncate">(85) 99286-2177</div>
            </div>
          </a>
        </div>

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

            {/* Contato de Vendas WhatsApp */}
            <a 
              href="https://wa.me/5585992862177?text=Olá!%20Gostaria%20de%20comprar%20acesso%20a%20cursos%20ou%20softwares."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-[10px] lg:text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              title="Falar no WhatsApp: (85) 99286-2177"
            >
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">Vendas:</span> <span>(85) 99286-2177</span>
            </a>

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

            {/* Quick Filter Buttons & Category Pills */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => { setActiveTab('all'); setSelectedCategory('all'); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    activeTab === 'all' && selectedCategory === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white/5 text-slate-400 hover:text-white"
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

              {/* Filtro por Categorias (Cursos/Programas lado a lado) */}
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 hide-scrollbar">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span>Categoria:</span>
                  </div>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                      selectedCategory === 'all'
                        ? "bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    Todas
                  </button>
                  {availableCategories.map(cat => {
                    const count = courses.filter(c => (c.categoria || '').trim().toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory.toLowerCase() === cat.toLowerCase() ? 'all' : cat)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5",
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400/30"
                            : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5"
                        )}
                      >
                        <span>{cat}</span>
                        <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-video bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredCourses.map((course) => {
                const hasAccess = userAccess.includes(course.id) || profile?.isAdmin;
                const isSoftware = course.tipo === 'software';

                return (
                  <motion.div 
                    key={course.id}
                    whileHover={{ y: -5 }}
                    onClick={() => handleCourseClick(course)}
                    className={cn(
                      "glass-panel p-3 rounded-2xl group cursor-pointer shadow-xl transition-all border flex flex-col justify-between hover:shadow-2xl relative",
                      hasAccess 
                        ? isSoftware
                          ? "hover:border-emerald-500/50 border-white/5 bg-[#121620]"
                          : "hover:border-indigo-500/50 border-white/5 bg-[#121620]"
                        : "border-white/5 opacity-85 hover:opacity-100 hover:border-amber-500/40 bg-[#0e1017]"
                    )}
                  >
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 shadow-inner">
                        <img 
                          src={course.thumbUrl || `https://picsum.photos/seed/${course.id}/600/400`} 
                          alt={course.titulo}
                          className={cn(
                            "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                            hasAccess ? "brightness-100" : "grayscale opacity-80"
                          )}
                        />

                        {/* Badges no topo da imagem */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
                          {isSoftware ? (
                            <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 backdrop-blur-sm">
                              <Laptop className="w-2.5 h-2.5" /> Software
                            </span>
                          ) : (
                            <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 backdrop-blur-sm">
                              <GraduationCap className="w-2.5 h-2.5" /> Curso
                            </span>
                          )}

                          {course.categoria && (
                            <span className="bg-black/85 text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm">
                              {course.categoria}
                            </span>
                          )}
                        </div>

                        {/* Badge de Download se tiver link do Drive */}
                        {course.downloadUrl && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-black/85 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 backdrop-blur-sm">
                              <Download className="w-2.5 h-2.5" /> Arquivos
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay com Botão para Clicar e Ver */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                           {hasAccess ? (
                             <div className={cn(
                               "px-4 py-2 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 transform translate-y-1 group-hover:translate-y-0 transition-transform",
                               isSoftware ? "bg-emerald-600 shadow-emerald-600/40" : "bg-indigo-600 shadow-indigo-600/40"
                             )}>
                                <Play className="w-4 h-4 fill-current" />
                                <span>{isSoftware ? 'Abrir Programa' : 'Assistir Aula'}</span>
                             </div>
                           ) : (
                             <div className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-1.5 backdrop-blur-sm transform translate-y-1 group-hover:translate-y-0 transition-transform">
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
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{course.descricao}</p>
                      </div>
                    </div>

                    {/* Rodapé do Card com Ação "Clique para Ver" */}
                    <div className="px-3 pb-2 pt-2 border-t border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px]">
                        {hasAccess ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider">
                            <Check className="w-3 h-3" /> Acesso Liberado
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> Não Adquirido
                          </div>
                        )}

                        {hasAccess && course.downloadUrl && (
                          <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Download className="w-2.5 h-2.5 text-emerald-400" /> Download
                          </span>
                        )}
                      </div>

                      {/* Botão de Ação Direto: Clicar para Ver */}
                      <div className={cn(
                        "w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm",
                        hasAccess 
                          ? isSoftware
                            ? "bg-emerald-600/20 group-hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 group-hover:text-white"
                            : "bg-indigo-600/20 group-hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 group-hover:text-white"
                          : "bg-amber-500/10 group-hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 group-hover:text-amber-300"
                      )}>
                        {hasAccess ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isSoftware ? 'Acessar Programa' : 'Assistir Curso'}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Clique para Adquirir</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLockedModalCourse(null);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="max-w-lg w-full bg-[#12151b] border border-white/10 rounded-2xl sm:rounded-3xl shadow-3xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto relative"
            >
              {/* Top Banner & Botão Fechar em Destaque */}
              <div className="relative aspect-video max-h-40 sm:max-h-48 shrink-0 overflow-hidden bg-black/50">
                <img 
                  src={lockedModalCourse.thumbUrl || `https://picsum.photos/seed/${lockedModalCourse.id}/600/400`} 
                  alt={lockedModalCourse.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12151b] via-[#12151b]/40 to-transparent"></div>
                
                {/* Botão Fechar Grande e Sempre Visível no Topo */}
                <button 
                  onClick={() => setLockedModalCourse(null)}
                  className="absolute top-3 right-3 p-2 sm:p-2.5 rounded-full bg-black/80 hover:bg-black text-slate-200 hover:text-white transition-all shadow-xl backdrop-blur-md active:scale-95 z-20 flex items-center gap-1 border border-white/10"
                  title="Fechar (ESC)"
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1 hidden sm:inline">Fechar</span>
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md mb-1.5 inline-flex items-center gap-1 ${
                    lockedModalCourse.tipo === 'software' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {lockedModalCourse.tipo === 'software' ? <Laptop className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                    {lockedModalCourse.tipo === 'software' ? 'Software & Ferramenta' : 'Curso & Treinamento'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">{lockedModalCourse.titulo}</h3>
                </div>
              </div>

              {/* Conteúdo com Rolagem Interna Suave */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Sobre o Conteúdo</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{lockedModalCourse.descricao}</p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">O que está incluso:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Aulas em Vídeo HD
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Acesso Seguro no Seu PC
                    </div>
                    {lockedModalCourse.downloadUrl ? (
                      <div className="flex items-center gap-2 text-emerald-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Download Direto (Google Drive)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Materiais Exclusivos
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Suporte & Atualizações
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Contato Direto de Vendas</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-white">(85) 99286-2177</span>
                </div>
              </div>

              {/* Rodapé Fixo com Botões Visíveis Sem Zoom */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex flex-col sm:flex-row gap-2.5 shrink-0 z-20">
                <button 
                  onClick={() => setLockedModalCourse(null)}
                  className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all order-2 sm:order-1"
                >
                  Voltar
                </button>

                <a 
                  href={
                    lockedModalCourse.buyUrl || 
                    `https://wa.me/5585992862177?text=${encodeURIComponent(`Olá! Tenho interesse em adquirir o acesso ao produto "${lockedModalCourse.titulo}". Como faço para comprar?`)}`
                  }
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/30 active:scale-95 order-1 sm:order-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Adquirir no WhatsApp: (85) 99286-2177</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
