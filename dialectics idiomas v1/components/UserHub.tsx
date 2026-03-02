
import React, { useState, useEffect } from 'react';
import { Icon } from '../constants';
import { UserStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { saveUserStats, getUserStats } from '../services/firestoreService';

interface Props {
   onBack: () => void;
}

const UserHub: React.FC<Props> = ({ onBack }) => {
   const { user, logout } = useAuth();
   const [stats, setStats] = useState<UserStats>({
      xp: 0, level: 1, wordsLearned: 0, lessonsCompleted: 0, streak: 1, lastVisit: Date.now(),
      dailyWordsGoal: 10, dailyLessonsGoal: 2, history: {}
   });

   useEffect(() => {
      const loadStats = async () => {
         if (user) {
            try {
               const cloudStats = await getUserStats(user.uid);
               if (cloudStats) {
                  setStats(cloudStats);
                  localStorage.setItem('global_user_stats', JSON.stringify(cloudStats));
                  return;
               }
            } catch (e) {
               console.warn('Firestore stats load failed:', e);
            }
         }
         const saved = localStorage.getItem('global_user_stats');
         if (saved) setStats(JSON.parse(saved));
      };
      loadStats();
   }, [user]);

   const updateGoal = (key: 'dailyWordsGoal' | 'dailyLessonsGoal', val: number) => {
      const newStats = { ...stats, [key]: Math.max(1, val) };
      setStats(newStats);
      localStorage.setItem('global_user_stats', JSON.stringify(newStats));
      if (user) saveUserStats(user.uid, newStats).catch(console.error);
   };

   const renderCalendar = () => {
      const days = [];
      const now = new Date();
      // 4 weeks view
      for (let i = 27; i >= 0; i--) {
         const d = new Date(now);
         d.setDate(d.getDate() - i);
         const dateStr = d.toISOString().split('T')[0];
         const activity = stats.history[dateStr];

         let color = "bg-slate-100";
         let label = "";
         if (activity) {
            const total = activity.words + activity.lessons;
            if (total > 0) color = "bg-indigo-200";
            if (activity.words >= stats.dailyWordsGoal && activity.lessons >= stats.dailyLessonsGoal) {
               color = "bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.4)]";
               label = "🔥";
            }
         }

         days.push(
            <div key={dateStr} className={`aspect-square rounded-[4px] ${color} transition-all flex items-center justify-center text-[8px]`} title={`${dateStr}: ${activity?.xp || 0} XP`}>
               {label}
            </div>
         );
      }
      return days;
   };

   const todayStr = new Date().toISOString().split('T')[0];
   const today = stats.history[todayStr] || { words: 0, lessons: 0, xp: 0 };

   return (
      <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto animate-in slide-in-from-bottom duration-500 overflow-hidden">
         <div className="p-4 bg-white border-b flex items-center justify-between shrink-0">
            <button onClick={onBack} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full"><Icon name="arrow-left" /></button>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Perfil de Estudiante</h2>
            <div className="w-10"></div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">

            {/* USER LEVEL CARD */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
               <div className="relative shrink-0">
                  <div className="w-20 h-20 ai-gradient rounded-3xl flex flex-col items-center justify-center text-white shadow-xl ai-glow">
                     <span className="text-[10px] font-black uppercase opacity-60">Lvl</span>
                     <span className="text-3xl font-black">{stats.level}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 text-white rounded-xl border-4 border-white flex items-center justify-center shadow-lg">
                     <Icon name="fire" className="text-[10px]" />
                  </div>
               </div>
               <div className="text-left">
                  <h3 className="text-xl font-black text-slate-800 leading-tight">Racha de {stats.streak} días</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Nivel {stats.level} • {stats.xp} XP Totales</p>
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                     <div className="h-full ai-gradient" style={{ width: `${(stats.xp % 500) / 5}%` }}></div>
                  </div>
               </div>
            </div>

            {/* ACTIVITY HEATMAP */}
            <div className="space-y-3">
               <div className="flex justify-between items-center px-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendario de Actividad</h4>
                  <span className="text-[9px] font-bold text-indigo-500">Últimos 28 días</span>
               </div>
               <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="grid grid-cols-7 gap-2">
                     {renderCalendar()}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                     <span>Menos</span>
                     <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-100 rounded-[2px]" />
                        <div className="w-2 h-2 bg-indigo-200 rounded-[2px]" />
                        <div className="w-2 h-2 bg-indigo-600 rounded-[2px]" />
                     </div>
                     <span>Más</span>
                  </div>
               </div>
            </div>

            {/* GOAL CONFIGURATION */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metas Diarias</h4>
               <GoalEditor
                  icon="book"
                  label="Palabras nuevas"
                  current={today.words}
                  goal={stats.dailyWordsGoal}
                  color="bg-emerald-500"
                  onUpdate={(v) => updateGoal('dailyWordsGoal', v)}
               />
               <GoalEditor
                  icon="brain"
                  label="Lecciones completas"
                  current={today.lessons}
                  goal={stats.dailyLessonsGoal}
                  color="bg-indigo-600"
                  onUpdate={(v) => updateGoal('dailyLessonsGoal', v)}
               />
            </div>

            {/* LIFETIME STATS */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3"><Icon name="medal" /></div>
                  <span className="block text-2xl font-black text-slate-800">{stats.wordsLearned}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Palabras Aprendidas</span>
               </div>
               <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3"><Icon name="graduation-cap" /></div>
                  <span className="block text-2xl font-black text-slate-800">{stats.lessonsCompleted}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lecciones Totales</span>
               </div>
            </div>

            {/* USER ACCOUNT */}
            {user && (
               <div className="space-y-3 pb-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cuenta</h4>
                  <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                           <Icon name="user" />
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-800">{user.displayName || 'Estudiante'}</p>
                           <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                        </div>
                     </div>
                     <button
                        onClick={async () => { await logout(); onBack(); }}
                        className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 active:scale-[0.98] transition-all border border-rose-100"
                     >
                        <Icon name="right-from-bracket" className="mr-2" />
                        Cerrar Sesión
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

const GoalEditor = ({ icon, label, current, goal, color, onUpdate }: any) => (
   <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${color} text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-indigo-100`}><Icon name={icon} /></div>
            <div className="text-left">
               <h5 className="text-xs font-black text-slate-800 leading-none">{label}</h5>
               <p className="text-[10px] text-slate-400 font-bold mt-1.5">{current} / {goal} completadas hoy</p>
            </div>
         </div>
         <div className="flex items-center bg-slate-50 rounded-xl p-1 gap-1 border border-slate-100">
            <button onClick={() => onUpdate(goal - 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><Icon name="minus" className="text-[10px]" /></button>
            <span className="w-6 text-center text-xs font-black text-slate-700">{goal}</span>
            <button onClick={() => onUpdate(goal + 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><Icon name="plus" className="text-[10px]" /></button>
         </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
         <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, (current / goal) * 100)}%` }}></div>
      </div>
   </div>
);

export default UserHub;
