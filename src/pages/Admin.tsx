import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  deleteDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Users, 
  RefreshCcw, 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  Settings,
  ShieldAlert,
  ArrowLeft,
  Search,
  Database,
  Check,
  Loader2,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  id: string;
  email: string;
  deviceId?: string;
  ativo: boolean;
  ultimoLogin: string;
  isAdmin?: boolean;
}

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  videoUrl: string;
  thumbUrl: string;
  createdAt: any;
}

interface Lesson {
  id: string;
  titulo: string;
  videoUrl: string;
  ordem: number;
}

type Tab = 'users' | 'courses' | 'access' | 'lessons';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Modais
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    titulo: '',
    descricao: '',
    videoUrl: '',
    thumbUrl: ''
  });

  // Access State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userAccessList, setUserAccessList] = useState<string[]>([]);

  // Lessons State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    titulo: '',
    videoUrl: '',
    ordem: 1
  });

  const fetchUsers = async () => {
    try {
      const q = collection(db, 'users');
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(fetched);
    } catch (err: any) { 
      console.error(err); 
      if (err.code === 'permission-denied') {
        alert("Erro de Permissão no Admin: Você não tem autorização para listar usuários.");
      }
    }
  };

  const fetchCourses = async () => {
    try {
      const q = collection(db, 'cursos');
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(fetched);
    } catch (err: any) { 
      console.error(err); 
      if (err.code === 'permission-denied') {
        alert("Erro de Permissão no Admin: Você não tem autorização para listar cursos.");
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchCourses()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleResetDevice = async (userId: string) => {
    if (!confirm("Deseja resetar o dispositivo deste usuário? Ele poderá logar em um novo aparelho no próximo acesso.")) return;
    try {
      await updateDoc(doc(db, 'users', userId), { deviceId: null });
      fetchUsers();
    } catch (err) { alert("Erro ao resetar dispositivo."); }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.id), { ativo: !user.ativo });
      fetchUsers();
    } catch (err) { alert("Erro ao alterar status."); }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'cursos', editingCourse.id), courseForm);
      } else {
        await addDoc(collection(db, 'cursos'), {
          ...courseForm,
          createdAt: serverTimestamp()
        });
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ titulo: '', descricao: '', videoUrl: '', thumbUrl: '' });
      fetchCourses();
    } catch (err) { alert("Erro ao salvar curso."); }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    try {
      await deleteDoc(doc(db, 'cursos', id));
      fetchCourses();
    } catch (err) { alert("Erro ao excluir curso."); }
  };

  const openAccess = async (user: UserProfile) => {
    setSelectedUser(user);
    setActiveTab('access');
    try {
      const q = query(collection(db, 'acessos'), where('userId', '==', user.id));
      const snap = await getDocs(q);
      const ids = snap.docs.map(doc => doc.data().cursoId);
      setUserAccessList(ids);
    } catch (err: any) { 
      console.error(err); 
    }
  };

  const openLessons = async (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('lessons');
    try {
      const q = query(collection(db, 'cursos', course.id, 'aulas'), orderBy('ordem', 'asc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(fetched);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        alert("Erro de Permissão: Você não tem autorização para listar aulas.");
      }
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      if (editingLesson) {
        await updateDoc(doc(db, 'cursos', selectedCourse.id, 'aulas', editingLesson.id), lessonForm);
      } else {
        await addDoc(collection(db, 'cursos', selectedCourse.id, 'aulas'), {
          ...lessonForm,
          createdAt: serverTimestamp()
        });
      }
      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ titulo: '', videoUrl: '', ordem: lessons.length + 1 });
      openLessons(selectedCourse);
    } catch (err) { alert("Erro ao salvar aula."); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!selectedCourse || !confirm("Tem certeza que deseja excluir esta aula?")) return;
    try {
      await deleteDoc(doc(db, 'cursos', selectedCourse.id, 'aulas', id));
      openLessons(selectedCourse);
    } catch (err) { alert("Erro ao excluir aula."); }
  };

  const toggleCourseAccess = async (courseId: string) => {
    if (!selectedUser) return;
    const docId = `${selectedUser.id}_${courseId}`;
    const hasAccess = userAccessList.includes(courseId);

    try {
      if (hasAccess) {
        await deleteDoc(doc(db, 'acessos', docId));
        setUserAccessList(prev => prev.filter(id => id !== courseId));
      } else {
        await setDoc(doc(db, 'acessos', docId), {
          userId: selectedUser.id,
          cursoId: courseId,
          concedidoEm: serverTimestamp()
        });
        setUserAccessList(prev => [...prev, courseId]);
      }
    } catch (err) { alert("Erro ao atualizar acesso."); }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen w-screen text-slate-300 font-sans overflow-hidden bg-[#0f1115]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col glass-panel shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">M</div>
          <span className="text-white font-bold text-lg tracking-tight uppercase">ADMIN<span className="text-indigo-500">MESTRIA</span></span>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full p-3 rounded flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Gestão de Usuários</span>
          </button>

          <button 
            onClick={() => setActiveTab('courses')}
            className={`w-full p-3 rounded flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'courses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Gestão de Cursos</span>
          </button>
          
          <div 
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar ao Site</span>
          </div>
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Sistema de Segurança</div>
          <div className="security-badge w-full justify-center">
            MODO ADMINISTRADOR ATIVO
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 glass-panel z-10">
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight">
              {activeTab === 'users' ? 'Alunos da Mestria' : activeTab === 'courses' ? 'Treinamentos Disponíveis' : 'Controles de Acesso'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTab === 'users' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Filtrar alunos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-6 text-xs focus:outline-none focus:border-indigo-500 transition-all w-64 text-white"
                />
              </div>
            )}
            {activeTab === 'courses' && (
              <button 
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({ titulo: '', descricao: '', videoUrl: '', thumbUrl: '' });
                  setShowCourseModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-3 h-3" />
                Novo Curso
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto hide-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 italic">Sincronizando registros...</p>
             </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/2 border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Identidade</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 italic">DeviceId Lock</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 italic text-right">Controles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-semibold text-sm">{user.email}</span>
                              <span className="text-[10px] text-slate-500 uppercase font-medium tracking-tight">Login: {user.ultimoLogin ? new Date(user.ultimoLogin).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.ativo ? (
                              <span className="text-emerald-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">Ativo</span>
                            ) : (
                              <span className="text-red-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/5 border border-red-500/10">Bloqueado</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {user.deviceId ? (
                              <code className="bg-black/40 text-indigo-400 px-2 py-1 rounded text-[10px] font-mono border border-indigo-500/10">{user.deviceId}</code>
                            ) : (
                              <span className="text-slate-600 italic text-[10px]">Pendente...</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openAccess(user)}
                                className="p-2 glass-panel hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-all"
                                title="Gerenciar Acessos"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleResetDevice(user.id)}
                                className="p-2 glass-panel hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                                title="Resetar Hardware ID"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleToggleActive(user)}
                                className={`p-2 rounded-lg transition-all border ${user.ativo ? 'bg-red-500/5 border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                title={user.ativo ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
                              >
                                {user.ativo ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {courses.map(course => (
                     <div key={course.id} className="glass-panel rounded-xl overflow-hidden shadow-xl border border-white/5 flex flex-col">
                        <div className="aspect-video relative group">
                          <img src={course.thumbUrl || `https://picsum.photos/seed/${course.id}/600/400`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                              <button 
                              onClick={() => openLessons(course)}
                              className="p-3 bg-indigo-600/20 hover:bg-indigo-600 text-white rounded-full transition-all"
                              title="Gerenciar Aulas"
                            >
                                <Database className="w-5 h-5" />
                             </button>
                             <button 
                              onClick={() => {
                                setEditingCourse(course);
                                setCourseForm({
                                  titulo: course.titulo,
                                  descricao: course.descricao,
                                  videoUrl: course.videoUrl,
                                  thumbUrl: course.thumbUrl
                                });
                                setShowCourseModal(true);
                              }}
                              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                            >
                                <Edit2 className="w-5 h-5" />
                             </button>
                             <button 
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-3 bg-red-500/20 hover:bg-red-500 text-white rounded-full transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                             </button>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                           <h3 className="text-white font-bold uppercase tracking-tight text-sm mb-2">{course.titulo}</h3>
                           <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed flex-1">{course.descricao}</p>
                           <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[10px] font-mono text-indigo-400">ID: {course.id.substring(0,8)}</span>
                              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                                <Check className="w-3 h-3" /> Pronto
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {activeTab === 'access' && selectedUser && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto"
                >
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <div className="flex items-center gap-2 text-indigo-400 mb-1">
                           <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => setActiveTab('users')} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Controle de Privilégios</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Gerenciando: {selectedUser.email}</h2>
                     </div>
                     <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-emerald-500/10">
                        {userAccessList.length} Treinamentos Liberados
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {courses.map(course => {
                        const hasAccess = userAccessList.includes(course.id);
                        return (
                          <div 
                            key={course.id}
                            onClick={() => toggleCourseAccess(course.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${hasAccess ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                          >
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasAccess ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-600 group-hover:text-slate-400 transition-colors'}`}>
                                   <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className={`text-sm font-bold uppercase transition-colors ${hasAccess ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{course.titulo}</p>
                                   <p className="text-[10px] text-slate-500 uppercase tracking-widest">{hasAccess ? 'Acesso Vitalício' : 'Acesso Revogado'}</p>
                                </div>
                             </div>
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${hasAccess ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/10 text-transparent'}`}>
                                <Check className="w-4 h-4" />
                             </div>
                          </div>
                        );
                     })}
                  </div>
                  
                  <div className="mt-12 flex justify-end">
                     <button 
                       onClick={() => setActiveTab('users')}
                       className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                     >
                       Concluir Alterações
                     </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'lessons' && selectedCourse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-8 rounded-2xl shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <ArrowLeft className="w-6 h-6 cursor-pointer text-slate-400 hover:text-white transition-colors" onClick={() => setActiveTab('courses')} />
                        <div>
                          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{selectedCourse.titulo}: Aulas</h2>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Organize a sequência do seu conteúdo</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => {
                          setEditingLesson(null);
                          setLessonForm({ titulo: '', videoUrl: '', ordem: lessons.length + 1 });
                          setShowLessonModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Aula
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {lessons.map(lesson => (
                       <div key={lesson.id} className="p-5 glass-panel rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center justify-between mb-3">
                             <div className="w-8 h-8 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/10">
                                {lesson.ordem}
                             </div>
                             <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingLesson(lesson);
                                    setLessonForm({ titulo: lesson.titulo, videoUrl: lesson.videoUrl, ordem: lesson.ordem });
                                    setShowLessonModal(true);
                                  }}
                                  className="p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                          <h4 className="text-white font-bold text-sm uppercase tracking-tight mb-1 truncate">{lesson.titulo}</h4>
                          <p className="text-[10px] font-mono text-slate-600 truncate">{lesson.videoUrl}</p>
                       </div>
                     ))}
                     {lessons.length === 0 && (
                       <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] italic">Este curso ainda não possui aulas cadastradas.</p>
                       </div>
                     )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Course Modal */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="max-w-2xl w-full glass-panel rounded-2xl shadow-3xl overflow-hidden"
             >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                   <h3 className="text-white font-bold uppercase tracking-widest text-xs">{editingCourse ? 'Editar Treinamento' : 'Novo Treinamento'}</h3>
                   <button onClick={() => setShowCourseModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveCourse} className="p-8 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Título do Curso</label>
                        <input 
                          required
                          value={courseForm.titulo}
                          onChange={(e) => setCourseForm({...courseForm, titulo: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm"
                          placeholder="Ex: Domina Canva Pro"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">URL do Vídeo (YouTube)</label>
                        <input 
                          required
                          value={courseForm.videoUrl}
                          onChange={(e) => setCourseForm({...courseForm, videoUrl: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Descrição</label>
                      <textarea 
                        required
                        value={courseForm.descricao}
                        onChange={(e) => setCourseForm({...courseForm, descricao: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm min-h-[100px]"
                        placeholder="Conte um pouco sobre o curso..."
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">URL da Thumbnail (Imagem)</label>
                      <input 
                        value={courseForm.thumbUrl}
                        onChange={(e) => setCourseForm({...courseForm, thumbUrl: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm"
                        placeholder="Link da imagem de capa..."
                      />
                   </div>

                   <div className="pt-6 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowCourseModal(false)}
                        className="flex-1 py-4 bg-zinc-800 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-2 py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        {editingCourse ? 'Salvar Alterações' : 'Criar Treinamento'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Lesson Modal */}
      <AnimatePresence>
        {showLessonModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="max-w-md w-full glass-panel rounded-2xl shadow-3xl overflow-hidden"
             >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                   <h3 className="text-white font-bold uppercase tracking-widest text-xs">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h3>
                   <button onClick={() => setShowLessonModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveLesson} className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Título da Aula</label>
                      <input 
                        required
                        value={lessonForm.titulo}
                        onChange={(e) => setLessonForm({...lessonForm, titulo: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm"
                        placeholder="Ex: Aula 01 - Introdução"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">ID do Vídeo (YouTube)</label>
                      <input 
                        required
                        value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm"
                        placeholder="Ex: XXXXXXX (apenas o código)"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Ordem de Exibição</label>
                      <input 
                        type="number"
                        required
                        value={lessonForm.ordem}
                        onChange={(e) => setLessonForm({...lessonForm, ordem: parseInt(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-indigo-500 outline-none transition-all text-sm"
                      />
                   </div>

                   <div className="pt-6 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowLessonModal(false)}
                        className="flex-1 py-4 bg-zinc-800 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-2 py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        {editingLesson ? 'Salvar Aula' : 'Criar Aula'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
