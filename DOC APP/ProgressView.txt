
import React, { useState } from 'react';
import { Word, SRSItem } from '../types';
import { Icon } from '../constants';

interface Props {
  words: Word[];
  srsData: Record<string, SRSItem>;
  onUpdateSRS: (wordId: string, difficulty: SRSItem['difficulty']) => void;
  onBack: () => void;
}

const ProgressView: React.FC<Props> = ({ words, srsData, onUpdateSRS, onBack }) => {
  const [activeTab, setActiveTab] = useState<SRSItem['difficulty']>('hard');

  const wordsByDifficulty = words.filter(w => (srsData[w.id]?.difficulty || 'new') === activeTab);
  const counts = {
    hard: words.filter(w => srsData[w.id]?.difficulty === 'hard').length,
    medium: words.filter(w => srsData[w.id]?.difficulty === 'medium').length,
    easy: words.filter(w => srsData[w.id]?.difficulty === 'easy').length,
    new: words.filter(w => !srsData[w.id] || srsData[w.id]?.difficulty === 'new').length,
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
      <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-500 p-1"><Icon name="arrow-left" /></button>
          <h2 className="text-xl font-black text-slate-800">Mi Progreso</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4">
        <TabButton label="Difícil" count={counts.hard} active={activeTab === 'hard'} color="red" onClick={() => setActiveTab('hard')} />
        <TabButton label="Bien" count={counts.medium} active={activeTab === 'medium'} color="yellow" onClick={() => setActiveTab('medium')} />
        <TabButton label="Fácil" count={counts.easy} active={activeTab === 'easy'} color="green" onClick={() => setActiveTab('easy')} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Lista: {activeTab === 'hard' ? 'Difíciles' : activeTab === 'medium' ? 'Intermedias' : 'Aprendidas'}</h4>
        {wordsByDifficulty.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
             <div className="text-4xl mb-2 opacity-30">📂</div>
             <p className="text-slate-400 font-bold text-sm">No hay palabras en esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wordsByDifficulty.map(w => (
              <div key={w.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform active:scale-[0.98]">
                 <div className="text-2xl w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                    {w.img.includes('data:') ? <img src={w.img} className="w-full h-full object-cover rounded-2xl" /> : w.img}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-800 truncate">{w.en}</h5>
                    <p className="text-xs text-indigo-500 font-medium truncate">{w.es}</p>
                 </div>
                 <div className="flex gap-1">
                   <MiniMoveBtn label="D" active={activeTab === 'hard'} onClick={() => onUpdateSRS(w.id, 'hard')} color="bg-rose-500" />
                   <MiniMoveBtn label="B" active={activeTab === 'medium'} onClick={() => onUpdateSRS(w.id, 'medium')} color="bg-amber-500" />
                   <MiniMoveBtn label="F" active={activeTab === 'easy'} onClick={() => onUpdateSRS(w.id, 'easy')} color="bg-emerald-500" />
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ label, count, active, color, onClick }: any) => {
  const colors: any = {
    red: active ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-rose-600 border border-rose-100',
    yellow: active ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-600 border border-amber-100',
    green: active ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-600 border border-emerald-100',
  };
  return (
    <button onClick={onClick} className={`${colors[color]} p-4 rounded-3xl transition-all flex flex-col items-center justify-center`}>
      <span className="text-xl font-black">{count}</span>
      <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
    </button>
  );
};

const MiniMoveBtn = ({ label, active, onClick, color }: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-7 h-7 rounded-full text-[10px] font-black transition-all border ${active ? color + ' text-white border-transparent' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
  >
    {label}
  </button>
);

export default ProgressView;
