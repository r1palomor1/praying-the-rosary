import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageSelector } from './components/LanguageSelector';
import { HomeScreen } from './components/HomeScreen';
import { MysteryScreen } from './components/MysteryScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { loadLanguage } from './utils/storage';
import './styles/index.css';

type AppScreen = 'language' | 'home' | 'prayer' | 'complete';

function AppContent() {
  const { language, clearSession, completeSession } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('language');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  // Check if language has been selected before
  useEffect(() => {
    const savedLanguage = loadLanguage();
    if (savedLanguage) {
      setHasSelectedLanguage(true);
      setCurrentScreen('home');
    }
  }, []);

  // When language changes from selector, move to home
  useEffect(() => {
    if (!hasSelectedLanguage && language) {
      setHasSelectedLanguage(true);
      setCurrentScreen('home');
    }
  }, [language, hasSelectedLanguage]);

  const handleStartPrayer = () => {
    setCurrentScreen('prayer');
  };

  const handleCompletePrayer = () => {
    completeSession();
    setCurrentScreen('complete');
  };

  const handleBackToHome = () => {
    clearSession();
    setCurrentScreen('home');
  };

  const handleRestart = () => {
    clearSession();
    setCurrentScreen('home');
  };

  return (
    <div className="app-container">
      {currentScreen === 'language' && <LanguageSelector />}
      {currentScreen === 'home' && <HomeScreen onStartPrayer={handleStartPrayer} />}
      {currentScreen === 'prayer' && (
        <MysteryScreen onComplete={handleCompletePrayer} onBack={handleBackToHome} />
      )}
      {currentScreen === 'complete' && (
        <CompletionScreen onHome={handleBackToHome} onRestart={handleRestart} />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
