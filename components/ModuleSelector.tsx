import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  BarChart3,
  Wand2,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Download,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  X,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveUserStats, getUserStats, saveGlobalSettings, getGlobalSettings, saveCustomModules, getCustomModules, deleteModuleData } from '../services/firestoreService';

/**
 * INTERFACES DE DATOS LOCALES
 * Definidas aquí para que el archivo sea independiente y no dependa de rutas externas.
 */
interface UserStats {
  xp: number;
  level: number;
  wordsLearned: number;
  lessonsCompleted: number;
  streak: number;
  lastVisit: number;
  dailyWordsGoal: number;
  dailyLessonsGoal: number;
  history: Record<string, { words: number; lessons: number; xp: number }>;
}

interface CustomModule {
  id: string;
  title: string;
  color: string;
  level: string;
}

interface Props {
  onSelect: (id: string) => void;
  onOpenTutor: () => void;
  onOpenUserHub: () => void;
}

const MODULES_INFO = [
  { id: 'mod1', title: 'Módulo 1: Principiante', color: 'bg-blue-600', words: 197, level: 'Beginner' },
  { id: 'mod2', title: 'Módulo 2: Intermedio', color: 'bg-emerald-600', words: 243, level: 'Intermediate' },
  { id: 'mod3', title: 'Módulo 3: Avanzado', color: 'bg-purple-600', words: 235, level: 'Advanced' },
  { id: 'mod4', title: 'Módulo 4: Avanzado Superior', color: 'bg-orange-600', words: 244, level: 'Upper Advanced' },
  { id: 'mod5', title: 'Módulo 5: Experto', color: 'bg-rose-600', words: 256, level: 'Expert' },
];

const COLORS = [
  'bg-indigo-400', 'bg-teal-400', 'bg-violet-400', 'bg-pink-400',
  'bg-slate-500', 'bg-cyan-500', 'bg-rose-400', 'bg-amber-400'
];

const ModuleSelector: React.FC<Props> = ({ onSelect, onOpenTutor, onOpenUserHub }) => {
  const { user } = useAuth();
  // Clave única para forzar el re-montaje de componentes tras la importación
  const [appKey, setAppKey] = useState(0);

  const [course2Name, setCourse2Name] = useState('Curso Personalizado');
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [customModules, setCustomModules] = useState<CustomModule[]>([]);
  const [inputKey, setInputKey] = useState(Date.now());
  const [isSuccess, setIsSuccess] = useState(false);

  const [stats, setStats] = useState<UserStats>({
    xp: 0, level: 1, wordsLearned: 0, lessonsCompleted: 0, streak: 1, lastVisit: Date.now(),
    dailyWordsGoal: 10, dailyLessonsGoal: 2, history: {}
  });

  const [pendingImport, setPendingImport] = useState<{
    data: any;
    stats: {
      level: number;
      modules: number;
      hardCount: number;
      listeningCount: number;
      customWords: number;
      totalReviewed: number;
    };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carga de datos que se dispara inicialmente y cada vez que appKey cambia (Soft Reset)
  useEffect(() => {
    const loadInitialData = async () => {
      // Try Firestore first
      if (user) {
        try {
          const cloudStats = await getUserStats(user.uid);
          if (cloudStats) {
            setStats(cloudStats);
            localStorage.setItem('global_user_stats', JSON.stringify(cloudStats));
          }
          const cloudSettings = await getGlobalSettings(user.uid);
          if (cloudSettings?.course2Name) {
            setCourse2Name(cloudSettings.course2Name);
            localStorage.setItem('course2_name', cloudSettings.course2Name);
          }
          const cloudMods = await getCustomModules(user.uid);
          if (cloudMods) {
            setCustomModules(cloudMods);
            localStorage.setItem('custom_modules_list', JSON.stringify(cloudMods));
          }
        } catch (e) {
          console.warn('Firestore load failed, using localStorage:', e);
        }
      }

      // Fallback to localStorage
      const savedStats = localStorage.getItem('global_user_stats');
      if (savedStats && !stats.xp) setStats(JSON.parse(savedStats));

      const savedName = localStorage.getItem('course2_name');
      if (savedName && course2Name === 'Curso Personalizado') setCourse2Name(savedName);

      const savedMods = localStorage.getItem('custom_modules_list');
      if (savedMods && !customModules.length) {
        setCustomModules(JSON.parse(savedMods));
      } else if (!customModules.length) {
        const initialMod = [{ id: 'custom_1', title: 'Mi Primer Módulo', color: 'bg-indigo-400', level: 'Personalizado' }];
        setCustomModules(initialMod);
        localStorage.setItem('custom_modules_list', JSON.stringify(initialMod));
        if (user) saveCustomModules(user.uid, initialMod).catch(console.error);
      }
    };
    loadInitialData();
  }, [appKey, user]);

  const saveCourseName = (newName: string) => {
    setCourse2Name(newName);
    localStorage.setItem('course2_name', newName);
    if (user) saveGlobalSettings(user.uid, { course2Name: newName }).catch(console.error);
  };

  const addModule = () => {
    const newId = `custom_${Date.now()}`;
    const nextColor = COLORS[customModules.length % COLORS.length];
    const newMod = { id: newId, title: `Nuevo Módulo ${customModules.length + 1}`, color: nextColor, level: `Personalizado` };
    const updated = [...customModules, newMod];
    setCustomModules(updated);
    localStorage.setItem('custom_modules_list', JSON.stringify(updated));
    if (user) saveCustomModules(user.uid, updated).catch(console.error);
  };

  const deleteModule = (id: string, title: string) => {
    if (window.confirm(`¿Seguro que quieres borrar "${title}"?`)) {
      const updated = customModules.filter(m => m.id !== id);
      setCustomModules(updated);
      localStorage.setItem('custom_modules_list', JSON.stringify(updated));
      localStorage.removeItem(`words_${id}`);
      localStorage.removeItem(`stories_${id}`);
      localStorage.removeItem(`srs_${id}`);
      localStorage.removeItem(`settings_${id}`);
      if (user) {
        saveCustomModules(user.uid, updated).catch(console.error);
        deleteModuleData(user.uid, id).catch(console.error);
      }
    }
  };

  /**
   * EXPORTACIÓN ESPEJO (Snapshot Total)
   * Captura el 100% de las llaves del localStorage para un respaldo completo.
   */
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Evitamos llaves internas del entorno de ejecución si empiezan por '_'
        if (key && !key.startsWith('_')) {
          backupData[key] = localStorage.getItem(key) || "";
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `snapshot_ingles_completo_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error("Error al exportar sesión:", e);
    }
  };

  /**
   * PROCESAMIENTO DE ARCHIVO
   * Lee el JSON y genera el reporte para el modal antes de confirmar.
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (typeof data !== 'object' || data === null) throw new Error();

        const userStats = data['global_user_stats'] ? JSON.parse(data['global_user_stats']) : {};
        const modules = data['custom_modules_list'] ? JSON.parse(data['custom_modules_list']) : [];

        let hardCount = 0, listeningCount = 0, customWords = 0, totalReviewed = 0;

        Object.keys(data).forEach(key => {
          if (key.startsWith('srs_')) {
            try {
              const srs = JSON.parse(data[key]);
              Object.values(srs).forEach((item: any) => {
                totalReviewed++;
                if (item.difficulty === 'hard') hardCount++;
                if (item.listeningFocus) listeningCount++;
              });
            } catch (err) { }
          }
          if (key.startsWith('words_')) {
            try {
              const w = JSON.parse(data[key]);
              if (Array.isArray(w)) customWords += w.length;
            } catch (err) { }
          }
        });

        setPendingImport({
          data,
          stats: {
            level: userStats.level || 1,
            modules: modules.length,
            hardCount,
            listeningCount,
            customWords,
            totalReviewed
          }
        });
      } catch (err) {
        alert("El archivo no es un respaldo válido.");
      }
      setInputKey(Date.now());
    };
    reader.readAsText(file);
  };

  /**
   * RESTAURACIÓN ATÓMICA
   * Limpia llaves específicas y restaura el estado. Usa appKey para refrescar React.
   */
  const confirmRestore = () => {
    if (!pendingImport) return;
    try {
      // Limpieza selectiva de llaves de la aplicación únicamente
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('srs_') ||
          key.startsWith('words_') ||
          key.startsWith('stories_') ||
          key.startsWith('settings_') ||
          key.startsWith('deleted_ids_') ||
          ['global_user_stats', 'course2_name', 'custom_modules_list'].includes(key)
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Inyección masiva de los datos del snapshot
      Object.entries(pendingImport.data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });

      setPendingImport(null);
      setIsSuccess(true);

      // CAMBIO CLAVE: Refrescamos el estado de la App sin recargar la página del navegador
      setAppKey(prev => prev + 1);

    } catch (e) {
      alert("Error al restaurar los datos.");
    }
  };

  const progressToNext = (stats.xp / (stats.level * 500)) * 100;

  return (
    <div key={appKey} className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto pb-32 relative font-sans">

      {/* HEADER DE PROGRESO */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onOpenUserHub} className="flex items-center gap-2 active:scale-95 transition-transform bg-slate-50 p-1 pr-3 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-md">L{stats.level}</div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-lg">
                  <Flame size={10} fill="currentColor" />
                  <span className="text-[10px] font-black">{stats.streak}</span>
                </div>
                <span className="text-[10px] font-black text-slate-800 ml-1">Racha</span>
              </div>
              <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, progressToNext)}%` }}></div>
              </div>
            </div>
          </button>
          <button onClick={onOpenUserHub} className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-10 animate-in fade-in duration-500">
        {/* ACCESO TUTOR IA */}
        <button onClick={onOpenTutor} className="w-full h-24 p-5 bg-indigo-600 rounded-[2rem] shadow-xl flex items-center justify-between text-white group border-b-4 border-black/10 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center"><Wand2 size={22} /></div>
            <div className="text-left">
              <h3 className="font-black leading-tight">Tutor Maestro IA</h3>
              <p className="text-white/60 text-[9px] font-bold uppercase mt-0.5 tracking-widest">Soporte 24/7</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/30" />
        </button>

        {/* LISTA DE MÓDULOS BASE */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 px-1">Diccionarios Base</h2>
          <div className="grid grid-cols-1 gap-3">
            {MODULES_INFO.map(mod => (
              <ModuleButton key={mod.id} mod={mod} onSelect={onSelect} />
            ))}
          </div>
        </div>

        {/* LISTAS PERSONALIZADAS */}
        <div className="pt-4 space-y-4">
          <div className="px-1 flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-800">{course2Name}</h2>
            <button onClick={() => setIsEditingCourse(!isEditingCourse)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100"><Pencil size={12} /></button>
          </div>
          {isEditingCourse && (
            <input autoFocus className="text-lg font-black text-indigo-600 w-full bg-white border-2 border-indigo-100 rounded-2xl px-4 py-3 outline-none shadow-inner" value={course2Name} onChange={(e) => saveCourseName(e.target.value)} onBlur={() => setIsEditingCourse(false)} />
          )}
          <div className="grid grid-cols-1 gap-3">
            {customModules.map((mod) => (
              <div key={mod.id} className="relative group">
                <ModuleButton mod={{ ...mod, words: 0 }} onSelect={onSelect} />
                <button onClick={(e) => { e.stopPropagation(); deleteModule(mod.id, mod.title); }} className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
              </div>
            ))}
            <button onClick={addModule} className="w-full h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-[1.5rem] text-slate-400 font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"><Plus size={14} /> Añadir Lista</button>
          </div>
        </div>

        {/* SECCIÓN DE SNAPSHOT (GRABAR / IMPORTAR) */}
        <div className="pt-8 border-t border-slate-200">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Snapshot de Aplicación</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleExportBackup} className="py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-1 active:scale-95 transition-all hover:bg-slate-300 shadow-sm">
              <Download size={16} />
              <span>Grabar</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase flex flex-col items-center gap-1 active:scale-95 transition-all hover:bg-slate-300 shadow-sm">
              <Upload size={16} />
              <span>Importar</span>
            </button>
            <input key={inputKey} type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
          </div>
          <p className="text-[8px] text-slate-400 text-center mt-3 font-medium px-4">Esto guarda todo tu progreso, palabras difíciles y listas de escucha en un solo paso.</p>
        </div>
      </div>

      {/* MODAL DE REPORTE DE SNAPSHOT */}
      {pendingImport && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in border border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm"><FileCheck size={32} /></div>
              <h3 className="text-xl font-black text-slate-800">Snapshot Encontrado</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">¿Deseas restaurar esta sesión?</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 shadow-inner">
              <div className="text-center">
                <div className="text-xl font-black text-slate-700">{pendingImport.stats.level}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nivel</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-black text-slate-700">{pendingImport.stats.totalReviewed}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Repasadas</div>
              </div>
              <div className="text-center border-t border-slate-200 pt-3">
                <div className="text-lg font-black text-rose-500">{pendingImport.stats.hardCount}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Difíciles</div>
              </div>
              <div className="text-center border-t border-slate-200 pt-3">
                <div className="text-lg font-black text-indigo-500">{pendingImport.stats.listeningCount}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Escucha</div>
              </div>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl flex gap-3 items-start border border-rose-100 shadow-sm">
              <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-700 font-bold leading-tight">Aviso: El progreso actual se sobrescribirá por completo en este dispositivo.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingImport(null)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Cancelar</button>
              <button onClick={confirmRestore} className="flex-[1.5] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg uppercase active:scale-95 transition-transform tracking-widest">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA DE ÉXITO FINAL */}
      {isSuccess && (
        <div className="fixed inset-0 z-[110] bg-indigo-600 text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
            <CheckCircle2 size={64} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-4 leading-tight">¡Snapshot Aplicado!</h2>
          <p className="font-bold mb-8 opacity-90 text-sm leading-relaxed max-w-xs mx-auto">
            Tu racha, nivel y clasificación de tarjetas han sido actualizados con éxito.
          </p>
          <button onClick={() => setIsSuccess(false)} className="bg-white text-indigo-600 w-full max-w-xs py-5 rounded-[2rem] font-black shadow-2xl uppercase active:scale-95 transition-transform flex items-center justify-center gap-3 tracking-widest">
            <RotateCcw size={20} />
            Continuar Estudiando
          </button>
        </div>
      )}
    </div>
  );
};

const ModuleButton = ({ mod, onSelect }: any) => (
  <button onClick={() => onSelect(mod.id)} className={`w-full h-20 ${mod.color} text-white p-4 rounded-[1.8rem] shadow-md transition-all flex items-center justify-between group relative overflow-hidden border-b-4 border-black/10 hover:translate-y-[-2px] active:scale-[0.98]`}>
    <div className="flex items-center gap-4 relative z-10">
      <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-inner">{mod.id.includes('custom') ? '★' : mod.id.slice(-1)}</div>
      <div className="text-left"><h3 className="font-extrabold text-sm leading-tight">{mod.title}</h3><p className="text-white/60 text-[8px] font-black uppercase mt-0.5">{mod.level || 'Custom'}</p></div>
    </div>
    <ChevronRight size={16} className="opacity-30 group-hover:translate-x-1 transition-transform" />
  </button>
);

export default ModuleSelector;