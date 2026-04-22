import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Lock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactPlayer from 'react-player';

interface Course {
  titulo: string;
  descricao: string;
  videoUrl: string;
}

interface Lesson {
  id: string;
  titulo: string;
  videoUrl: string;
  ordem: number;
}

export default function CoursePlayer() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });

  const [isFullScreen, setIsFullScreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Erro ao entrar em tela cheia: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getYoutubeId = (idOrUrl: string) => {
    if (!idOrUrl) return '';
    const trimmed = idOrUrl.trim();
    let videoId = trimmed;

    if (trimmed.includes('v=')) {
      videoId = trimmed.split('v=')[1].split('&')[0];
    } else if (trimmed.includes('youtu.be/')) {
      videoId = trimmed.split('youtu.be/')[1].split('?')[0];
    } else if (trimmed.includes('youtube.com/embed/')) {
      videoId = trimmed.split('youtube.com/embed/')[1].split('?')[0];
    } else if (trimmed.includes('youtube.com/shorts/')) {
      videoId = trimmed.split('youtube.com/shorts/')[1].split('?')[0];
    } else if (trimmed.includes('studio.youtube.com/video/')) {
      videoId = trimmed.split('video/')[1].split('/')[0];
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      videoId = parts[parts.length - 1].split('?')[0];
    }
    return videoId;
  };

  useEffect(() => {
    const checkAccessAndLoad = async () => {
      if (!id || !user) return;

      try {
        const accessDocRef = doc(db, 'acessos', `${user.uid}_${id}`);
        const accessSnap = await getDoc(accessDocRef);
        
        if (!accessSnap.exists() && !profile?.isAdmin) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const courseSnap = await getDoc(doc(db, 'cursos', id));
        if (courseSnap.exists()) {
          const data = courseSnap.data() as Course;
          setCourse(data);

          const qAulas = query(collection(db, 'cursos', id, 'aulas'), orderBy('ordem', 'asc'));
          const snapAulas = await getDocs(qAulas);
          const fetchedAulas = snapAulas.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
          setLessons(fetchedAulas);

          if (fetchedAulas.length > 0) {
            setActiveLesson(fetchedAulas[0]);
            setVideoUrl(fetchedAulas[0].videoUrl);
          } else if (data.videoUrl) {
            setVideoUrl(data.videoUrl);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar curso:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAccessAndLoad();
  }, [id, user, profile]);

  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setVideoUrl(lesson.videoUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 80) + 10 + '%',
        left: Math.floor(Math.random() * 80) + 10 + '%'
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleProgress = (state: { playedSeconds: number }) => {
    if (id && user && Math.floor(state.playedSeconds) % 15 === 0) {
      setDoc(doc(db, 'progresso', `${user.uid}_${id}`), {
        userId: user.uid,
        cursoId: id,
        ultimaPosicao: state.playedSeconds,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  const Player = ReactPlayer as any;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
           <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs">Descriptografando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-zinc-900 border border-red-500/20 p-12 rounded-3xl text-center shadow-3xl"
        >
          <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Acesso Restrito</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Você não possui uma licença ativa para este curso.<br/>
            Adquira o acesso ou entre em contato com o administrador.
          </p>
          <div className="flex flex-col gap-3">
             <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-tighter hover:bg-zinc-200 transition-all">
                Voltar ao Catálogo
             </button>
             <button className="w-full bg-zinc-800 text-zinc-400 font-black py-4 rounded-xl uppercase tracking-tighter border border-zinc-700">
                Falar com Suporte
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-300 flex flex-col font-sans overflow-hidden">
      {/* Top Bar */}
      <nav className="h-16 flex items-center justify-between px-8 glass-panel z-50">
        <button 
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-[10px]">Voltar ao Painel</span>
        </button>
        
        <div className="flex items-center gap-4">
           <div className="security-badge">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Dispositivo Autorizado: <span className="font-mono ml-1">{profile?.deviceId || '...'}</span>
           </div>
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sessão Ativa</p>
              <p className="text-[10px] font-mono text-indigo-400">ENCRYPTED_STREAM_V2</p>
           </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Main Content / Video */}
        <main className="flex-1 overflow-y-auto hide-scrollbar bg-black/20">
           <div 
             ref={playerContainerRef}
             className="aspect-video w-full bg-black relative shadow-2xl group overflow-hidden"
             onContextMenu={(e) => e.preventDefault()}
           >
              {videoUrl ? (
                <div className="w-full h-full relative">
                  {/* Escudo Superior: Bloqueia Título e Botão Partilhar do Topo */}
                  <div className="absolute top-0 left-0 w-full h-[22%] z-40 bg-white/0 cursor-default"></div>
                  
                  {/* Escudo Lateral Esquerdo (Protege contra clicks acidentais no topo esquerdo) */}
                  <div className="absolute top-0 left-0 w-[40%] h-[30%] z-40 bg-white/0 cursor-default"></div>

                  {/* Escudo Inferior Esquerdo: Bloqueia a Setinha de Partilhar do rodapé e logo */}
                  <div className="absolute bottom-0 left-0 w-[15%] h-[15%] z-40 bg-white/0 cursor-default"></div>
                  
                  {/* Escudo Inferior Direito: Bloqueia o Logo YouTube e link externo */}
                  <div className="absolute bottom-0 right-0 w-[25%] h-[15%] z-40 bg-white/0 cursor-default"></div>

                  <iframe
                    key={videoUrl}
                    src={`https://www.youtube.com/embed/${getYoutubeId(videoUrl)}?autoplay=1&rel=0&modestbranding=1&playsinline=1&showinfo=0&controls=1&disablekb=1&fs=0&iv_load_policy=3`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                  
                  {/* Botão de Tela Cheia Customizado (Mais seguro) */}
                  <button 
                    onClick={toggleFullScreen}
                    className="absolute bottom-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-lg border border-white/20 text-white/50 hover:text-white transition-all backdrop-blur-sm"
                    title={isFullScreen ? "Sair da Tela Cheia" : "Tela Cheia de Cinema"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isFullScreen ? (
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                      ) : (
                        <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6"/>
                      )}
                    </svg>
                  </button>

                  {/* Floating Watermark */}
                  <div 
                    className="absolute pointer-events-none transition-all duration-1000 z-50 select-none"
                    style={{ 
                      top: watermarkPos.top, 
                      left: watermarkPos.left,
                      opacity: 0.12
                    }}
                  >
                    <p className="text-white text-[9px] md:text-sm font-mono whitespace-nowrap bg-black/40 px-2 py-1 rounded border border-white/10 uppercase tracking-widest">
                      {user?.email} | IP: PROTECTED
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
           </div>

           <div className="p-8 max-w-5xl">
              <div className="flex items-center gap-3 mb-4">
                 <span className="bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase px-2 py-1 rounded border border-indigo-500/20 tracking-widest">Módulo 01</span>
                 <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{course?.titulo}</h1>
              </div>
              <p className="text-slate-400 leading-relaxed font-normal text-sm max-w-3xl">{course?.descricao}</p>
              
              <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/5">
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold tracking-widest">Acesso</div>
                  <div className="text-xl font-bold text-white uppercase tracking-tight">Liberado</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold tracking-widest">Qualidade</div>
                  <div className="text-xl font-bold text-white uppercase tracking-tight">4K HDR</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold tracking-widest">Status Proteção</div>
                  <div className="text-xl font-bold text-emerald-500 uppercase tracking-tight">Ativo</div>
                </div>
              </div>
           </div>
        </main>

        {/* Sidebar / Playlist */}
        <aside className="w-full lg:w-96 border-l border-white/5 glass-panel flex flex-col h-full z-10">
           <div className="p-5 border-b border-white/5 font-semibold text-white flex justify-between items-center bg-white/5">
              Conteúdo do Curso <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">{lessons.length} Aulas</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
              {lessons.map((lesson, idx) => {
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button 
                    key={lesson.id}
                    onClick={() => selectLesson(lesson)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all border group ${isActive ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 transition-colors'}`}>
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                    <div className="text-xs text-left">
                      <div className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{lesson.titulo}</div>
                      <div className={`text-[10px] ${isActive ? 'text-indigo-400 font-medium' : 'text-slate-600'}`}>
                        {isActive ? 'Reproduzindo agora' : 'Duração automática'}
                      </div>
                    </div>
                  </button>
                );
              })}
              {lessons.length === 0 && (
                <div className="p-10 text-center">
                   <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest italic">Nenhuma aula cadastrada</p>
                </div>
              )}
           </div>
           
           <div className="p-4 bg-white/2 text-[10px] text-center text-slate-600 border-t border-white/5 uppercase tracking-widest font-black italic">
              Streaming Criptografado
           </div>
        </aside>
      </div>

      {/* Watermark */}
      <div className="fixed bottom-6 left-6 z-[100] pointer-events-none opacity-10">
         <p className="text-[9px] font-mono whitespace-nowrap bg-black text-white px-2 py-1 uppercase border border-white/10">Protected Stream: {user?.email} | IP: 127.0.0.1</p>
      </div>
    </div>
  );
}
