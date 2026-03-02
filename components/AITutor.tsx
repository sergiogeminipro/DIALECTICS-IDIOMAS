
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../constants';

import { Word, SRSItem } from '../types';
import { DICTIONARY } from '../data/dictionary';
import { GeminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { saveAIChatHistory, getAIChatHistory, saveAIListeningExercise } from '../services/firestoreService';
import { AIChatMessage, AIListeningExercise } from '../types';


interface GrammarLesson {
  id: string;
  title: string;
  desc: string;
}

interface GrammarLevel {
  title: string;
  lessons: GrammarLesson[];
}

const GRAMMAR_PATH: GrammarLevel[] = [
  {
    title: "A1 – Principiante",
    lessons: [
      { id: "a1_1", title: "am / is / are", desc: "Afirmativa, negativa, preguntas." },
      { id: "a1_2", title: "I do / work / like", desc: "Presente simple sin contrastes complejos." },
      { id: "a1_3", title: "I don't… / Do you…?", desc: "Preguntas yes/no." },
      { id: "a1_4", title: "Adverbios de frecuencia básicos", desc: "always, usually, never en oraciones simples." },
      { id: "a1_5", title: "I / you / he / she / it / we / they", desc: "Pronombres como sujeto." },
      { id: "a1_6", title: "my / your / his / her / its / our / their", desc: "Adjetivos posesivos básicos." },
      { id: "a1_7", title: "I / me; he / him", desc: "Pronombres objeto (sin matices)." },
      { id: "a1_8", title: "a / an; plurales regulares", desc: "Reglas de formación (s / es)." },
      { id: "a1_9", title: "Sustantivos contables simples", desc: "Nombres de cosas comunes." },
      { id: "a1_10", title: "There is / There are", desc: "Existencia en singular y plural." },
      { id: "a1_11", title: "WH Questions básico", desc: "What, Where, Who, How old, How many." },
      { id: "a1_12", title: "Conectores simples", desc: "and / but / because en frases sencillas." }
    ]
  },
  {
    title: "A2 – Básico Alto",
    lessons: [
      { id: "a2_1", title: "was / were", desc: "Pasado simple de 'to be'." },
      { id: "a2_2", title: "worked / went / had", desc: "Pasado simple regular e irregular." },
      { id: "a2_3", title: "did / didn't / Did you…?", desc: "Auxiliar en pasado para negación y preguntas." },
      { id: "a2_4", title: "Presente continuo vs Simple", desc: "I am doing ahora vs I do en general." },
      { id: "a2_5", title: "I'm going to… (planes)", desc: "Futuro para intenciones y planes." },
      { id: "a2_6", title: "will (decisiones / predicciones)", desc: "Futuro espontáneo y predicciones simples." },
      { id: "a2_7", title: "some / any / no / none", desc: "Cuantificadores iniciales." },
      { id: "a2_8", title: "somebody / anybody / nobody", desc: "Pronombres indefinidos iniciales." },
      { id: "a2_9", title: "both / either / neither", desc: "Uso elemental para elegir opciones." },
      { id: "a2_10", title: "Contables e incontables", desc: "a bottle / some water; a cake / some cake." },
      { id: "a2_11", title: "a / an / the en contexto", desc: "Artículos en contextos frecuentes (casa, ciudad)." },
      { id: "a2_12", title: "at / on / in (tiempo)", desc: "Días, meses y horas." },
      { id: "a2_13", title: "in / at / on (lugar)", desc: "Preposiciones de lugar (city, home, school)." },
      { id: "a2_14", title: "Adjetivos comunes", desc: "Old, nice, interesting." },
      { id: "a2_15", title: "Adverbios en -ly", desc: "Quickly, slowly." }
    ]
  },
  {
    title: "B1 – Intermedio",
    lessons: [
      { id: "b1_1", title: "Presente perfecto", desc: "I have done; ever / never / just / already / yet." },
      { id: "b1_2", title: "How long have you…?; for / since", desc: "Expresar duración en el tiempo." },
      { id: "b1_3", title: "I have done vs I did", desc: "Contraste básico entre presente perfecto y pasado simple." },
      { id: "b1_4", title: "Pasado continuo y pasado perfecto", desc: "I was doing vs I had done." },
      { id: "b1_5", title: "Futuro progresivo y perfecto", desc: "will be doing / will have done (introducción)." },
      { id: "b1_6", title: "Modales: can / could", desc: "Habilidad y posibilidad." },
      { id: "b1_7", title: "must / mustn't / needn't; have to", desc: "Obligación, prohibición y necesidad." },
      { id: "b1_8", title: "Should y Would Like", desc: "Consejo y peticiones corteses." },
      { id: "b1_9", title: "Comparativos y superlativos", desc: "cheap / cheaper / the cheapest; not as… as…" },
      { id: "b1_10", title: "Condicionales 0 y 1", desc: "Verdades generales y posibles futuros." },
      { id: "b1_11", title: "Estructura y Adverbios", desc: "Word order. still / yet / already / even." },
      { id: "b1_12", title: "Relativas básicas", desc: "a person who…, a thing that…" }
    ]
  },
  {
    title: "B2 – Intermedio Alto",
    lessons: [
      { id: "b2_1", title: "Perfectos Continuos", desc: "have / has been doing; had been doing. How long...?" },
      { id: "b2_2", title: "Present perfect vs past simple", desc: "Matiz de experiencia vs pasado acabado." },
      { id: "b2_3", title: "Past perfect vs past simple", desc: "Uso en narración de historias." },
      { id: "b2_4", title: "Futuro avanzado", desc: "Present tenses for future. will vs going to matizados." },
      { id: "b2_5", title: "Cuando hago / He hecho", desc: "When I do / When I've done." },
      { id: "b2_6", title: "Modales de Probabilidad", desc: "may / might (probabilidad), must / can't (deducción)." },
      { id: "b2_7", title: "Modales de obligación", desc: "Contraste have to vs must." },
      { id: "b2_8", title: "Peticiones", desc: "Can / Could / Would you…?" },
      { id: "b2_9", title: "Condicionales 2 y 3", desc: "If + past, would...; If + past perfect, would have..." },
      { id: "b2_10", title: "Wish", desc: "Wish I had…, I wish I spoke…" },
      { id: "b2_11", title: "Voz pasiva básica", desc: "is done / was done / has been done." },
      { id: "b2_12", title: "Voz pasiva avanzada", desc: "It is said that…, have something done." },
      { id: "b2_13", title: "Reported speech", desc: "Cambios de tiempo y pronombre en estilo indirecto." },
      { id: "b2_14", title: "-ing y To‑infinitivo", desc: "Verb + -ing; verb + to…; verb + object + to…" },
      { id: "b2_15", title: "Prefer / would rather", desc: "Expresar preferencias." },
      { id: "b2_16", title: "Used to / Be used to", desc: "be used to doing vs used to do." },
      { id: "b2_17", title: "Preposiciones avanzadas", desc: "for, during, while; by / until / by the time." },
      { id: "b2_18", title: "Adj/Verb + Preposición", desc: "afraid of, good at, listen to, look at." },
      { id: "b2_19", title: "Phrasal verbs esenciales", desc: "in/out, up/down, on/off…" }
    ]
  },
  {
    title: "C1 – Avanzado",
    lessons: [
      { id: "c1_1", title: "Tiempos en Narrativa", desc: "Present simple/continuous en narrativa." },
      { id: "c1_2", title: "Future in the Past", desc: "was going to / would; be to / be about to." },
      { id: "c1_3", title: "Matices de Pasados", desc: "Fine nuances de present perfect, past simple y past perfect." },
      { id: "c1_4", title: "Will / Would (Hábito)", desc: "Uso para acciones repetidas y especulación en el pasado." },
      { id: "c1_5", title: "Especulación Pasada", desc: "Modales: might have, must have, could have, etc." },
      { id: "c1_6", title: "Necesidad en el Pasado", desc: "Needn't have vs didn't need to." },
      { id: "c1_7", title: "Dare y Need", desc: "Uso de dare y need como verbos modales." },
      { id: "c1_8", title: "Pasiva con Percepción", desc: "Passive with verbs of perception and reporting structures." },
      { id: "c1_9", title: "Causativos Avanzados", desc: "get + past participle; causative have / get done avanzado." },
      { id: "c1_10", title: "Inversión Negativa", desc: "Inversion after negative adverbials (Never, Seldom...)." },
      { id: "c1_11", title: "Énfasis y So/Neither", desc: "Estructuras de énfasis y acuerdos negativos/positivos." },
      { id: "c1_12", title: "Cleft Sentences", desc: "It is... that; What... is... (Cleft y pseudo-cleft)." },
      { id: "c1_13", title: "Fronting", desc: "Mover elementos al principio para dar énfasis." },
      { id: "c1_14", title: "Cláusulas de Participio", desc: "Participle clauses para reducción de oraciones." },
      { id: "c1_15", title: "Relativas Avanzadas", desc: "Relative clauses avanzadas y reducidas." },
      { id: "c1_16", title: "Nominalización", desc: "Transformar verbos/adjetivos en sustantivos para formalidad." },
      { id: "c1_17", title: "Hedging y Estilo", desc: "Matizar afirmaciones y uso de Marcadores de Discurso." },
      { id: "c1_18", title: "Elipsis y Sustitución", desc: "Evitar repeticiones en textos complejos." },
      { id: "c1_19", title: "Condicionales Mixtos", desc: "Mixed conditionals e inversión en condicionales." },
      { id: "c1_20", title: "Subjuntivo Formal", desc: "Uso del subjuntivo en contextos formales (It is vital that...)." },
      { id: "c1_21", title: "Phrasal Verbs Avanzados", desc: "Registros y uso idiomático avanzado." },
      { id: "c1_22", title: "Colocaciones Avanzadas", desc: "V+S, Adj+S, Adv+Adj collocations de nivel C1." }
    ]
  },
  {
    title: "C2 – Dominio",
    lessons: [
      { id: "c2_1", title: "Consistencia y Registro", desc: "Mantenimiento de tiempos y elección fina de registro." },
      { id: "c2_2", title: "Cohesión Global", desc: "Linking and flow, marcadores avanzados y elipsis." }
    ]
  }
];

interface Props {
  onBack: () => void;
}

const FORMULA_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-sky-100 text-sky-700 border-sky-200',
];

interface ChatMessage {
  role: 'user' | 'tutor';
  text: string;
}

const AITutor: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'selection' | 'grammar_selection' | 'training_room'>('selection');

  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [selectedMods, setSelectedMods] = useState<string[]>(['mod1']);
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null);

  const [mode, setMode] = useState<'drill' | 'live' | 'listening'>('drill');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');

  // Drill States
  const [drillData, setDrillData] = useState<any>(null);
  const [currentDrillIdx, setCurrentDrillIdx] = useState(0);
  const [drillStep, setDrillStep] = useState<'tutorial' | 'exercise'>('tutorial');
  const [showGuide, setShowGuide] = useState(true);

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);


  // Listening States
  const [listeningType, setListeningType] = useState<'dialogue' | 'story' | 'speech'>('dialogue');
  const [listeningTheme, setListeningTheme] = useState('');
  const [listeningData, setListeningData] = useState<any>(null);
  const [listeningAudio, setListeningAudio] = useState<string | null>(null);
  const [showListeningText, setShowListeningText] = useState(false);
  const [listeningResults, setListeningResults] = useState<Record<number, number>>({});
  const [showListeningQuizResult, setShowListeningQuizResult] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  // Ejercicio completo
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({
    affirmative: '',
    negative: '',
    interrogative: '',
    shortAnswer: '',
    longAnswer: ''
  });
  const [evalResults, setEvalResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const gemini = useRef(new GeminiService());

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Debounced chat sync
  useEffect(() => {
    if (!user || !selectedLesson || chatMessages.length === 0) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      saveAIChatHistory(user.uid, selectedLesson.id, chatMessages).catch(console.error);
    }, 2000);
  }, [chatMessages, user, selectedLesson]);


  useEffect(() => {
    const standard = [
      { id: 'mod1', name: 'Módulo 1', color: 'bg-blue-500' },
      { id: 'mod2', name: 'Módulo 2', color: 'bg-emerald-500' },
      { id: 'mod3', name: 'Módulo 3', color: 'bg-purple-500' },
      { id: 'mod4', name: 'Módulo 4', color: 'bg-orange-500' },
      { id: 'mod5', name: 'Módulo 5', color: 'bg-red-500' },
    ];
    const savedCustom = localStorage.getItem('custom_modules_list');
    const custom = savedCustom ? JSON.parse(savedCustom).map((m: any) => ({
      id: m.id,
      name: m.title,
      color: m.color,
      isCustom: true
    })) : [];
    setAvailableModules([...standard, ...custom]);
  }, []);

  const vocabObjects = useMemo(() => {
    let allVocab: Word[] = [];
    selectedMods.forEach(modId => {
      const data = DICTIONARY[modId];
      if (data) allVocab.push(...data.words);
      else {
        const saved = localStorage.getItem(`words_${modId}`);
        if (saved) allVocab.push(...JSON.parse(saved));
      }
    });
    return allVocab;
  }, [selectedMods]);

  const getVocabForGemini = () => {
    return vocabObjects.map(w => w.en).sort(() => 0.5 - Math.random());
  };

  const getFemaleVoice = () => {
    const voices = synthRef.current.getVoices();
    return voices.find(v =>
      (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Monica')) &&
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
  };

  const playSingleWord = (word: string) => {
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.voice = getFemaleVoice();
    synthRef.current.speak(u);
  };

  const startTraining = async () => {
    if (!selectedLesson) return;
    setIsLoading(true);
    setStep('training_room');

    const levelTitle = GRAMMAR_PATH.find(lvl => lvl.lessons.some(l => l.id === selectedLesson.id))?.title || "Standard";

    try {
      const data = await gemini.current.generateGrammarDrill(selectedLesson.title, getVocabForGemini(), levelTitle);
      if (data) {
        setDrillData(data);
        setDrillStep('tutorial');
        setCurrentDrillIdx(0);

        // Load chat history
        if (user) {
          const history = await getAIChatHistory(user.uid, selectedLesson.id);
          if (history && history.length > 0) {
            setChatMessages(history);
          } else {
            setChatMessages([{ role: 'tutor', text: `¡Hola! Soy tu tutor IA. Estoy listo para ayudarte con la lección de **${selectedLesson.title}**. ¿Qué necesitas ahora?`, timestamp: Date.now() }]);
          }
        }
      }
    } catch (e) {

      alert("Error al cargar entrenamiento.");
      setStep('grammar_selection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateDrills = async () => {
    if (!selectedLesson) return;
    setIsLoading(true);
    const levelTitle = GRAMMAR_PATH.find(lvl => lvl.lessons.some(l => l.id === selectedLesson.id))?.title || "Standard";

    try {
      const data = await gemini.current.generateGrammarDrill(selectedLesson.title, getVocabForGemini(), levelTitle);
      if (data) {
        setDrillData(data);
        setCurrentDrillIdx(0);
        setUserAnswers({ affirmative: '', negative: '', interrogative: '', shortAnswer: '', longAnswer: '' });
        setEvalResults({});
        setDrillStep('exercise');
        setChatMessages(prev => [...prev, { role: 'tutor', text: "He generado una nueva serie de ejercicios para esta lección." }]);
      }
    } catch (e) {
      alert("Error al generar nuevos ejemplos.");
    } finally {
      setIsLoading(false);
    }
  };

  const initExercise = () => {
    setUserAnswers({ affirmative: '', negative: '', interrogative: '', shortAnswer: '', longAnswer: '' });
    setEvalResults({});
    setDrillStep('exercise');
    setShowGuide(false);
  };

  const handleCheckAll = async () => {
    setIsLoading(true);
    const results: Record<string, any> = {};
    const types = ['affirmative', 'negative', 'interrogative', 'shortAnswer', 'longAnswer'];

    for (const type of types) {
      const userText = userAnswers[type];
      const expectedText = drillData.drills[currentDrillIdx][type];
      if (userText.trim()) {
        const res = await gemini.current.evaluateTransformation(userText, expectedText, selectedLesson?.title || '');
        results[type] = res;
      }
    }

    setEvalResults(results);
    setIsLoading(false);

    const hasErrors = Object.values(results).some(r => !r.isCorrect);
    if (hasErrors) {
      setShowChat(true);
      setChatMessages(prev => [...prev, { role: 'tutor', text: "He notado algunos errores en tu ejercicio. ¿Quieres que te explique qué falló o prefieres ver algunos trucos para esta lección?" }]);
    }
  };

  const handleSendMessage = async (customMsg?: string) => {
    const userMsg = customMsg || chatInput;
    if (!userMsg.trim() || isChatLoading) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
    setIsChatLoading(true);

    try {
      const context = `Lección: ${selectedLesson?.title}. Oración base actual: "${drillData?.drills[currentDrillIdx]?.baseSentence}". Resultados de evaluación actuales: ${JSON.stringify(evalResults)}`;
      const response = await gemini.current.getTutorChatResponse(userMsg, context);
      setChatMessages(prev => [...prev, { role: 'tutor', text: response, timestamp: Date.now() }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'tutor', text: "Hubo un problema al conectar. Intenta de nuevo.", timestamp: Date.now() }]);
    } finally {
      setIsChatLoading(false);
    }

  };

  const handleGenListening = async () => {
    if (!listeningTheme.trim() || !selectedLesson) return;
    setIsLoading(true);
    try {
      const data = await gemini.current.generateListeningExercise(listeningTheme, getVocabForGemini(), listeningType, selectedLesson.title);
      if (data) {
        setListeningData(data);
        const audio = await gemini.current.generateMultiSpeakerAudio(data.audioScript);
        setListeningAudio(audio);

        // Save exercise to Firestore
        if (user) {
          const exercise: AIListeningExercise = {
            id: `list_${Date.now()}`,
            moduleId: selectedMods[0] || 'global',
            lessonId: selectedLesson.id,
            title: data.title,
            audioScript: data.audioScript,
            lines: data.lines,
            keywords: data.keywords,
            quiz: data.quiz,
            createdAt: Date.now()
          };
          await saveAIListeningExercise(user.uid, exercise);
        }
      }
    } catch (e) {

      console.error(e);
      alert("Error al generar el entrenamiento de escucha.");
    } finally {
      setIsLoading(false);
    }
  };



  const startLiveAPI = async () => {
    alert("La función de Tutor en Vivo (Audio) requiere un SDK experimental que está desactivado por ahora para garantizar la estabilidad del generador de texto. ¡Pronto estará disponible!");
    setIsLiveActive(false);
    setIsLiveConnected(false);
  };

  const stopLiveAPI = () => {
    setIsLiveActive(false);
    setIsLiveConnected(false);
  };


  if (step === 'selection') {
    return (
      <div className="flex flex-col h-dvh bg-white max-w-md mx-auto animate-in slide-in-from-bottom duration-500 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 pt-14 text-center">
          <div className="w-16 h-16 ai-gradient rounded-[1.2rem] flex items-center justify-center text-white text-2xl mx-auto mb-6 shadow-xl ai-glow"><Icon name="sliders" /></div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">¿Qué quieres practicar?</h2>
          <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Selecciona los módulos para tu sesión</p>
          <div className="mt-10 space-y-3 pb-8">
            {availableModules.map(mod => (
              <button key={mod.id} onClick={() => setSelectedMods(prev => prev.includes(mod.id) ? prev.filter(m => m !== mod.id) : [...prev, mod.id])} className={`w-full p-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-center group ${selectedMods.includes(mod.id) ? 'bg-indigo-50 border-indigo-400 shadow-sm' : 'bg-slate-50 border-transparent'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${selectedMods.includes(mod.id) ? 'bg-indigo-600' : mod.color} rounded-xl flex items-center justify-center text-white shadow-sm transition-colors`}><span className="font-black text-sm">{mod.id.includes('custom') ? '★' : mod.id.slice(-1)}</span></div>
                  <span className={`font-black text-sm ${selectedMods.includes(mod.id) ? 'text-indigo-900' : 'text-slate-500'}`}>{mod.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 grid grid-cols-2 gap-4 shrink-0">
          <button onClick={onBack} className="py-4 bg-slate-100 text-slate-500 rounded-[1.2rem] font-black text-xs uppercase tracking-widest">Cancelar</button>
          <button onClick={() => setStep('grammar_selection')} disabled={selectedMods.length === 0} className="py-4 ai-gradient text-white rounded-[1.2rem] font-black text-xs shadow-xl ai-glow disabled:opacity-30 uppercase tracking-widest">Siguiente</button>
        </div>
      </div>
    );
  }

  if (step === 'grammar_selection') {
    return (
      <div className="flex flex-col h-dvh bg-slate-50 max-w-md mx-auto animate-in slide-in-from-right duration-500 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 pt-14">
          <div className="text-center mb-10"><div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mx-auto mb-4 shadow-lg"><Icon name="book-bookmark" /></div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Ruta de Aprendizaje</h2><p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-[0.2em]">Selecciona el tema a dominar</p></div>
          <div className="space-y-8 pb-10">
            {GRAMMAR_PATH.map((lvl, lIdx) => (
              <div key={lIdx} className="space-y-3">
                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">{lvl.title}</h3>
                <div className="space-y-2">
                  {lvl.lessons.map(lesson => (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (selectedLesson?.id === lesson.id) {
                          startTraining();
                        } else {
                          setSelectedLesson(lesson);
                        }
                      }}
                      className={`w-full p-5 rounded-[1.8rem] border-2 text-left transition-all relative overflow-hidden cursor-pointer group ${selectedLesson?.id === lesson.id ? 'bg-white border-indigo-600 shadow-xl scale-[1.02]' : 'bg-white/60 border-white hover:border-indigo-200'}`}
                    >
                      <div className="relative z-10">
                        <h4 className={`font-black text-sm ${selectedLesson?.id === lesson.id ? 'text-indigo-600' : 'text-slate-700'}`}>{lesson.title}</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 leading-relaxed">{lesson.desc}</p>
                        {selectedLesson?.id === lesson.id && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <button
                              onClick={(e) => { e.stopPropagation(); startTraining(); }}
                              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all text-center flex justify-center items-center gap-2 uppercase tracking-widest"
                            >
                              Empezar Clase <Icon name="bolt" className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                      {selectedLesson?.id === lesson.id && <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-bl-3xl text-white"><Icon name="check" className="text-sm" /></div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 grid grid-cols-2 gap-4 shrink-0">
          <button onClick={() => setStep('selection')} className="py-4 bg-white text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 shadow-sm">Atrás</button>
          <button onClick={startTraining} disabled={!selectedLesson} className="py-4 ai-gradient text-white rounded-2xl font-black text-xs shadow-xl ai-glow disabled:opacity-30 uppercase tracking-widest">Empezar Clase</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-50 max-w-md mx-auto animate-in fade-in relative">
      <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('grammar_selection')} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full"><Icon name="arrow-left" /></button>
          <div><h3 className="font-black text-slate-800 leading-none text-sm truncate max-w-[120px]">{selectedLesson?.title}</h3><p className="text-[9px] font-black text-indigo-400 uppercase mt-1">Laboratorio IA</p></div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-full">
          <button onClick={() => setMode('drill')} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition ${mode === 'drill' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Drill</button>
          <button onClick={() => setMode('live')} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition ${mode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Voz</button>
          <button onClick={() => setMode('listening')} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition ${mode === 'listening' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Listen</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-pulse">
            <div className="w-16 h-16 ai-gradient rounded-3xl flex items-center justify-center text-white text-2xl mb-4 ai-glow"><Icon name="spinner" className="animate-spin" /></div>
            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Preparando Laboratorio...</h4>
          </div>
        )}

        {!isLoading && mode === 'drill' && drillData && (
          <div className="p-6 space-y-8">
            {drillStep === 'tutorial' && (
              <div className="space-y-8 animate-in zoom-in duration-500 pb-10">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-2">Estructura Maestro / Fórmula:</span>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {drillData.formulaParts?.map((part: string, idx: number) => (
                      <div key={idx} className={`px-5 py-3 rounded-2xl border-2 font-black text-sm shadow-sm transition-transform hover:scale-105 ${FORMULA_COLORS[idx % FORMULA_COLORS.length]}`}>{part}</div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                  <div className="relative">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-4">Ejemplo Maestro Completo:</span>
                    <div className="space-y-4">
                      <VariationBox label="Afirmativa" data={drillData.masterExample.affirmative} color="indigo" />
                      <VariationBox label="Negativa" data={drillData.masterExample.negative} color="rose" />
                      <VariationBox label="Pregunta" data={drillData.masterExample.interrogative} color="amber" />
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <VariationBox label="Respuesta Corta" data={drillData.masterExample.shortAnswer} color="emerald" mini />
                        <VariationBox label="Respuesta Larga" data={drillData.masterExample.longAnswer} color="emerald" mini />
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={initExercise} className="w-full py-6 ai-gradient text-white rounded-[2rem] font-black text-sm shadow-xl ai-glow active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">Comenzar Entrenamiento <Icon name="bolt" /></button>
              </div>
            )}

            {drillStep === 'exercise' && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
                <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Guía de Estructura</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerateDrills}
                      disabled={isLoading}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="Generar nuevo ejemplo"
                    >
                      <Icon name="rotate" className={`text-[10px] ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setShowGuide(!showGuide)} className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                      {showGuide ? "Ocultar Guía" : "Ver Fórmula y Ejemplo"}
                    </button>
                  </div>
                </div>

                {showGuide && (
                  <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="flex flex-wrap gap-2 justify-center mb-6 border-b border-slate-50 pb-4">
                        {drillData.formulaParts?.map((part: string, idx: number) => (
                          <div key={idx} className="px-2 py-1 rounded-lg border text-[10px] font-black bg-slate-50 text-slate-500">{part}</div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <VariationBox label="Afirmativa" data={drillData.masterExample.affirmative} color="indigo" />
                        <VariationBox label="Negativa" data={drillData.masterExample.negative} color="rose" />
                        <VariationBox label="Pregunta" data={drillData.masterExample.interrogative} color="amber" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Icon name="quote-right" className="text-5xl text-white" /></div>
                  <div className="flex justify-between items-start">
                    <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">Oración Base</span>
                    <button onClick={handleRegenerateDrills} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all active:rotate-180" title="Generar Nuevos Ejemplos">
                      <Icon name="rotate" className="text-xs" />
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight mt-4">"{drillData.drills[currentDrillIdx].baseSentence}"</h3>
                </div>
                <div className="space-y-6">
                  <FullExerciseRow label="AFIRMATIVA" value={userAnswers.affirmative} onChange={(v) => setUserAnswers({ ...userAnswers, affirmative: v })} result={evalResults.affirmative} placeholder="Transforma a afirmativa..." />
                  <FullExerciseRow label="NEGATIVA" value={userAnswers.negative} onChange={(v) => setUserAnswers({ ...userAnswers, negative: v })} result={evalResults.negative} placeholder="Transforma a negativa..." />
                  <FullExerciseRow label="PREGUNTA" value={userAnswers.interrogative} onChange={(v) => setUserAnswers({ ...userAnswers, interrogative: v })} result={evalResults.interrogative} placeholder="Transforma a pregunta..." />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FullExerciseRow label="RESP. CORTA" value={userAnswers.shortAnswer} onChange={(v) => setUserAnswers({ ...userAnswers, shortAnswer: v })} result={evalResults.shortAnswer} placeholder="Sí/No..." />
                    <FullExerciseRow label="RESP. LARGA" value={userAnswers.longAnswer} onChange={(v) => setUserAnswers({ ...userAnswers, longAnswer: v })} result={evalResults.longAnswer} placeholder="Respuesta completa..." />
                  </div>
                </div>
                <div className="flex gap-4">
                  {Object.keys(evalResults).length === 0 ? (
                    <button onClick={handleCheckAll} disabled={isLoading || !Object.values(userAnswers).some((v: string) => v.trim())} className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm shadow-xl ai-glow disabled:opacity-30 uppercase tracking-widest">Evaluar Todo</button>
                  ) : (
                    <button onClick={() => { if (currentDrillIdx < drillData.drills.length - 1) { setCurrentDrillIdx(i => i + 1); initExercise(); } else { setDrillStep('tutorial'); } }} className="flex-1 py-6 bg-slate-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest">Siguiente Objetivo</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'live' && (
          <div className="h-full flex flex-col items-center justify-center p-8 space-y-10 animate-in fade-in relative">
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`absolute top-0 right-0 m-4 px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${showCaptions ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              <Icon name="closed-captioning" />
              <span className="text-[10px] font-black uppercase tracking-widest">{showCaptions ? 'CC ON' : 'CC OFF'}</span>
            </button>

            <div className={`w-40 h-40 ai-gradient rounded-[3rem] flex items-center justify-center text-white text-5xl shadow-2xl ai-glow transition-all duration-700 ${isLiveActive ? 'animate-pulse scale-110 ring-8 ring-indigo-500/20' : ''}`}><Icon name={isLiveConnected ? "waveform" : "microphone"} /></div>
            <div className="text-center relative z-10">
              <h3 className="text-2xl font-black text-slate-900">{isLiveConnected ? "Maestro en Vivo" : "Clase de Pronunciación"}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Lección: {selectedLesson?.title}</p>
            </div>

            {showCaptions && liveCaption && (
              <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm text-center animate-in slide-in-from-bottom-2">
                <p className="text-slate-700 font-medium text-sm leading-relaxed">{liveCaption}</p>
              </div>
            )}

            {isLiveActive ? (
              <button onClick={stopLiveAPI} className="px-12 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-black text-sm uppercase tracking-widest">Finalizar</button>
            ) : (
              <button onClick={startLiveAPI} className="px-14 py-5 ai-gradient text-white rounded-[2rem] font-black shadow-2xl ai-glow active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest"><Icon name="bolt" /> Iniciar Diálogo</button>
            )}
          </div>
        )}

        {mode === 'listening' && (
          <div className="p-6 space-y-8">
            {!listeningData ? (
              <div className="space-y-6 pt-10 text-center animate-in fade-in">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 text-3xl mx-auto mb-4 shadow-xl"><Icon name="headphones" /></div>
                <h3 className="text-xl font-black text-slate-800">Comprensión Auditiva IA</h3>
                <p className="text-slate-500 text-xs font-bold">Ejercicio basado en: <span className="text-indigo-600">{selectedLesson?.title}</span></p>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['dialogue', 'story', 'speech'] as const).map(t => (
                      <button key={t} onClick={() => setListeningType(t)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${listeningType === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                        {t === 'dialogue' ? 'Diálogo' : t === 'story' ? 'Cuento' : 'Discurso'}
                      </button>
                    ))}
                  </div>
                  <textarea value={listeningTheme} onChange={e => setListeningTheme(e.target.value)} placeholder="Ej: Dos amigos en un café, una leyenda del bosque, discurso de motivación..." className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all" />
                  <button onClick={handleGenListening} disabled={!listeningTheme.trim()} className="w-full py-5 ai-gradient text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest disabled:opacity-30">Generar Entrenamiento IA</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right pb-20">
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 block">{listeningType} Challenge</span>
                  <h3 className="text-2xl font-black mb-6">{listeningData.title}</h3>
                  <div className="flex flex-col gap-4">
                    {listeningAudio ? (
                      <ListeningAudioPlayer base64={listeningAudio} />
                    ) : (
                      <div className="w-full py-5 bg-white/10 rounded-2xl flex items-center justify-center gap-3 animate-pulse">
                        <Icon name="spinner" className="animate-spin text-white" />
                        <span className="text-xs font-black uppercase text-white">Sintetizando Audio...</span>
                      </div>
                    )}
                    <button onClick={() => setShowListeningText(!showListeningText)} className="w-full py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                      {showListeningText ? "Ocultar Texto" : "Mostrar Texto"}
                    </button>
                  </div>
                </div>

                {showListeningText && (
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4 animate-in slide-in-from-top-4">
                    {listeningData.lines?.map((line: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <span className={`font-black text-[10px] uppercase shrink-0 mt-1 ${line.speaker === 'Joe' ? 'text-indigo-500' : 'text-rose-500'}`}>{line.speaker}:</span>
                        <p className="text-slate-600 text-sm italic leading-relaxed">
                          {line.text.split(/(\s+)/).map((part: string, wIdx: number) => {
                            const clean = part.toLowerCase().replace(/[^a-z]/g, '');
                            const match = clean ? vocabObjects.find(w => w.en.toLowerCase() === clean) : null;
                            const isKeyword = listeningData.keywords?.some((k: string) => k.toLowerCase() === clean);

                            if (match) {
                              return <span key={wIdx} onClick={() => setSelectedWord(match)} className="text-indigo-600 font-black cursor-pointer hover:bg-indigo-50 px-0.5 rounded transition-colors border-b border-indigo-200">{part}</span>;
                            } else if (isKeyword) {
                              return <span key={wIdx} className="text-emerald-500 font-black">{part}</span>;
                            }
                            return <span key={wIdx}>{part}</span>;
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preguntas de Comprensión:</span>
                  {listeningData.quiz?.map((q: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                      <p className="font-black text-slate-800 text-sm">{q.question}</p>
                      <div className="space-y-2">
                        {q.options?.map((opt: string, oIdx: number) => {
                          const isSelected = listeningResults[idx] === oIdx;
                          const isCorrect = q.correctIdx === oIdx;
                          let style = "bg-slate-50 border-transparent text-slate-600";
                          if (showListeningQuizResult) {
                            if (isCorrect) style = "bg-emerald-50 border-emerald-500 text-emerald-700";
                            else if (isSelected) style = "bg-rose-50 border-rose-500 text-rose-700";
                          } else if (isSelected) style = "bg-indigo-600 text-white border-indigo-600 shadow-md";
                          return <button key={oIdx} onClick={() => !showListeningQuizResult && setListeningResults(p => ({ ...p, [idx]: oIdx }))} className={`w-full p-4 rounded-xl text-left text-xs font-bold transition-all border-2 ${style}`}>{opt}</button>;
                        })}
                      </div>
                    </div>
                  ))}
                  {!showListeningQuizResult ? (
                    <button onClick={() => setShowListeningQuizResult(true)} disabled={Object.keys(listeningResults).length < (listeningData.quiz?.length || 3)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl uppercase text-xs disabled:opacity-30">Comprobar Respuestas</button>
                  ) : (
                    <button onClick={() => { setListeningData(null); setListeningTheme(''); setShowListeningText(false); setListeningResults({}); setShowListeningQuizResult(false); }} className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs">Nueva Sesión</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTÓN FLOTANTE CHAT */}
      {step === 'training_room' && mode !== 'listening' && (
        <button onClick={() => setShowChat(!showChat)} className="absolute bottom-6 right-6 w-14 h-14 ai-gradient text-white rounded-full shadow-2xl ai-glow flex items-center justify-center z-[100] hover:scale-110 transition-transform"><Icon name={showChat ? "xmark" : "comment-dots"} className="text-xl" /></button>
      )}

      {/* DRAWER DEL CHAT */}
      {showChat && (
        <div className="absolute inset-0 bg-white z-[90] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50"><div className="flex items-center gap-3"><div className="w-10 h-10 ai-gradient rounded-full flex items-center justify-center text-white"><Icon name="user-graduate" /></div><div><h4 className="font-black text-slate-800 text-sm">Tutor Personal IA</h4><p className="text-[9px] font-black text-indigo-500 uppercase">Consultoría Premium</p></div></div><button onClick={() => setShowChat(false)} className="text-slate-400 p-2"><Icon name="chevron-down" /></button></div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar bg-slate-50/50">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] p-5 rounded-[1.8rem] shadow-sm relative ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                  <RichTextRenderer text={m.text} isUser={m.role === 'user'} />
                  {m.role === 'tutor' && (
                    <MessageAudioPlayer text={m.text} gemini={gemini.current} />
                  )}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start animate-pulse"><div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div></div></div></div>
            )}
          </div>

          {/* FILA DE SUGERENCIAS */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar bg-slate-50 border-t border-slate-100">
            <SuggestionChip text="Explícame la lección" onClick={() => handleSendMessage("Quiero que me expliques la lección de hoy de forma detallada.")} />
            <SuggestionChip text="Dame trucos" onClick={() => handleSendMessage("Dame trucos para identificar o construir oraciones basadas en esta lección.")} />
            <SuggestionChip text="Ejemplos de estructura" onClick={() => handleSendMessage("Muéstrame más ejemplos siguiendo la estructura de la fórmula.")} />
          </div>

          <div className="p-4 bg-white border-t flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Pregunta algo sobre la lección..." className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-200 outline-none" />
            <button onClick={() => handleSendMessage()} disabled={isChatLoading || !chatInput.trim()} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-30"><Icon name="paper-plane" /></button>
          </div>
        </div>
      )}

      {selectedWord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedWord(null)}>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl w-full max-w-xs animate-in zoom-in border border-slate-100 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedWord(null)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600"><Icon name="xmark" /></button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-5xl shadow-inner mb-2 overflow-hidden">
                {selectedWord.img.includes('http') || selectedWord.img.includes('data:') ? <img src={selectedWord.img} className="w-full h-full object-cover" /> : selectedWord.img}
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 leading-tight">{selectedWord.en}</h3>
                <p className="text-sm font-bold text-indigo-500 font-mono mt-1">/{selectedWord.pron}/</p>
              </div>
              <div className="w-full h-px bg-slate-100"></div>
              <p className="text-xl font-bold text-slate-600">{selectedWord.es}</p>
              <button onClick={() => playSingleWord(selectedWord.en)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm uppercase tracking-widest"><Icon name="volume-high" /> Escuchar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPERS ---
const encode = (b: Uint8Array) => { let s = ''; b.forEach(v => s += String.fromCharCode(v)); return btoa(s); };
const decode = (s: string) => { let b = atob(s), r = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) r[i] = b.charCodeAt(i); return r; };
const decodeAudioData = async (d: Uint8Array, ctx: AudioContext, sr: number, ch: number) => {
  const d16 = new Int16Array(d.buffer), f = d16.length / ch, b = ctx.createBuffer(ch, f, sr);
  for (let c = 0; c < ch; c++) { let cd = b.getChannelData(c); for (let i = 0; i < f; i++) cd[i] = d16[i * ch + c] / 32768.0; }
  return b;
};

/**
 * REPRODUCTOR DE AUDIO AVANZADO PARA LISTENING
 * Maneja play/pause, seek y estado.
 */
const ListeningAudioPlayer = ({ base64 }: { base64: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        contextRef.current = ctx;
        const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
        bufferRef.current = buffer;
      } catch (e) { console.error("Audio Decode Error", e); }
    };
    init();
    return () => {
      if (sourceRef.current) sourceRef.current.stop();
      if (contextRef.current && contextRef.current.state !== 'closed') contextRef.current.close();
    }
  }, [base64]);

  const play = () => {
    if (!contextRef.current || !bufferRef.current) return;
    if (contextRef.current.state === 'suspended') contextRef.current.resume();

    const source = contextRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(contextRef.current.destination);

    const offset = pausedAtRef.current % bufferRef.current.duration;
    source.start(0, offset);
    sourceRef.current = source;
    startedAtRef.current = contextRef.current.currentTime - offset;

    setIsPlaying(true);

    source.onended = () => {
      // Verificación simple para saber si terminó naturalmente
      if (contextRef.current && (contextRef.current.currentTime - startedAtRef.current >= (bufferRef.current?.duration || 0) - 0.1)) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
      }
    };
  };

  const pause = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
      if (contextRef.current) {
        pausedAtRef.current = contextRef.current.currentTime - startedAtRef.current;
      }
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    pausedAtRef.current = 0;
    setIsPlaying(false);
  };

  const forward = () => {
    stop(); // Detener para reiniciar desde nueva posición
    pausedAtRef.current = Math.min((pausedAtRef.current || 0) + 5, bufferRef.current?.duration || 0);
    play();
  };

  const rewind = () => {
    stop();
    pausedAtRef.current = Math.max((pausedAtRef.current || 0) - 5, 0);
    play();
  };

  return (
    <div className="w-full bg-white p-3 rounded-2xl flex items-center justify-between gap-2 shadow-lg">
      <button onClick={() => { stop(); play(); }} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all" title="Reiniciar">
        <Icon name="rotate-left" />
      </button>

      <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl">
        <button onClick={rewind} className="text-slate-400 hover:text-indigo-600 active:scale-90 transition-transform"><Icon name="backward" /></button>
        <button onClick={isPlaying ? pause : play} className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 ${isPlaying ? 'bg-amber-500' : 'bg-indigo-600'}`}>
          <Icon name={isPlaying ? "pause" : "play"} className="text-lg" />
        </button>
        <button onClick={forward} className="text-slate-400 hover:text-indigo-600 active:scale-90 transition-transform"><Icon name="forward" /></button>
      </div>

      <button onClick={stop} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all" title="Detener">
        <Icon name="stop" />
      </button>
    </div>
  );
};

/**
 * REPRODUCTOR DE AUDIO ULTRA MINIMALISTA
 * Lee oraciones de corrido automáticamente.
 */
const MessageAudioPlayer = ({ text, gemini }: { text: string, gemini: GeminiService }) => {
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Limpiar texto para el audio
    const cleanText = text.replace(/[|#*`]/g, '').replace(/\[|\]/g, '').replace(/->/g, ' to ');
    const split = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 2);
    setSentences(split);
    return () => stopPlayback();
  }, [text]);

  const stopPlayback = () => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playSentenceSequentially = async (index: number) => {
    if (index >= sentences.length) {
      setIsPlaying(false);
      setCurrentIdx(0);
      return;
    }

    setCurrentIdx(index);
    setIsPlaying(true);

    let base64 = audioCache[index];
    if (!base64) {
      setIsLoading(true);
      try {
        base64 = await gemini.textToSpeech(sentences[index]) || "";
        if (base64) setAudioCache(prev => ({ ...prev, [index]: base64 }));
      } catch (e) {
        console.error(e);
        setIsPlaying(false);
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (base64) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;

      source.onended = () => {
        // Solo auto-avanza si seguimos en modo "playing"
        if (currentSourceRef.current === source) {
          playSentenceSequentially(index + 1);
        }
      };
      source.start(0);
    }
  };

  const handleToggle = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playSentenceSequentially(currentIdx);
    }
  };

  if (sentences.length === 0) return null;

  return (
    <div className="absolute bottom-2 right-4 flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-full border border-slate-100 shadow-sm animate-in fade-in">
      <button
        onClick={(e) => { e.stopPropagation(); stopPlayback(); setCurrentIdx(p => Math.max(0, p - 1)); }}
        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-colors"
      >
        <Icon name="chevron-left" className="text-[10px]" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        disabled={isLoading}
        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isPlaying ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}
      >
        {isLoading ? <Icon name="spinner" className="animate-spin text-[10px]" /> : <Icon name={isPlaying ? "pause" : "play"} className="text-[10px]" />}
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); stopPlayback(); setCurrentIdx(p => Math.min(sentences.length - 1, p + 1)); }}
        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-colors"
      >
        <Icon name="chevron-right" className="text-[10px]" />
      </button>
    </div>
  );
};

const SuggestionChip = ({ text, onClick }: { text: string, onClick: () => void }) => (
  <button onClick={onClick} className="shrink-0 bg-white border border-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black shadow-sm hover:bg-indigo-50 transition-colors">
    {text}
  </button>
);

const RichTextRenderer = ({ text, isUser }: { text: string, isUser: boolean }) => {
  const lines = text.split('\n');
  const tableData: string[][] = [];
  let isInTable = false;

  const renderPart = (line: string, idx: number) => {
    const cleanLine = line.replace(/\$/g, '').replace(/\\rightarrow/g, '->');

    if (cleanLine.trim().startsWith('|')) {
      isInTable = true;
      const cells = cleanLine.split('|').filter(c => c.trim().length > 0 || c === "");
      if (cleanLine.includes('---')) return null;
      tableData.push(cells);
      return null;
    } else if (isInTable) {
      isInTable = false;
      const currentTable = [...tableData];
      tableData.length = 0;
      return (
        <div key={idx} className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white">
                {currentTable[0]?.map((cell, cIdx) => (
                  <th key={cIdx} className="px-4 py-3 font-black uppercase tracking-wider border-r border-indigo-500 last:border-0">{cell.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTable.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 font-medium text-slate-700 border-r border-slate-50 last:border-0">{parseBolding(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (cleanLine.startsWith('```')) return null;

    return <p key={idx} className={`mb-2 last:mb-0 leading-relaxed ${isUser ? 'text-white' : 'text-slate-700'} font-medium text-sm`}>{parseBolding(cleanLine)}</p>;
  };

  const parseBolding = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-indigo-600 font-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div className="rich-text-content mb-4">{lines.map((l, i) => renderPart(l, i))}</div>;
};

// Modified VariationBox to handle structured data with parts and view modes
const VariationBox = ({ label, data, color, mini }: { label: string; data: any; color: string; mini?: boolean }) => {
  const [viewMode, setViewMode] = useState<'normal' | 'structure' | 'translation'>('normal');
  const colors: Record<string, string> = { indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700', rose: 'bg-rose-50 border-rose-100 text-rose-700', amber: 'bg-amber-50 border-amber-100 text-amber-700', emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700' };

  // Handle both string format (legacy/fallback) and object format (structured)
  const isStructured = typeof data === 'object' && data !== null && data.parts;
  const textContent = isStructured ? data.text : data;
  const translationContent = isStructured && data.translation ? data.translation : "Traducción no disponible";

  const toggleMode = () => {
    if (viewMode === 'normal') setViewMode('structure');
    else if (viewMode === 'structure') setViewMode('translation');
    else setViewMode('normal');
  };

  return (
    <div
      onClick={toggleMode}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 relative ${colors[color]} ${mini ? 'flex flex-col' : 'flex items-center gap-4'}`}
    >
      <div className="flex flex-col shrink-0">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
      </div>

      <div className="flex-1">
        {viewMode === 'structure' && isStructured ? (
          <div className={`flex flex-wrap gap-x-1.5 gap-y-2 animate-in fade-in ${mini ? 'mt-2' : ''}`}>
            {data.parts.map((part: any, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 leading-none">{part.label}</span>
                <span className={`font-bold leading-none ${mini ? 'text-xs' : 'text-sm'}`}>{part.text}</span>
              </div>
            ))}
          </div>
        ) : viewMode === 'translation' ? (
          <p className={`font-bold italic opacity-80 animate-in fade-in ${mini ? 'text-xs mt-1' : 'text-sm'}`}>"{translationContent}"</p>
        ) : (
          <p className={`font-bold animate-in fade-in ${mini ? 'text-xs mt-1' : 'text-sm'}`}>"{textContent}"</p>
        )}
      </div>

      <div className="absolute top-2 right-2 text-[8px] opacity-30">
        <Icon name={viewMode === 'structure' ? 'diagram-project' : viewMode === 'translation' ? 'language' : 'eye'} />
      </div>
    </div>
  );
};

const FullExerciseRow = ({ label, value, onChange, result, placeholder }: { label: string, value: string, onChange: (v: string) => void, result?: any, placeholder: string }) => {
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center px-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>{result && <span className={`text-[9px] font-black uppercase ${result.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>{result.isCorrect ? '¡Excelente!' : 'Analizando...'}</span>}</div>
      <div className="relative group">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} disabled={!!result} placeholder={placeholder} className={`w-full py-4 px-6 rounded-2xl border-2 transition-all font-bold text-sm outline-none shadow-sm ${result ? (result.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800') : 'bg-white border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'}`} />
        {result && !result.isCorrect && (
          <div className="mt-2 p-4 bg-white rounded-xl border border-rose-100 shadow-sm animate-in zoom-in">
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">{result.feedback}</p>
            <div className="mt-2 pt-2 border-t border-rose-50 flex items-center gap-2">
              <span className="text-[8px] font-black text-rose-400 uppercase shrink-0">Corrección:</span>
              <span className="text-xs font-black text-rose-600">{result.correction}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITutor;
