
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GlobalViewState } from './types';
import ModuleSelector from './components/ModuleSelector';
import ModuleApp from './components/ModuleApp';
import AITutor from './components/AITutor';
import UserHub from './components/UserHub';
import AuthScreen from './components/AuthScreen';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<GlobalViewState>('selector');
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);

  const onSelectModule = (id: string) => {
    setCurrentModuleId(id);
    setView('module');
  };

  const onExit = () => {
    setCurrentModuleId(null);
    setView('selector');
  };

  // Loading spinner while Firebase checks auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-2xl">🎓</span>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated → show main app
  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'selector' && (
        <ModuleSelector
          onSelect={onSelectModule}
          onOpenTutor={() => setView('global_tutor')}
          onOpenUserHub={() => setView('user_hub')}
        />
      )}

      {view === 'module' && currentModuleId && (
        <ModuleApp moduleId={currentModuleId} onExit={onExit} />
      )}

      {view === 'global_tutor' && (
        <AITutor onBack={onExit} />
      )}

      {view === 'user_hub' && (
        <UserHub onBack={onExit} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
