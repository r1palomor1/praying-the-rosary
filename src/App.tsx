import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageSelector } from './components/LanguageSelector';
import { HomeScreen } from './components/HomeScreen';
import { MysteriesScreen } from './components/MysteriesScreen';
import { MysteryScreen } from './components/MysteryScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { PrayersScreen } from './components/PrayersScreen';

import './styles/index.css';

type AppScreen = 'language' | 'home' | 'mysteries' | 'prayers' | 'prayer' | 'complete';

function AppContent() {
  const { language, clearSession, completeSession } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  // Check if language has been selected before
  useEffect(() => {
    const savedSettings = localStorage.getItem('rosary_settings');
    if (savedSettings) {
      const { language: savedLanguage } = JSON.parse(savedSettings);
      if (savedLanguage) {
        setHasSelectedLanguage(true);
        setCurrentScreen('home');
      }
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

  const handleNavigateToMysteries = () => {
    setCurrentScreen('mysteries');
  };

  const handleNavigateToPrayers = () => {
    setCurrentScreen('prayers');
  };

  const handleNavigateToHome = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="app-container">
      {currentScreen === 'language' && <LanguageSelector />}
      {currentScreen === 'home' && (
        <HomeScreen
          onStartPrayer={handleStartPrayer}
          onNavigateToMysteries={handleNavigateToMysteries}
          onNavigateToPrayers={handleNavigateToPrayers}
        />
      )}
      {currentScreen === 'mysteries' && (
        <MysteriesScreen
          onNavigateHome={handleNavigateToHome}
          onNavigateToPrayers={handleNavigateToPrayers}
        />
      )}
      {currentScreen === 'prayers' && (
        <PrayersScreen
          onNavigateHome={handleNavigateToHome}
          onNavigateToMysteries={handleNavigateToMysteries}
        />
      )}
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
