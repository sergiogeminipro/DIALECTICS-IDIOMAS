
import React, { useState, useEffect, useRef } from 'react';
import { Word, SRSItem, AppSettings } from '../types';
import { Icon } from '../constants';

interface Props {
  words: Word[];
  srsData: Record<string, SRSItem>;
  onUpdateSRS: (wordId: string, difficulty: SRSItem['difficulty']) => void;
  onBulkUpdateSRS: (updates: Array<{ id: string; difficulty?: SRSItem['difficulty']; listeningFocus?: boolean }>) => void;
  onToggleListeningFocus: (wordId: string, forceState?: boolean) => void;
  settings: AppSettings;
  onBack: () => void;
  sessionType?: 'hard' | 'listening' | 'general';
}

const FlashcardSession: React.FC<Props> = ({
  words,
  srsData,
  onUpdateSRS,
  onBulkUpdateSRS,
  onToggleListeningFocus,
  settings,
  onBack,
  sessionType = 'general'
}) => {
  const [sessionWords] = useState<Word[]>([...words]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Guardamos los resultados de la sesión localmente antes de aplicarlos
  const [sessionResults, setSessionResults] = useState<Record<string, { difficulty?: SRSItem['difficulty'], listeningFocus?: boolean }>>({});

  // Estado para las palabras seleccionadas para borrar en la pantalla final
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set());

  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const startPos = useRef({ x: 0, y: 0 });
  const threshold = 60;
  const currentWord = sessionWords[currentIdx];

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v =>
      (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira')) &&
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
  };

  const playAudio = (rate: number = 1.0) => {
    if (!currentWord) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentWord.en);
    u.lang = "en-US";
    u.voice = getFemaleVoice();
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (isFlipped && settings.autoPlayAudio) {
      playAudio(1.0);
    }
  }, [isFlipped, currentIdx]);

  // Inicializar selección al terminar basándose en lo que el usuario marcó como "fácil" o "bien"
  useEffect(() => {
    if (isFinished) {
      const learnedIds = Object.entries(sessionResults)
        .filter(([_, res]) => {
          const r = res as { difficulty?: SRSItem['difficulty'], listeningFocus?: boolean };
          return r.difficulty === 'easy' || r.difficulty === 'medium' || (sessionType === 'listening' && r.listeningFocus === false);
        })
        .map(([id]) => id);

      setSelectedForRemoval(new Set(learnedIds));
    }
  }, [isFinished, sessionResults, sessionType]);

  const handleNext = (difficulty: SRSItem['difficulty'], direction: 'left' | 'right' | 'up' | 'down') => {
    if (exitDirection) return;
    setExitDirection(direction);

    // Registrar resultado localmente
    setSessionResults(prev => ({
      ...prev,
      [currentWord.id]: { ...prev[currentWord.id], difficulty }
    }));

    // Solo actualizar inmediatamente si es una sesión general
    if (sessionType === 'general') {
      onUpdateSRS(currentWord.id, difficulty);
    }

    setTimeout(() => {
      setIsFlipped(false);
      setExitDirection(null);
      setDragPos({ x: 0, y: 0 });
      if (currentIdx < sessionWords.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setExitDirection(null);
      setDragPos({ x: 0, y: 0 });
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSwipeDown = () => {
    if (exitDirection) return;
    setExitDirection('down');

    // Registrar foco de escucha localmente o en tiempo real
    if (sessionType === 'general') {
      onToggleListeningFocus(currentWord.id, true);
    } else {
      setSessionResults(prev => ({
        ...prev,
        [currentWord.id]: { ...prev[currentWord.id], listeningFocus: true }
      }));
    }

    setTimeout(() => {
      setIsFlipped(false);
      setExitDirection(null);
      setDragPos({ x: 0, y: 0 });
      if (currentIdx < sessionWords.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 300);
  };

  const toggleRemoval = (id: string) => {
    const next = new Set(selectedForRemoval);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForRemoval(next);
  };

  const handleFinalAction = () => {
    const ids = Array.from(selectedForRemoval);
    if (ids.length > 0) {
      const updates: Array<{ id: string; difficulty?: SRSItem['difficulty']; listeningFocus?: boolean }> = ids.map(id => ({
        id: String(id),
        listeningFocus: sessionType === 'listening' ? false : undefined,
        difficulty: sessionType === 'hard' ? 'easy' : undefined
      }));

      onBulkUpdateSRS(updates);
    }
    onBack();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (exitDirection) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || exitDirection) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDragPos({ x: dx, y: dy });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const { x, y } = dragPos;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (absX > threshold || absY > threshold) {
      if (absX > absY) {
        if (x > 0) handleNext('easy', 'right');
        else handleNext('hard', 'left');
      } else {
        if (y > 0) handleSwipeDown();
        else handleNext('medium', 'up');
      }
    } else {
      setDragPos({ x: 0, y: 0 });
      if (!isFlipped) setIsFlipped(true);
    }
  };

  if (isFinished) {
    const isSpecial = sessionType === 'hard' || sessionType === 'listening';
    const listName = sessionType === 'hard' ? 'Difíciles' : 'Escucha';

    return (
      <div className="flex flex-col h-full bg-white items-center p-6 text-center overflow-y-auto hide-scrollbar animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center text-4xl mb-6 shadow-inner mt-4">
          <Icon name="medal" />
        </div>
        <h2 className="text-3xl font-black text-slate-800">¡Sesión Terminada!</h2>
        <p className="text-slate-500 font-bold mt-2 mb-8">Has repasado {sessionWords.length} palabras.</p>

        {isSpecial ? (
          <div className="bg-slate-50 rounded-[3rem] p-6 border border-slate-100 w-full max-w-sm space-y-6 mb-8 shadow-sm flex flex-col items-center">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-700">Has marcado <span className="text-indigo-600">{selectedForRemoval.size}</span> palabras como aprendidas.</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Qué deseas hacer con ellas?</p>
            </div>

            <div className="w-full max-h-64 overflow-y-auto hide-scrollbar space-y-2 px-1">
              {sessionWords.map(word => {
                const isSelected = selectedForRemoval.has(word.id);
                return (
                  <div key={word.id} className="bg-white p-3 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {word.img.includes('data:') || word.img.includes('http') ? (
                          <img src={word.img} className="w-full h-full object-cover" />
                        ) : (
                          word.img
                        )}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{word.en}</span>
                    </div>
                    <button
                      onClick={() => toggleRemoval(word.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}
                    >
                      <Icon name="trash-can" className="text-sm" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={handleFinalAction}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                Borrar {selectedForRemoval.size} de lista de {listName}
              </button>
              <button
                onClick={onBack}
                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl font-black text-sm"
              >
                Mantener para seguir repasando
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onBack} className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl active:scale-95 transition-all">Volver al Inicio</button>
        )}
      </div>
    );
  }

  const isEnToEs = settings.cardMode === 'en_to_es';
  const rotation = dragPos.x * 0.1;
  const intensity = Math.min(Math.max(Math.abs(dragPos.x), Math.abs(dragPos.y)) / 80, 0.9);

  let swipeLabel = "";
  let labelColorClass = "";
  let overlayColor = "transparent";

  if (isDragging || exitDirection) {
    const dx = dragPos.x;
    const dy = dragPos.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 5) { swipeLabel = "FÁCIL"; labelColorClass = "text-emerald-500 border-emerald-500"; overlayColor = `rgba(16, 185, 129, ${intensity})`; }
      else if (dx < -5) { swipeLabel = "DIFÍCIL"; labelColorClass = "text-rose-500 border-rose-500"; overlayColor = `rgba(244, 63, 94, ${intensity})`; }
    } else {
      if (dy < -5) { swipeLabel = "BIEN"; labelColorClass = "text-amber-500 border-amber-500"; overlayColor = `rgba(245, 158, 11, ${intensity})`; }
      else if (dy > 5) { swipeLabel = "ESCUCHA"; labelColorClass = "text-indigo-500 border-indigo-500"; overlayColor = `rgba(99, 102, 241, ${intensity})`; }
    }
  }

  const swipeStyle = {
    transform: exitDirection
      ? `translate(${exitDirection === 'left' ? -500 : exitDirection === 'right' ? 500 : 0}px, ${exitDirection === 'up' ? -500 : exitDirection === 'down' ? 500 : 0}px) rotate(${exitDirection === 'left' ? -20 : exitDirection === 'right' ? 20 : 0}deg)`
      : `translate(${dragPos.x}px, ${dragPos.y}px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
  };

  const isListeningFocus = srsData[currentWord.id]?.listeningFocus;

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500 overflow-hidden">
      {/* Header con Botón de Anterior en el centro */}
      <div className="p-3 bg-white border-b flex justify-between items-center h-14 shrink-0 z-[100] shadow-sm px-4 relative">
        <button onClick={onBack} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"><Icon name="xmark" /></button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIdx === 0}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentIdx > 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm active:scale-95' : 'bg-slate-50 text-slate-200 cursor-not-allowed'}`}
            title="Tarjeta Anterior"
          >
            <Icon name="backward-step" className="text-sm" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleListeningFocus(currentWord.id); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isListeningFocus ? 'bg-indigo-600 text-white ai-glow' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}
            title="Foco de Escucha"
          >
            <Icon name="ear-listen" className={`text-sm ${isListeningFocus ? 'animate-pulse' : ''}`} />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{currentIdx + 1} / {sessionWords.length}</span>
            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((currentIdx + 1) / sessionWords.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative touch-none pt-4 pb-2 overflow-hidden">
        <div
          style={swipeStyle as any}
          className={`w-[336px] h-[400px] relative z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {(isDragging || exitDirection) && (
            <>
              <div className="absolute inset-0 z-[100] rounded-[2.5rem] pointer-events-none transition-colors duration-100" style={{ backgroundColor: overlayColor }} />
              {swipeLabel && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center pointer-events-none p-4">
                  <div className={`bg-white px-8 py-4 border-[6px] rounded-2xl font-black text-4xl tracking-widest shadow-2xl ${labelColorClass} transform -rotate-12 scale-110 animate-in zoom-in duration-100`}>
                    {swipeLabel}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={`w-full h-full relative transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-50 flex flex-col items-center justify-center p-8 backface-hidden overflow-hidden">
              <div className="text-8xl mb-10 pointer-events-none">
                {currentWord.img.includes('data:') || currentWord.img.includes('http') ? (
                  <img src={currentWord.img} className="w-40 h-40 object-contain" alt={currentWord.en} />
                ) : (
                  <span className="filter drop-shadow-lg scale-125 inline-block">{currentWord.img}</span>
                )}
              </div>
              <h2 className="text-4xl font-black text-slate-800 text-center leading-tight pointer-events-none px-2">
                {isEnToEs ? currentWord.en : currentWord.es}
              </h2>
              {isEnToEs && <p className="text-indigo-400 font-mono text-lg mt-4 italic pointer-events-none">/{currentWord.pron}/</p>}
              <div className="mt-16 text-slate-200 font-black uppercase tracking-widest text-[10px] pointer-events-none animate-pulse">Toca para voltear</div>
            </div>

            <div className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] shadow-2xl text-white flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 overflow-hidden">
              <div className={`flex flex-col items-center justify-center transition-opacity duration-200 w-full h-full ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                <h3 className="text-5xl font-black text-center mb-6 pointer-events-none truncate w-full px-2">{isEnToEs ? currentWord.es : currentWord.en}</h3>
                {!isEnToEs && <p className="text-indigo-200 font-mono text-xl mb-12 italic pointer-events-none">/{currentWord.pron}/</p>}

                <div className="flex justify-center gap-5 mt-4">
                  <button onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); playAudio(0.35); }} className="w-16 h-16 bg-white/20 rounded-full flex flex-col items-center justify-center hover:bg-white/30 transition-all active:scale-90 shadow-lg border border-white/10">
                    <span className="text-2xl">🐌</span>
                    <span className="text-[8px] font-black uppercase mt-0.5">Extra</span>
                  </button>
                  <button onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); playAudio(0.65); }} className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-90 shadow-lg border border-white/10">
                    <span className="text-2xl">🐢</span>
                  </button>
                  <button onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); playAudio(1.0); }} className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-90 shadow-lg border border-white/10">
                    <span className="text-2xl">🐰</span>
                  </button>
                </div>

                <div className="mt-16 flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-8 h-8 border-2 border-white/20 rounded-full flex items-center justify-center opacity-30">
                    <Icon name="chevron-up" className="text-xs animate-bounce" />
                  </div>
                  <div className="text-white/40 font-black uppercase tracking-widest text-[10px]">Desliza para calificar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 shrink-0 bg-white border-t z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
        {isFlipped ? (
          <div className="grid grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => handleNext('hard', 'left')} className="bg-[#ff4b4b] text-white py-4 rounded-2xl font-black shadow-lg text-xs transition-all active:scale-95 h-14 uppercase border-b-4 border-black/10">Difícil</button>
            <button onClick={() => handleNext('medium', 'up')} className="bg-[#ff9c00] text-white py-4 rounded-2xl font-black shadow-lg text-xs transition-all active:scale-95 h-14 uppercase border-b-4 border-black/10">Bien</button>
            <button onClick={() => handleNext('easy', 'right')} className="bg-[#00c274] text-white py-4 rounded-2xl font-black shadow-lg text-xs transition-all active:scale-95 h-14 uppercase border-b-4 border-black/10">Fácil</button>
          </div>
        ) : (
          <button onClick={() => setIsFlipped(true)} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl active:scale-95 uppercase text-sm border-b-4 border-black/20 tracking-widest">Mostrar Respuesta</button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};

export default FlashcardSession;
