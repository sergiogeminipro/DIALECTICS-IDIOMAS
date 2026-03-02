
export interface Word {
  id: string;
  en: string;
  es: string;
  pron: string;
  img: string;
}

export interface Story {
  id: string;
  title: string;
  text: string;
  translation?: string;
  pronunciation?: string;
}

export interface SRSItem {
  lastReviewed: number;
  difficulty: 'hard' | 'medium' | 'easy' | 'new';
  listeningFocus?: boolean;
}

export interface DailyActivity {
  words: number;
  lessons: number;
  xp: number;
}

export interface UserStats {
  xp: number;
  level: number;
  wordsLearned: number;
  lessonsCompleted: number;
  streak: number;
  lastVisit: number;
  dailyWordsGoal: number;
  dailyLessonsGoal: number;
  history: Record<string, DailyActivity>; // Key: YYYY-MM-DD
}

export interface GrammarExercise {
  base: string;
  positive: string;
  negative: string;
  interrogative: string;
  shortAnswer: string;
  longAnswer: string;
  tense: string;
}

export interface AppSettings {
  cardMode: 'en_to_es' | 'es_to_en';
  autoPlayAudio: boolean;
  intervals: {
    hard: number;
    medium: number;
    easy: number;
  };
}

// Fix: Added missing 'flashcards_listening' and 'player_listening' to allow these views in ModuleApp and HomeView
export type ViewState = 
  | 'home' 
  | 'flashcards' 
  | 'flashcards_hard'
  | 'flashcards_hard_group'
  | 'flashcards_listening'
  | 'tutor' 
  | 'exercises' 
  | 'exercises_menu'
  | 'editor' 
  | 'stories' 
  | 'player'
  | 'player_all'
  | 'player_hard'
  | 'player_hard_group'
  | 'player_listening'
  | 'progress'
  | 'settings';

export type GlobalViewState = 'selector' | 'module' | 'global_tutor' | 'user_hub';

export interface AIChatMessage {
  role: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

export interface AIListeningExercise {
  id: string;
  moduleId: string;
  lessonId?: string;
  title: string;
  audioScript: string;
  lines: Array<{
    speaker: string;
    text: string;
  }>;
  keywords: string[];
  quiz: Array<{
    question: string;
    options: string[];
    correctIdx: number;
  }>;
  createdAt: number;
}

