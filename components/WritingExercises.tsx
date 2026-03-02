
import React, { useState, useEffect, useRef } from 'react';
import { Word, SRSItem } from '../types';
import { Icon } from '../constants';

interface Props {
  words: Word[];
  srsData: Record<string, SRSItem>;
  onUpdateSRS: (wordId: string, difficulty: SRSItem['difficulty']) => void;
  onBack: () => void;
}

type ExType = 'en_to_es' | 'es_to_en' | 'dictation';

const WritingExercises: React.FC<Props> = ({ words, srsData, onUpdateSRS, onBack }) => {
  const [mode, setMode] = useState<'all' | 'hard'>('all');
  const [type, setType] = useState<ExType | null>(null);
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const inputRef = useRef<HTMLInputElement>(null);

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => 
      (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira')) && 
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
  };

  const startSession = (selectedType: ExType) => {
    let list = mode === 'hard' 
      ? words.filter(w => srsData[w.id]?.difficulty === 'hard') 
      : [...words];
    
    if (list.length === 0) {
      alert("No hay palabras en esta categoría.");
      return;
    }

    setQueue(list.sort(() => Math.random() - 0.5));
    setType(selectedType);
    setCurrentIdx(0);
    setStats({ correct: 0, total: 0 });
    setFeedback(null);
    setInput('');
  };

  const playWord = () => {
    if (!queue[currentIdx]) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(queue[currentIdx].en);
    u.lang = "en-US";
    u.voice = getFemaleVoice();
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (type === 'dictation' && queue[currentIdx] && !feedback) {
      playWord();
    }
    if (type && inputRef.current) inputRef.current.focus();
  }, [type, currentIdx, feedback]);

  const checkAnswer = () => {
    const word = queue[currentIdx];
    const target = type === 'en_to_es' ? word.es : word.en;
    const isCorrect = input.trim().toLowerCase() === target.toLowerCase();
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setStats(prev => ({ 
      total: prev.total + 1, 
      correct: prev.correct + (isCorrect ? 1 : 0) 
    }));
    onUpdateSRS(word.id, isCorrect ? 'easy' : 'hard');
  };

  const nextWord = () => {
    if (currentIdx < queue.length - 1) {
      setCurrentIdx(i => i + 1);
      setInput('');
      setFeedback(null);
    } else {
      setType(null);
    }
  };

  if (!type) {
    return (
      <div className="p-6 space-y-6 animate-in fade-in">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-slate-500"><Icon name="arrow-left" /></button>
          <h2 className="text-2xl font-black text-slate-800">Ejercicios de Escritura</h2>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex gap-2">
          <button onClick={() => setMode('all')} className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${mode === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Todo</button>
          <button onClick={() => setMode('hard')} className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${mode === 'hard' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Difíciles</button>
        </div>
        <div className="space-y-4">
          <ExerciseCard title="Traducir a Español" desc="Ver Inglés → Escribir Español" color="bg-blue-600" icon="language" onClick={() => startSession('en_to_es')} />
          <ExerciseCard title="Traducir a Inglés" desc="Ver Español → Escribir Inglés" color="bg-emerald-600" icon="pen-to-square" onClick={() => startSession('es_to_en')} />
          <ExerciseCard title="Dictado" desc="Escuchar → Escribir Inglés" color="bg-purple-600" icon="headphones" onClick={() => startSession('dictation')} />
        </div>
      </div>
    );
  }

  const current = queue[currentIdx];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b flex items-center justify-between"><button onClick={() => setType(null)} className="text-slate-400"><Icon name="xmark" /></button><span className="font-black text-xs text-slate-400 uppercase tracking-widest">{currentIdx + 1} / {queue.length}</span><div className="text-indigo-600 font-black text-sm">{stats.correct} pts</div></div>
      <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-12">
          {type === 'dictation' ? (
            <button onClick={playWord} className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"><Icon name="volume-high" className="text-4xl" /></button>
          ) : (
            <>
              <div className="text-6xl mb-4">{current.img.includes('http') || current.img.includes('data:') ? <img src={current.img} className="w-24 h-24 mx-auto object-contain" /> : current.img}</div>
              <h3 className="text-4xl font-black text-slate-800">{type === 'en_to_es' ? current.en : current.es}</h3>
              {type === 'en_to_es' && <p className="text-slate-400 font-mono mt-2 italic">/{current.pron}/</p>}
            </>
          )}
        </div>
        <div className="w-full space-y-4">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} disabled={feedback !== null} onKeyDown={e => e.key === 'Enter' && (feedback ? nextWord() : checkAnswer())} placeholder={type === 'en_to_es' ? "Traducción..." : "Escribe en inglés..."} className={`w-full p-5 text-center text-xl font-bold rounded-3xl border-2 transition-all outline-none ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : feedback === 'incorrect' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 bg-white focus:border-indigo-400'}`} />
          {feedback && (<div className={`p-4 rounded-2xl text-center animate-in zoom-in ${feedback === 'correct' ? 'text-emerald-600' : 'text-rose-600'}`}><p className="font-black text-sm uppercase tracking-widest mb-1">{feedback === 'correct' ? '¡Excelente!' : 'Respuesta Correcta:'}</p><p className="text-2xl font-black">{type === 'en_to_es' ? current.es : current.en}</p></div>)}
        </div>
      </div>
      <div className="p-6 pb-12"><button onClick={feedback ? nextWord : checkAnswer} className={`w-full py-5 rounded-[2rem] font-black shadow-xl transition-all active:scale-95 ${feedback === 'correct' ? 'bg-emerald-600 text-white' : feedback === 'incorrect' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'}`}>{feedback ? 'Siguiente' : 'Comprobar'}</button></div>
    </div>
  );
};

const ExerciseCard = ({ title, desc, color, icon, onClick }: any) => (
  <button onClick={onClick} className={`${color} w-full p-4 rounded-3xl text-white flex items-center gap-4 shadow-lg hover:translate-y-[-2px] transition-all group overflow-hidden relative`}><div className="p-3 bg-white/20 rounded-2xl"><Icon name={icon} className="text-xl" /></div><div className="text-left"><h4 className="font-black text-lg leading-none mb-1">{title}</h4><p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">{desc}</p></div><div className="absolute top-0 right-0 w-12 h-full bg-white/5 skew-x-[-20deg] translate-x-4"></div></button>
);

export default WritingExercises;
