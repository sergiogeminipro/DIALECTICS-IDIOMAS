
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Word, Story, SRSItem, AppSettings, ViewState, UserStats, DailyActivity } from '../types';
import { GeminiService } from '../services/geminiService';
import { Icon, CARD_INTERVALS } from '../constants';
import { DICTIONARY } from '../data/dictionary';
import { useAuth } from '../contexts/AuthContext';
import { saveModuleData, getModuleData } from '../services/firestoreService';
import HomeView from './HomeView';
import FlashcardSession from './FlashcardSession';
import AITutor from './AITutor';
import WritingExercises from './WritingExercises';
import EditorView from './EditorView';
import StoryView from './StoryView';
import ProgressView from './ProgressView';
import SettingsView from './SettingsView';
import PlayerSession from './PlayerSession';

interface Props {
  moduleId: string;
  onExit: () => void;
}

const ModuleApp: React.FC<Props> = ({ moduleId, onExit }) => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>('home');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [srsData, setSrsData] = useState<Record<string, SRSItem>>({});
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings>({
    cardMode: 'en_to_es',
    autoPlayAudio: true,
    intervals: CARD_INTERVALS
  });

  const gemini = useRef(new GeminiService());
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced Firestore sync
  const syncToFirestore = useCallback((data: Record<string, any>) => {
    if (!user) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      saveModuleData(user.uid, moduleId, data).catch(console.error);
    }, 1500);
  }, [user, moduleId]);

  useEffect(() => {
    const loadData = async () => {
      // Try Firestore first, fallback to localStorage
      let srs: Record<string, SRSItem> = {};
      let userWords: Word[] = [];
      let userStories: Story[] = [];
      let moduleSettings: AppSettings | null = null;
      let deletedIds: string[] = [];

      if (user) {
        try {
          const cloud = await getModuleData(user.uid, moduleId);
          if (cloud) {
            if (cloud.srs) srs = cloud.srs;
            if (cloud.words) userWords = cloud.words;
            if (cloud.stories) userStories = cloud.stories;
            if (cloud.settings) moduleSettings = cloud.settings;
            if (cloud.deletedIds) deletedIds = cloud.deletedIds;
            // Sync to localStorage as cache
            localStorage.setItem(`srs_${moduleId}`, JSON.stringify(srs));
            if (userWords.length) localStorage.setItem(`words_${moduleId}`, JSON.stringify(userWords));
            if (userStories.length) localStorage.setItem(`stories_${moduleId}`, JSON.stringify(userStories));
            if (moduleSettings) localStorage.setItem(`settings_${moduleId}`, JSON.stringify(moduleSettings));
            if (deletedIds.length) localStorage.setItem(`deleted_ids_${moduleId}`, JSON.stringify(deletedIds));
          }
        } catch (e) {
          console.warn('Firestore load failed, using localStorage:', e);
        }
      }

      // Fallback to localStorage if Firestore had no data
      if (!Object.keys(srs).length) {
        const savedSRS = localStorage.getItem(`srs_${moduleId}`);
        if (savedSRS) srs = JSON.parse(savedSRS);
      }
      if (!userWords.length) {
        const savedWords = localStorage.getItem(`words_${moduleId}`);
        if (savedWords) userWords = JSON.parse(savedWords);
      }
      if (!userStories.length) {
        const savedStories = localStorage.getItem(`stories_${moduleId}`);
        if (savedStories) userStories = JSON.parse(savedStories);
      }
      if (!moduleSettings) {
        const savedSettings = localStorage.getItem(`settings_${moduleId}`);
        if (savedSettings) moduleSettings = JSON.parse(savedSettings);
      }
      if (!deletedIds.length) {
        deletedIds = JSON.parse(localStorage.getItem(`deleted_ids_${moduleId}`) || '[]');
      }

      setSrsData(srs);
      if (moduleSettings) setSettings(moduleSettings);

      const baseData = DICTIONARY[moduleId as keyof typeof DICTIONARY] || { words: [], stories: [] };
      const filteredBaseWords = baseData.words.filter(w => !deletedIds.includes(w.id));
      const filteredBaseStories = baseData.stories.filter(s => !deletedIds.includes(s.id));

      setWords([...filteredBaseWords, ...userWords]);
      setStories([...filteredBaseStories, ...userStories]);
      setLoading(false);
    };

    loadData();
  }, [moduleId, user]);

  // Función robusta para actualizaciones masivas de SRS (lista de Escucha/Difíciles)
  const handleBulkUpdateSRS = (updates: Array<{ id: string; difficulty?: SRSItem['difficulty']; listeningFocus?: boolean }>) => {
    setSrsData(prev => {
      const next = { ...prev };
      updates.forEach(u => {
        const item = next[u.id] || { lastReviewed: 0, difficulty: 'new', listeningFocus: false };
        next[u.id] = {
          ...item,
          lastReviewed: Date.now(),
          difficulty: u.difficulty !== undefined ? u.difficulty : item.difficulty,
          listeningFocus: u.listeningFocus !== undefined ? u.listeningFocus : item.listeningFocus
        };
      });
      localStorage.setItem(`srs_${moduleId}`, JSON.stringify(next));
      syncToFirestore({ srs: next });
      return next;
    });
  };

  const handleUpdateSRS = (wordId: string, difficulty: SRSItem['difficulty']) => {
    handleBulkUpdateSRS([{ id: wordId, difficulty }]);
  };

  const handleToggleListeningFocus = (wordId: string, forceState?: boolean) => {
    setSrsData(prev => {
      const item = prev[wordId] || { lastReviewed: 0, difficulty: 'new', listeningFocus: false };
      const updated = {
        ...prev,
        [wordId]: {
          ...item,
          listeningFocus: forceState !== undefined ? forceState : !item.listeningFocus
        }
      };
      localStorage.setItem(`srs_${moduleId}`, JSON.stringify(updated));
      syncToFirestore({ srs: updated });
      return updated;
    });
  };

  const handleSaveWord = (word: Word) => {
    const isNew = !words.find(w => w.id === word.id);
    let newWordsList = isNew ? [...words, word] : words.map(w => w.id === word.id ? word : w);
    setWords(newWordsList);
    const customOnly = newWordsList.filter(w => !DICTIONARY[moduleId]?.words.find(dw => dw.id === w.id));
    localStorage.setItem(`words_${moduleId}`, JSON.stringify(customOnly));
    syncToFirestore({ words: customOnly });
  };

  const handleBulkSave = (newWords: Word[]) => {
    const existingIds = new Set(words.map(w => w.id));
    const toAdd = newWords.filter(w => !existingIds.has(w.id));
    const updatedWords = [...words, ...toAdd];
    setWords(updatedWords);
    const customOnly = updatedWords.filter(w => !DICTIONARY[moduleId]?.words.find(dw => dw.id === w.id));
    localStorage.setItem(`words_${moduleId}`, JSON.stringify(customOnly));
    syncToFirestore({ words: customOnly });
  };

  const handleDeleteWord = (id: string) => {
    const updated = words.filter(w => w.id !== id);
    setWords(updated);
    const isBaseWord = DICTIONARY[moduleId]?.words.find(dw => dw.id === id);
    if (isBaseWord) {
      const deletedIds = JSON.parse(localStorage.getItem(`deleted_ids_${moduleId}`) || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(`deleted_ids_${moduleId}`, JSON.stringify(deletedIds));
        syncToFirestore({ deletedIds });
      }
    }
    const savedWordsStr = localStorage.getItem(`words_${moduleId}`);
    if (savedWordsStr) {
      const savedWords: Word[] = JSON.parse(savedWordsStr);
      const filteredCustom = savedWords.filter(w => w.id !== id);
      localStorage.setItem(`words_${moduleId}`, JSON.stringify(filteredCustom));
      syncToFirestore({ words: filteredCustom });
    }
  };

  const handleSaveStory = (story: Story) => {
    const isNew = !stories.find(s => s.id === story.id);
    let newStoriesList = isNew ? [...stories, story] : stories.map(s => s.id === story.id ? story : s);
    setStories(newStoriesList);
    const customOnly = newStoriesList.filter(s => !DICTIONARY[moduleId]?.stories.find(ds => ds.id === s.id));
    localStorage.setItem(`stories_${moduleId}`, JSON.stringify(customOnly));
    syncToFirestore({ stories: customOnly });
  };

  const handleBulkSaveStories = (newStories: Story[]) => {
    const existingIds = new Set(stories.map(s => s.id));
    const toAdd = newStories.filter(s => !existingIds.has(s.id));
    const updatedStories = [...stories, ...toAdd];
    setStories(updatedStories);
    const customOnly = updatedStories.filter(s => !DICTIONARY[moduleId]?.stories.find(ds => ds.id === s.id));
    localStorage.setItem(`stories_${moduleId}`, JSON.stringify(customOnly));
    syncToFirestore({ stories: customOnly });
  };

  const handleDeleteStory = (id: string) => {
    const updated = stories.filter(s => s.id !== id);
    setStories(updated);
    const isBaseStory = DICTIONARY[moduleId]?.stories.find(ds => ds.id === id);
    if (isBaseStory) {
      const deletedIds = JSON.parse(localStorage.getItem(`deleted_ids_${moduleId}`) || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(`deleted_ids_${moduleId}`, JSON.stringify(deletedIds));
        syncToFirestore({ deletedIds });
      }
    }
    const savedStoriesStr = localStorage.getItem(`stories_${moduleId}`);
    if (savedStoriesStr) {
      const savedStories: Story[] = JSON.parse(savedStoriesStr);
      const filteredCustom = savedStories.filter(s => s.id !== id);
      localStorage.setItem(`stories_${moduleId}`, JSON.stringify(filteredCustom));
      syncToFirestore({ stories: filteredCustom });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-indigo-600 animate-pulse">Cargando Módulo...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col relative border-x border-slate-100 overflow-hidden">

      <div className="bg-indigo-600 p-4 text-white shadow-lg sticky top-0 z-50 flex items-center justify-between shrink-0 h-14">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (view === 'home' && selectedGroupId === null) onExit(); else { setView('home'); setSelectedGroupId(null); } }} className="p-2 rounded-full"><Icon name={(view === 'home' && selectedGroupId === null) ? "arrow-left" : "house"} /></button>
          <h1 className="font-bold text-sm truncate">{selectedGroupId !== null ? `Objetivo ${selectedGroupId + 1}` : `Módulo ${moduleId.slice(-1)}`}</h1>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('progress')} className="p-2 bg-white/10 rounded-full"><Icon name="chart-pie" /></button>
          <button onClick={() => setView('settings')} className="p-2 bg-white/10 rounded-full"><Icon name="gear" /></button>
          <button onClick={() => setView('editor')} className="p-2 bg-white/10 rounded-full"><Icon name="edit" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50 relative">
        {view === 'home' && (
          <HomeView
            onNavigate={setView}
            hardCount={words.filter(w => srsData[w.id]?.difficulty === 'hard').length}
            listeningCount={words.filter(w => srsData[w.id]?.listeningFocus).length}
            wordCount={words.length}
            words={words}
            srsData={srsData}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        )}

        {view === 'flashcards' && <FlashcardSession sessionType="general" words={selectedGroupId !== null ? words.slice(selectedGroupId * 25, (selectedGroupId + 1) * 25) : words} srsData={srsData} onUpdateSRS={handleUpdateSRS} onBulkUpdateSRS={handleBulkUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} settings={settings} onBack={() => setView('home')} />}

        {view === 'flashcards_hard' && <FlashcardSession sessionType="hard" words={words.filter(w => srsData[w.id]?.difficulty === 'hard')} srsData={srsData} onUpdateSRS={handleUpdateSRS} onBulkUpdateSRS={handleBulkUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} settings={settings} onBack={() => setView('home')} />}

        {view === 'flashcards_listening' && <FlashcardSession sessionType="listening" words={words.filter(w => srsData[w.id]?.listeningFocus)} srsData={srsData} onUpdateSRS={handleUpdateSRS} onBulkUpdateSRS={handleBulkUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} settings={settings} onBack={() => setView('home')} />}

        {view === 'flashcards_hard_group' && selectedGroupId !== null && <FlashcardSession sessionType="hard" words={words.slice(selectedGroupId * 25, (selectedGroupId + 1) * 25).filter(w => srsData[w.id]?.difficulty === 'hard')} srsData={srsData} onUpdateSRS={handleUpdateSRS} onBulkUpdateSRS={handleBulkUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} settings={settings} onBack={() => setView('home')} />}

        {view === 'tutor' && <AITutor onBack={() => setView('home')} />}

        {view === 'exercises' && <WritingExercises words={words.slice((selectedGroupId || 0) * 25, (selectedGroupId || 0) * 25 + 25)} srsData={srsData} onUpdateSRS={handleUpdateSRS} onBack={() => setView('home')} />}

        {view === 'player' && <PlayerSession words={selectedGroupId !== null ? words.slice(selectedGroupId * 25, (selectedGroupId + 1) * 25) : words} srsData={srsData} onUpdateSRS={handleUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} onBack={() => setView('home')} />}

        {view === 'player_all' && <PlayerSession words={words} srsData={srsData} onUpdateSRS={handleUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} onBack={() => setView('home')} />}

        {view === 'player_hard' && <PlayerSession words={words.filter(w => srsData[w.id]?.difficulty === 'hard')} srsData={srsData} onUpdateSRS={handleUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} onBack={() => setView('home')} />}

        {view === 'player_listening' && <PlayerSession words={words.filter(w => srsData[w.id]?.listeningFocus)} srsData={srsData} onUpdateSRS={handleUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} onBack={() => setView('home')} />}

        {view === 'player_hard_group' && selectedGroupId !== null && <PlayerSession words={words.slice(selectedGroupId * 25, (selectedGroupId + 1) * 25).filter(w => srsData[w.id]?.difficulty === 'hard')} srsData={srsData} onUpdateSRS={handleUpdateSRS} onToggleListeningFocus={handleToggleListeningFocus} onBack={() => setView('home')} />}

        {view === 'progress' && <ProgressView words={words} srsData={srsData} onUpdateSRS={handleUpdateSRS} onBack={() => setView('home')} />}
        {view === 'settings' && <SettingsView settings={settings} onSave={(s) => { setSettings(s); setView('home'); localStorage.setItem(`settings_${moduleId}`, JSON.stringify(s)); syncToFirestore({ settings: s }); }} onBack={() => setView('home')} />}
        {view === 'stories' && <StoryView words={words} stories={stories} onSaveStory={handleSaveStory} onBack={() => setView('home')} gemini={gemini.current} />}
        {view === 'editor' && (
          <EditorView
            words={words}
            stories={stories}
            onSave={handleSaveWord}
            onSaveStory={handleSaveStory}
            onBulkSave={handleBulkSave}
            onBulkSaveStories={handleBulkSaveStories}
            onDeleteWord={handleDeleteWord}
            onDeleteStory={handleDeleteStory}
            onBack={() => setView('home')}
            gemini={gemini.current}
          />
        )}
      </div>
    </div>
  );
};

export default ModuleApp;
