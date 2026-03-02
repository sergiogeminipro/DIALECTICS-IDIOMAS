
import React, { useState } from 'react';
import { Icon } from '../constants';
import { ViewState, Word, SRSItem } from '../types';

interface Props {
  onNavigate: (view: ViewState) => void;
  hardCount: number;
  listeningCount: number;
  wordCount: number;
  words: Word[];
  srsData: Record<string, SRSItem>;
  selectedGroupId: number | null;
  onSelectGroup: (id: number | null) => void;
}

const HomeView: React.FC<Props> = ({ 
  onNavigate, 
  hardCount, 
  listeningCount,
  wordCount, 
  words, 
  srsData, 
  selectedGroupId, 
  onSelectGroup 
}) => {
  const [specialModal, setSpecialModal] = useState<{ type: 'player' | 'review', groupId?: number } | null>(null);

  const groupsCount = Math.ceil(words.length / 25);
  const groups = Array.from({ length: groupsCount }, (_, i) => {
    const groupWords = words.slice(i * 25, (i + 1) * 25);
    const completed = groupWords.filter(w => {
      const diff = srsData[w.id]?.difficulty;
      return diff === 'easy' || diff === 'medium';
    }).length;
    return {
      id: i,
      title: `Objetivo ${i + 1}`,
      progress: Math.round((completed / groupWords.length) * 100),
      range: `${i * 25 + 1} - ${Math.min((i + 1) * 25, words.length)}`
    };
  });

  const getHardCountInGroup = (groupId: number) => {
    const groupWords = words.slice(groupId * 25, (groupId + 1) * 25);
    return groupWords.filter(w => srsData[w.id]?.difficulty === 'hard').length;
  };

  const getListeningCountInGroup = (groupId: number) => {
    const groupWords = words.slice(groupId * 25, (groupId + 1) * 25);
    return groupWords.filter(w => srsData[w.id]?.listeningFocus).length;
  };

  const handleStartSpecial = (target: 'hard' | 'listening') => {
    if (!specialModal) return;
    const { type } = specialModal;
    setSpecialModal(null);

    if (type === 'player') {
      if (target === 'hard') {
        onNavigate(selectedGroupId !== null ? 'player_hard_group' : 'player_hard');
      } else {
        onNavigate('player_listening');
      }
    } else {
      if (target === 'hard') {
        onNavigate(selectedGroupId !== null ? 'flashcards_hard_group' : 'flashcards_hard');
      } else {
        onNavigate('flashcards_listening');
      }
    }
  };

  const renderSpecialModal = () => {
    if (!specialModal) return null;
    const isGlobal = selectedGroupId === null;
    const currentHard = isGlobal ? hardCount : getHardCountInGroup(selectedGroupId!);
    const currentListen = isGlobal ? listeningCount : getListeningCountInGroup(selectedGroupId!);

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 animate-in zoom-in duration-300 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-4">
              <Icon name={specialModal.type === 'player' ? "play" : "layer-group"} />
            </div>
            <h3 className="text-xl font-black text-slate-800">
              {specialModal.type === 'player' ? 'Modo Reproductor' : 'Modo Repaso'}
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">¿Qué lista deseas utilizar?</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => handleStartSpecial('hard')}
              disabled={currentHard === 0}
              className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 group ${currentHard > 0 ? 'border-rose-100 hover:border-rose-500 bg-rose-50/30' : 'opacity-40 grayscale'}`}
            >
              <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-lg shadow-lg">
                <Icon name="circle-exclamation" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-slate-800 text-sm">Palabras Difíciles</h4>
                <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">{currentHard} en la lista</p>
              </div>
            </button>
            <button 
              onClick={() => handleStartSpecial('listening')}
              disabled={currentListen === 0}
              className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 group ${currentListen > 0 ? 'border-indigo-100 hover:border-indigo-500 bg-indigo-50/30' : 'opacity-40 grayscale'}`}
            >
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-lg shadow-lg">
                <Icon name="ear-listen" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-slate-800 text-sm">Pronunciación</h4>
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{currentListen} marcadas</p>
              </div>
            </button>
          </div>
          <button onClick={() => setSpecialModal(null)} className="w-full mt-8 py-4 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  if (selectedGroupId !== null) {
    const groupHardCount = getHardCountInGroup(selectedGroupId);
    const groupListenCount = getListeningCountInGroup(selectedGroupId);
    const totalSpecial = groupHardCount + groupListenCount;
    
    return (
      <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300 pb-24">
        {renderSpecialModal()}
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-xl font-black text-slate-800">Estudiando Objetivo {selectedGroupId + 1}</h3>
           <button onClick={() => onSelectGroup(null)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Ver todos</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <MenuButton 
            icon="layer-group" title="Repaso del Grupo" desc="Tarjetas de este objetivo" 
            onClick={() => onNavigate('flashcards')} color="bg-blue-600"
          />
          <MenuButton 
            icon="circle-exclamation" title="Repaso Especial" desc={`${groupHardCount} difíciles • ${groupListenCount} escucha`} 
            onClick={() => setSpecialModal({ type: 'review', groupId: selectedGroupId })} color="bg-rose-600"
            badge={totalSpecial > 0 ? totalSpecial : undefined} disabled={totalSpecial === 0}
          />
          <MenuButton 
            icon="play" title="Reproductor del Grupo" desc="Audio Drill de este objetivo" 
            onClick={() => onNavigate('player')} color="bg-indigo-500"
          />
          <MenuButton 
            icon="play" title="Reproductor Especial" desc="Audio Drill de listas" 
            onClick={() => setSpecialModal({ type: 'player', groupId: selectedGroupId })} 
            color="bg-rose-600" disabled={totalSpecial === 0}
          />
          <MenuButton 
            icon="pen-to-square" title="Escritura" desc="Traducción y dictado" 
            onClick={() => onNavigate('exercises')} color="bg-emerald-600"
          />
        </div>
      </div>
    );
  }

  const totalGlobalSpecial = hardCount + listeningCount;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 pb-24">
      {renderSpecialModal()}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl mb-4 border-4 border-indigo-50">📚</div>
        <h2 className="text-xl font-black text-slate-900">Ruta de Aprendizaje</h2>
        <p className="text-slate-500 text-xs font-bold mt-1">{wordCount} Palabras en total</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivos de Módulo</h3>
        <div className="grid grid-cols-2 gap-3">
           {groups.map(g => (
             <button key={g.id} onClick={() => onSelectGroup(g.id)} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-left group hover:border-indigo-200 transition-all relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-black text-slate-800 text-sm">{g.title}</h4>
                  <p className="text-[9px] text-slate-400 font-bold mb-3">Palabras {g.range}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all" style={{ width: `${g.progress}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-indigo-600">{g.progress}%</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Icon name="check-circle" className="text-4xl" />
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modos Globales</h3>
        <div className="grid grid-cols-1 gap-3">
          <MenuButton 
            icon="layer-group" title="Repaso General" desc="Todas las palabras del módulo" 
            onClick={() => { onSelectGroup(null); onNavigate('flashcards'); }} color="bg-slate-800"
          />
          <MenuButton 
            icon="circle-exclamation" title="Repaso Especial" desc={`${hardCount} difíciles • ${listeningCount} escucha`} 
            onClick={() => setSpecialModal({ type: 'review' })} color="bg-rose-600"
            badge={totalGlobalSpecial > 0 ? totalGlobalSpecial : undefined} disabled={totalGlobalSpecial === 0}
          />
          <MenuButton 
            icon="play" title="Reproductor General" desc="Escucha todo el módulo" 
            onClick={() => onNavigate('player_all')} color="bg-indigo-500"
          />
          <MenuButton 
            icon="play" title="Reproductor Especial" desc="Elige: Difíciles o Pronunciación" 
            onClick={() => setSpecialModal({ type: 'player' })} color="bg-rose-600"
            disabled={totalGlobalSpecial === 0}
          />
          <MenuButton 
            icon="book-open" title="Historias" desc="Lectura inmersiva con contexto" 
            onClick={() => onNavigate('stories')} color="bg-amber-600"
          />
        </div>
      </div>
    </div>
  );
};

const MenuButton = ({ icon, title, desc, onClick, color, badge, disabled }: any) => (
  <button 
    onClick={disabled ? undefined : onClick}
    className={`${disabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : color + ' text-white shadow-lg hover:translate-y-[-2px] active:scale-95'} p-4 rounded-3xl transition-all flex items-center gap-4 group relative overflow-hidden`}
  >
    <div className={`${disabled ? 'bg-slate-300/50' : 'bg-white/20'} p-2.5 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>
      <Icon name={icon} className="text-lg" />
    </div>
    <div className="text-left flex-1">
      <div className="flex items-center gap-2">
        <h3 className="font-extrabold text-sm leading-tight">{title}</h3>
        {badge && <span className="bg-white text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse">{badge}</span>}
      </div>
      <p className={`text-[9px] ${disabled ? 'text-slate-400' : 'text-white/70'} font-medium uppercase tracking-wider`}>{desc}</p>
    </div>
    {!disabled && <Icon name="chevron-right" className="text-xs opacity-40 group-hover:opacity-100 transition-opacity" />}
  </button>
);

export default HomeView;
