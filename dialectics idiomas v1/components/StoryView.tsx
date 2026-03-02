
import React, { useState, useEffect, useRef } from 'react';
import { Word, Story } from '../types';
import { GeminiService } from '../services/geminiService';
import { Icon } from '../constants';

interface Props {
  words: Word[];
  stories: Story[];
  onSaveStory: (story: Story) => void;
  onBack: () => void;
  gemini: GeminiService;
}

type SpeedMode = 'normal' | 'slow' | 'snail';

const StoryView: React.FC<Props> = ({ words, stories, onSaveStory, onBack, gemini }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'list' | 'reader' | 'practice'>('list');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTheme, setCustomTheme] = useState('');

  const [showPron, setShowPron] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [speed, setSpeed] = useState<SpeedMode>('normal');
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  // Live API States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const synthRef = useRef(window.speechSynthesis);

  // Helper functions for Live API
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startLiveCoach = async () => {
    alert("La función de Tutor en Vivo (Audio) requiere un SDK experimental que está desactivado por ahora para garantizar la estabilidad del generador de texto.");
  };

  const stopLiveCoach = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    setIsLiveActive(false);
    setIsLiveConnected(false);
  };

  const getFemaleVoice = () => {
    const voices = synthRef.current.getVoices();
    return voices.find(v =>
      (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Monica')) &&
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
  };

  const activeStory = activeIdx !== null ? stories[activeIdx] : null;
  const sentences = activeStory ? activeStory.text.match(/[^.!?]+[.!?]+/g) || [activeStory.text] : [];

  const playSentence = (index: number, autoAdvance: boolean = false) => {
    if (!activeStory || index >= sentences.length) {
      setIsPlaying(false);
      setCurrentSentenceIdx(-1);
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
    utterance.lang = 'en-US';
    utterance.voice = getFemaleVoice();
    utterance.rate = speed === 'snail' ? 0.35 : speed === 'slow' ? 0.65 : 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentSentenceIdx(index);
    };

    utterance.onend = () => {
      if (autoAdvance && index < sentences.length - 1) {
        playSentence(index + 1, true);
      } else {
        setIsPlaying(false);
        if (!autoAdvance && mode !== 'practice') setCurrentSentenceIdx(-1);
      }
    };

    utterance.onerror = () => setIsPlaying(false);
    synthRef.current.speak(utterance);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      const startFrom = currentSentenceIdx === -1 ? 0 : currentSentenceIdx;
      playSentence(startFrom, mode === 'reader');
    }
  };

  const handleWordClick = (wordStr: string) => {
    const wordData = getWordData(wordStr);
    if (wordData) {
      setSelectedWord(wordData);
      playSingleWord(wordData.en);
    } else {
      playSingleWord(wordStr);
    }
  };

  const playSingleWord = (word: string) => {
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.voice = getFemaleVoice();
    u.rate = speed === 'snail' ? 0.35 : speed === 'slow' ? 0.65 : 1.0;
    synthRef.current.speak(u);
  };

  const getWordData = (wordStr: string) => {
    const clean = wordStr.toLowerCase().replace(/[^a-z]/g, '');
    return words.find(w => w.en.toLowerCase() === clean);
  };

  const handleCreateCustomStory = async () => {
    if (!customTheme.trim()) return;
    setIsGenerating(true);
    try {
      // Use up to 7 random words from the current module to include in the story
      const randomWords = words.length > 0
        ? [...words].sort(() => 0.5 - Math.random()).slice(0, 7).map(w => w.en)
        : [];

      const result = await gemini.generateStory(randomWords, customTheme);

      if (result && result.title && result.text) {
        const newStory: Story = {
          id: `story_${Date.now()}`,
          title: result.title,
          text: result.text,
          translation: result.translation || "Traducción no disponible.",
          pronunciation: result.pronunciation || "Pronunciación no disponible."
        };

        onSaveStory(newStory);
        setShowCustomModal(false);
        setCustomTheme('');
        // Set active index to the end of the array (where the new story will be)
        setActiveIdx(stories.length);
        setMode('reader');
      } else {
        alert("No se pudo generar la historia. La IA no devolvió un resultado válido.");
      }
    } catch (error) {
      console.error("Error creating custom story:", error);
      alert(`Ocurrió un error al conectar con la IA: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    synthRef.current.getVoices();
    return () => {
      synthRef.current.cancel();
      stopLiveCoach();
    };
  }, []);

  if (mode === 'practice' && activeStory) {
    return (
      <div className="flex flex-col h-full bg-slate-900 animate-in slide-in-from-right duration-300 overflow-hidden">
        <div className="p-4 bg-slate-800 border-b border-white/5 flex justify-between items-center h-14 shrink-0">
          <button onClick={() => { stopLiveCoach(); setMode('reader'); }} className="text-white/40 p-2"><Icon name="arrow-left" /></button>
          <div className="text-center">
            <h3 className="font-black text-white text-xs uppercase tracking-widest">Maestro Nativo Live</h3>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{isLiveConnected ? 'Instruyendo en Español' : 'Sin Conexión'}</span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
          <div className="w-full space-y-8">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Leyendo ahora:</span>
              <h2 className="text-3xl font-black text-white leading-tight">{activeStory.title}</h2>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                <div className="h-full bg-indigo-500 transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${((currentSentenceIdx === -1 ? 0 : currentSentenceIdx) + 1) / sentences.length * 100}%` }}></div>
              </div>
              <p className="text-xl font-bold text-white/90 leading-relaxed text-center">
                {sentences[currentSentenceIdx === -1 ? 0 : currentSentenceIdx]}
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => playSentence(currentSentenceIdx === -1 ? 0 : currentSentenceIdx)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"><Icon name="volume-high" /></button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10">
            <div className="flex items-end gap-1.5 h-12">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`w-1 bg-indigo-500 rounded-full transition-all duration-150 ${isLiveConnected ? 'animate-bounce' : 'h-2 opacity-20'}`} style={{ height: isLiveConnected ? `${40 + Math.random() * 60}%` : '8px', animationDelay: `${i * 0.05}s` }}></div>
              ))}
            </div>

            {!isLiveActive ? (
              <button onClick={startLiveCoach} className="px-12 py-5 ai-gradient text-white rounded-full font-black shadow-2xl ai-glow flex items-center gap-4 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                <Icon name="microphone" className="text-xl" /> Iniciar Clase de Pronunciación
              </button>
            ) : (
              <button onClick={stopLiveCoach} className="px-12 py-5 bg-rose-500 text-white rounded-full font-black shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">
                <Icon name="phone-slash" className="text-xl" /> Finalizar Clase
              </button>
            )}

            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] text-center px-6">
              {isLiveConnected ? 'Escuchando tu pronunciación... Lee en voz alta' : 'Presiona el botón para conectar con el maestro'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-800 border-t border-white/5 flex gap-4">
          <button onClick={() => { if (currentSentenceIdx > 0) setCurrentSentenceIdx(currentSentenceIdx - 1); }} className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl font-black text-xs uppercase">Anterior</button>
          <button onClick={() => { if (currentSentenceIdx < sentences.length - 1) setCurrentSentenceIdx((currentSentenceIdx === -1 ? 0 : currentSentenceIdx) + 1); else setMode('reader'); }} className="flex-[2] py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase">Siguiente Frase</button>
        </div>
      </div>
    );
  }

  if (mode === 'reader' && activeStory) {
    return (
      <div className="flex flex-col h-full bg-[#fdfbf7] animate-in fade-in duration-300 relative">
        <div className="flex items-center justify-between p-4 bg-[#fcf9f0] border-b border-amber-100/50 sticky top-0 z-50 h-14">
          <button onClick={() => { synthRef.current.cancel(); setMode('list'); }} className="text-amber-900/60 hover:text-amber-800 transition-colors p-2">
            <Icon name="arrow-left" className="text-lg" />
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => { if (activeIdx! > 0) { synthRef.current.cancel(); setActiveIdx(activeIdx! - 1); setCurrentSentenceIdx(-1); setIsPlaying(false); setSelectedWord(null); } }} className="text-amber-900/30 hover:text-amber-600 transition-colors">
              <Icon name="chevron-left" className="text-xs" />
            </button>
            <span className="font-bold text-amber-950/80 text-sm">{activeIdx! + 1} / {stories.length}</span>
            <button onClick={() => { if (activeIdx! < stories.length - 1) { synthRef.current.cancel(); setActiveIdx(activeIdx! + 1); setCurrentSentenceIdx(-1); setIsPlaying(false); setSelectedWord(null); } }} className="text-amber-900/30 hover:text-amber-600 transition-colors">
              <Icon name="chevron-right" className="text-xs" />
            </button>
          </div>
          <button onClick={() => { setMode('practice'); setCurrentSentenceIdx(0); }} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition-colors" title="Practicar Pronunciación">
            <Icon name="microphone-lines" className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth hide-scrollbar pb-48">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{activeStory.title}</h2>
          <div className="leading-[3.2rem] text-slate-700">
            {sentences.map((sentence, sIdx) => (
              <span key={sIdx} className={`inline transition-all duration-300 px-1 py-1 ${currentSentenceIdx === sIdx ? 'sentence-active' : ''}`}>
                {sentence.split(' ').map((wordStr, wIdx) => {
                  const wordData = getWordData(wordStr);
                  return (
                    <div key={wIdx} className="word-unit" onClick={(e) => { e.stopPropagation(); handleWordClick(wordStr); }}>
                      <span className={`word-text ${wordData ? 'border-b border-slate-200 cursor-pointer hover:text-indigo-600' : ''}`}>{wordStr}</span>
                      {showPron && wordData && (
                        <>
                          <div className="word-divider"></div>
                          <span className="word-pron">{wordData.pron}</span>
                        </>
                      )}
                    </div>
                  );
                })}
                {" "}
              </span>
            ))}
          </div>
          {showTrans && (
            <div className="mt-8 bg-white/40 p-5 rounded-2xl border border-amber-100/50 italic text-slate-500 text-sm leading-relaxed">
              {activeStory.translation}
            </div>
          )}
        </div>

        {selectedWord && (
          <div className="absolute bottom-36 left-4 right-4 z-[60] animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.1)] p-4 border border-slate-100 flex items-center gap-4 relative">
              <button onClick={() => setSelectedWord(null)} className="absolute -top-2 -right-2 w-7 h-7 bg-white shadow-md border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"><Icon name="xmark" className="text-xs" /></button>
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                {selectedWord.img.includes('http') || selectedWord.img.includes('data:') ? <img src={selectedWord.img} className="w-full h-full object-cover" /> : selectedWord.img}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-slate-800 leading-tight">{selectedWord.en}</h4>
                <p className="text-[10px] font-mono text-slate-400 italic">/{selectedWord.pron}/</p>
                <p className="text-indigo-600 font-bold text-sm mt-0.5">{selectedWord.es}</p>
              </div>
              <button onClick={() => playSingleWord(selectedWord.en)} className="w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Icon name="volume-high" className="text-sm" /></button>
            </div>
          </div>
        )}

        <div className="p-6 bg-[#fcf9f0] border-t border-amber-100/50 flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <div className="flex bg-white rounded-full p-1 border border-slate-200 shadow-sm">
              <button onClick={() => { setSpeed('snail'); if (isPlaying) playSentence(currentSentenceIdx, true); }} className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${speed === 'snail' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>🐌 Caracol</button>
              <button onClick={() => { setSpeed('slow'); if (isPlaying) playSentence(currentSentenceIdx, true); }} className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${speed === 'slow' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}>🐢 Lento</button>
              <button onClick={() => { setSpeed('normal'); if (isPlaying) playSentence(currentSentenceIdx, true); }} className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${speed === 'normal' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400'}`}>🐰 Normal</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPron(!showPron)} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${showPron ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-300 border border-slate-100'}`}>T</button>
              <button onClick={() => setShowTrans(!showTrans)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${showTrans ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-300 border border-slate-100'}`}><Icon name={showTrans ? "eye" : "eye-slash"} className="text-sm" /></button>
            </div>
          </div>
          <div className="flex justify-center items-center gap-10">
            <button onClick={() => { if (currentSentenceIdx > 0) playSentence(currentSentenceIdx - 1, true); else playSentence(0, true); }} className="text-slate-300 hover:text-indigo-400 transition-colors"><Icon name="backward-fast" className="text-xl" /></button>
            <button onClick={togglePlayback} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 border-2 border-white ${isPlaying ? 'bg-rose-500' : 'bg-indigo-600 ai-glow'}`}><Icon name={isPlaying ? "pause" : "play"} className="text-xl text-white" /></button>
            <button onClick={() => { if (currentSentenceIdx !== -1) playSentence(currentSentenceIdx, true); else playSentence(0, true); }} className="text-slate-300 hover:text-indigo-400 transition-colors"><Icon name="rotate-right" className="text-xl" /></button>
            <button onClick={() => { if (currentSentenceIdx < sentences.length - 1) playSentence(currentSentenceIdx + 1, true); }} className="text-slate-300 hover:text-indigo-400 transition-colors"><Icon name="forward-fast" className="text-xl" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-500 pb-24 relative min-h-full">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={onBack} className="text-slate-500 p-2 hover:bg-slate-100 rounded-full transition-colors"><Icon name="arrow-left" /></button><h2 className="text-2xl font-black text-slate-800">Historias</h2></div><div className="w-10"></div></div>
      <div className="space-y-4">
        {stories.map((s, idx) => (
          <button key={s.id} onClick={() => { setActiveIdx(idx); setMode('reader'); setCurrentSentenceIdx(-1); setSelectedWord(null); }} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:bg-indigo-50 transition-all group w-full text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-white transition-colors"><Icon name="book-open" /></div>
            <div className="flex-1 min-w-0"><h4 className="font-black text-slate-800 truncate text-sm">{s.title}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historia {idx + 1}</p></div>
            <Icon name="chevron-right" className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
          </button>
        ))}
        <button onClick={() => setShowCustomModal(true)} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black text-sm hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 group"><Icon name="plus-circle" className="text-3xl group-hover:scale-110 transition-transform" />Crear historia personalizada</button>
      </div>
      {showCustomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="text-center mb-6"><div className="w-16 h-16 ai-gradient rounded-3xl flex items-center justify-center text-white text-2xl mx-auto mb-4 ai-glow"><Icon name="wand-sparkles" /></div><h3 className="text-xl font-black text-slate-900">IA Narradora</h3><p className="text-slate-500 text-[11px] font-bold mt-1 uppercase tracking-wider">Crea una historia con tu vocabulario</p></div>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-2 block">¿De qué trata la historia?</label><textarea value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder="Ej: Un viaje al espacio, una cena en París, un perro detective..." className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" /></div>
              <div className="flex gap-3"><button onClick={() => setShowCustomModal(false)} className="flex-1 py-4 text-slate-400 font-black text-xs hover:text-slate-600 transition-colors">Cancelar</button><button onClick={handleCreateCustomStory} disabled={isGenerating || !customTheme.trim()} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg ai-glow disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">{isGenerating ? (<><Icon name="spinner" className="animate-spin" />Escribiendo...</>) : (<><Icon name="bolt" />Generar Historia</>)}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryView;
