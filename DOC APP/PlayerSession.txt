
import React, { useState, useEffect, useRef } from 'react';
import { Word, SRSItem } from '../types';
import { Icon } from '../constants';

interface Props {
  words: Word[];
  srsData: Record<string, SRSItem>;
  onUpdateSRS: (wordId: string, difficulty: SRSItem['difficulty']) => void;
  onToggleListeningFocus: (wordId: string) => void;
  onBack: () => void;
}

const PlayerSession: React.FC<Props> = ({ words, srsData, onUpdateSRS, onToggleListeningFocus, onBack }) => {
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<'snail' | 'slow' | 'normal' | 'es' | 'idle'>('idle');
  const activeRef = useRef(false);

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => 
      (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira')) && 
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
  };

  const speak = (text: string, lang: string, rate: number) => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      if (lang.startsWith('en')) {
        u.voice = getFemaleVoice();
      }
      u.onend = () => resolve(true);
      u.onerror = () => resolve(true);
      window.speechSynthesis.speak(u);
    });
  };

  const runLoop = async (currentIndex: number) => {
    if (!activeRef.current) return;
    if (currentIndex >= words.length) {
      setIsPlaying(false);
      return;
    }

    const word = words[currentIndex];
    setIdx(currentIndex);

    // 1. Caracol (0.35)
    setPhase('snail');
    await speak(word.en, 'en-US', 0.35);
    if (!activeRef.current) return;
    await new Promise(r => setTimeout(r, 600));

    // 2. Lento (0.65)
    setPhase('slow');
    await speak(word.en, 'en-US', 0.65);
    if (!activeRef.current) return;
    await new Promise(r => setTimeout(r, 500));

    // 3. Normal (1.0)
    setPhase('normal');
    await speak(word.en, 'en-US', 1.0);
    if (!activeRef.current) return;
    await new Promise(r => setTimeout(r, 500));

    // 4. Español
    setPhase('es');
    await speak(word.es, 'es-ES', 1.0);
    if (!activeRef.current) return;
    await new Promise(r => setTimeout(r, 1200));

    if (activeRef.current) runLoop(currentIndex + 1);
  };

  const toggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      activeRef.current = false;
      window.speechSynthesis.cancel();
      setPhase('idle');
    } else {
      setIsPlaying(true);
      activeRef.current = true;
      runLoop(idx);
    }
  };

  const toggleHard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = words[idx];
    if (!current) return;
    const isHard = srsData[current.id]?.difficulty === 'hard';
    onUpdateSRS(current.id, isHard ? 'medium' : 'hard');
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = words[idx];
    if (!current) return;
    onToggleListeningFocus(current.id);
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => {
      activeRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  if (words.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white">
      <p className="text-slate-400 font-bold mb-4">No hay palabras disponibles para reproducir.</p>
      <button onClick={onBack} className="bg-indigo-600 px-8 py-3 rounded-full font-black">Volver</button>
    </div>
  );

  const current = words[idx];
  const isHard = srsData[current?.id]?.difficulty === 'hard';
  const isListeningFocus = srsData[current?.id]?.listeningFocus;

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white relative overflow-hidden">
      <div className={`absolute inset-0 transition-all duration-1000 ${phase === 'snail' ? 'bg-indigo-900/30' : phase === 'slow' ? 'bg-indigo-600/20' : phase === 'es' ? 'bg-emerald-600/20' : ''}`} />
      
      <div className="p-4 flex justify-between items-center z-10">
        <button onClick={onBack} className="text-slate-500 p-2 hover:text-white transition-colors"><Icon name="arrow-left" /></button>
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">{idx + 1} / {words.length}</span>
          
          <button 
            onClick={toggleListening} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListeningFocus ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-white/10 text-slate-500'}`}
            title="Marcar para Listening"
          >
            <Icon name="ear-listen" className={isListeningFocus ? "animate-pulse" : ""} />
          </button>

          <button 
            onClick={toggleHard} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isHard ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'bg-white/10 text-slate-500'}`}
            title={isHard ? "Quitar de difíciles" : "Marcar como difícil"}
          >
            <Icon name="circle-exclamation" className={isHard ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
        <div className={`w-48 h-48 rounded-[3rem] flex items-center justify-center text-8xl mb-8 shadow-2xl border transition-all overflow-hidden relative group ${isListeningFocus ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/10'}`}>
          {current.img.includes('data:') || current.img.includes('http') ? <img src={current.img} className="w-full h-full object-cover" /> : <span className="group-hover:scale-110 transition-transform">{current.img}</span>}
          <div className="absolute top-4 right-4 flex gap-2">
            {isHard && <div className="text-rose-500 text-xl drop-shadow-md"><Icon name="circle-exclamation" /></div>}
            {isListeningFocus && <div className="text-indigo-400 text-xl drop-shadow-md"><Icon name="ear-listen" /></div>}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-2">
           {phase === 'snail' && <span className="text-2xl animate-bounce">🐌</span>}
           {phase === 'slow' && <span className="text-2xl animate-bounce">🐢</span>}
           <h2 className={`text-6xl font-black transition-all ${phase === 'snail' ? 'text-indigo-500 scale-90 blur-[1px]' : phase === 'slow' ? 'text-indigo-400 scale-95' : 'text-white'}`}>{current.en}</h2>
        </div>
        <p className={`text-2xl font-serif italic mb-10 ${isListeningFocus ? 'text-indigo-300' : 'text-slate-500'}`}>/{current.pron}/</p>
        <h3 className={`text-4xl font-bold text-emerald-400 transition-all duration-700 ${phase === 'es' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>{current.es}</h3>
      </div>

      <div className="p-12 flex justify-center items-center gap-10 z-10">
        <button onClick={() => { setIsPlaying(false); activeRef.current = false; setIdx(i => Math.max(0, i-1)); }} className="text-slate-600 hover:text-white transition-colors p-2"><Icon name="backward-step" className="text-2xl" /></button>
        <button onClick={toggle} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-rose-500 scale-110' : 'bg-indigo-500 ai-glow'}`}>
          <Icon name={isPlaying ? "pause" : "play"} className="text-2xl" />
        </button>
        <button onClick={() => { setIsPlaying(false); activeRef.current = false; setIdx(i => (i + 1) % words.length); }} className="text-slate-600 hover:text-white transition-colors p-2"><Icon name="forward-step" className="text-2xl" /></button>
      </div>
    </div>
  );
};

export default PlayerSession;
