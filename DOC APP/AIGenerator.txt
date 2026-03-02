
import React, { useState, useEffect } from 'react';
import { Word, SRSItem, GrammarExercise } from '../types';
import { GeminiService } from '../services/geminiService';
import { Icon } from '../constants';

interface Props {
  words: Word[];
  srsData: Record<string, SRSItem>;
  onBack: () => void;
}

const AIGenerator: React.FC<Props> = ({ words, srsData, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<GrammarExercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const gemini = new GeminiService();

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => 
      (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira')) && 
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
  };

  const generateNewSet = async () => {
    setLoading(true);
    const hardWords = words.filter(w => srsData[w.id]?.difficulty === 'hard');
    const sourceList = hardWords.length > 0 ? hardWords : words;
    const randomWord = sourceList[Math.floor(Math.random() * sourceList.length)];

    // Fix: Replaced non-existent generateGrammarExercise with generateGrammarDrill and mapped results
    const result = await gemini.generateGrammarDrill(`Uso de la palabra "${randomWord.en}"`, [randomWord.en]);
    if (result && result.drills) {
      const formatted: GrammarExercise[] = result.drills.map((d: any) => ({
        base: d.baseSentence,
        positive: d.affirmative,
        negative: d.negative,
        interrogative: d.interrogative,
        shortAnswer: d.shortAnswer,
        longAnswer: d.longAnswer,
        tense: "Práctica"
      }));
      setExercises(formatted);
      setCurrentIdx(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    generateNewSet();
    window.speechSynthesis.getVoices();
  }, []);

  const current = exercises[currentIdx];

  const playTTS = (text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.voice = getFemaleVoice();
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-500">
       <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0">
          <button onClick={onBack} className="text-slate-500"><Icon name="arrow-left" /></button>
          <span className="font-black text-xs text-indigo-500 uppercase tracking-widest">Generador de Gramática</span>
          <button onClick={generateNewSet} disabled={loading} className="text-indigo-600"><Icon name="rotate" className={loading ? 'animate-spin' : ''}/></button>
       </div>
       <div className="flex-1 p-6 flex flex-col items-center justify-center">
          {loading ? (
            <div className="text-center"><div className="w-16 h-16 ai-gradient rounded-full flex items-center justify-center text-white mb-4 mx-auto animate-pulse ai-glow"><Icon name="sparkles" className="text-2xl" /></div><p className="text-slate-500 font-bold">Invocando Inteligencia Artificial...</p></div>
          ) : current ? (
            <div className="w-full space-y-6 animate-in zoom-in">
              <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl ai-glow"><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tiempo Gramatical: {current.tense}</span><h3 className="text-2xl font-black mt-2 leading-tight">{current.base}</h3></div>
              <div className="space-y-3">
                 <ExercisePart label="Positivo" text={current.positive} onPlay={playTTS} />
                 <ExercisePart label="Negativo" text={current.negative} onPlay={playTTS} />
                 <ExercisePart label="Interrogativo" text={current.interrogative} onPlay={playTTS} />
                 <ExercisePart label="Resp. Corta" text={current.shortAnswer} onPlay={playTTS} />
                 <ExercisePart label="Resp. Larga" text={current.longAnswer} onPlay={playTTS} />
              </div>
              <div className="flex gap-3 pt-6"><button onClick={() => setCurrentIdx((i) => Math.max(0, i-1))} disabled={currentIdx === 0} className="flex-1 bg-white border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-400 disabled:opacity-30">Anterior</button><button onClick={() => { if (currentIdx < exercises.length - 1) setCurrentIdx(i => i + 1); else generateNewSet(); }} className="flex-1 ai-gradient text-white p-4 rounded-2xl font-black shadow-lg">{currentIdx < exercises.length - 1 ? 'Siguiente' : 'Nuevo Ejercicio'}</button></div>
            </div>
          ) : (<p>Error al cargar. Reintenta.</p>)}
       </div>
    </div>
  );
};

const ExercisePart = ({ label, text, onPlay }: any) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group">
     <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{label}</span><button onClick={() => onPlay(text)} className="text-slate-300 group-hover:text-indigo-500 transition-colors"><Icon name="volume-high" className="text-xs"/></button></div>
     <p className="text-slate-800 font-bold">{text}</p>
  </div>
);

export default AIGenerator;
