/**
 * Checkpoint: Stable Hybrid V2 (Piper Desktop / System Mobile) - 112925 4pm
 */
import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageSelector } from './components/LanguageSelector';
import { HomeScreen } from './components/HomeScreen';
import { MysteriesScreen } from './components/MysteriesScreen';
import { MysteryScreen } from './components/MysteryScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { PrayersScreen } from './components/PrayersScreen';
import { VoiceDownloadBanner } from './components/VoiceDownloadBanner';
import { loadPrayerProgress, hasValidPrayerProgress } from './utils/storage';
import { PrayerFlowEngine } from './utils/prayerFlowEngine';

import './styles/index.css';

type AppScreen = 'language' | 'home' | 'mysteries' | 'prayers' | 'prayer' | 'complete';

function AppContent() {
  const { language, clearSession, completeSession, currentMysterySet } = useApp();
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
    // Check if today's rosary is already complete before starting
    const savedProgress = loadPrayerProgress(currentMysterySet);
    if (savedProgress && hasValidPrayerProgress(currentMysterySet)) {
      // Create temporary engine to check progress
      const engine = new PrayerFlowEngine(currentMysterySet as any, language);
      engine.jumpToStep(savedProgress.currentStepIndex);
      const progress = engine.getProgress();

      if (progress >= 99) {
        // Already complete - go directly to completion screen
        setCurrentScreen('complete');
        return;
      }
    }

    // Not complete - proceed to prayer screen
    setCurrentScreen('prayer');
  };

  const handleCompletePrayer = () => {
    completeSession();
    // Don't clear prayer progress - keep it saved at completion step
    // so we can detect it's complete when user presses Pray again
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
        <CompletionScreen onHome={handleBackToHome} onRestart={handleRestart} mysteryType={currentMysterySet} />
      )}

      {/* Voice download banner - shows when better voices available */}
      <VoiceDownloadBanner />
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
