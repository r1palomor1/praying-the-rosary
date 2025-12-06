/**
 * Checkpoint: Stable Web Speech API - December 2025
 * TTS: Web Speech API (browser-native, all platforms)
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageSelector } from './components/LanguageSelector';
import { loadPrayerProgress, hasValidPrayerProgress } from './utils/storage';
import { PrayerFlowEngine } from './utils/prayerFlowEngine';

// Lazy load screen components for code splitting
const HomeScreen = lazy(() => import('./components/HomeScreen'));
const MysteriesScreen = lazy(() => import('./components/MysteriesScreen'));
const MysteryScreen = lazy(() => import('./components/MysteryScreen'));
const CompletionScreen = lazy(() => import('./components/CompletionScreen'));
const PrayersScreen = lazy(() => import('./components/PrayersScreen'));

import './styles/index.css';

type AppScreen = 'language' | 'home' | 'mysteries' | 'prayers' | 'prayer' | 'complete';

function AppContent() {
  const { language, clearSession, completeSession, currentMysterySet } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [startWithContinuous, setStartWithContinuous] = useState(false);
  const [autoPlayCompletion, setAutoPlayCompletion] = useState(false);

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
        // Already complete - go directly to completion screen (no audio)
        setAutoPlayCompletion(false);
        setCurrentScreen('complete');
        return;
      }
    }

    // Not complete - proceed to prayer screen
    setStartWithContinuous(false);
    setCurrentScreen('prayer');
  };

  const handleStartPrayerWithContinuous = () => {
    // Check if today's rosary is already complete before starting
    const savedProgress = loadPrayerProgress(currentMysterySet);
    if (savedProgress && hasValidPrayerProgress(currentMysterySet)) {
      // Create temporary engine to check progress
      const engine = new PrayerFlowEngine(currentMysterySet as any, language);
      engine.jumpToStep(savedProgress.currentStepIndex);
      const progress = engine.getProgress();

      if (progress >= 99) {
        // Already complete - go directly to completion screen WITH audio
        setAutoPlayCompletion(true);
        setCurrentScreen('complete');
        return;
      }
    }

    // Not complete - proceed to prayer screen with continuous mode
    setStartWithContinuous(true);
    setCurrentScreen('prayer');
  };

  const handleCompletePrayer = () => {
    completeSession();
    // Don't clear prayer progress - keep it saved at completion step
    // so we can detect it's complete when user presses Pray again
    setAutoPlayCompletion(startWithContinuous); // Auto-play if coming from continuous mode
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
      <Suspense fallback={<div className="loading-screen"><div className="loading-spinner"></div></div>}>
        {currentScreen === 'home' && (
          <HomeScreen
            onStartPrayer={handleStartPrayer}
            onStartPrayerWithContinuous={handleStartPrayerWithContinuous}
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
          <MysteryScreen
            onComplete={handleCompletePrayer}
            onBack={handleBackToHome}
            startWithContinuous={startWithContinuous}
          />
        )}
        {currentScreen === 'complete' && (
          <CompletionScreen onHome={handleBackToHome} onRestart={handleRestart} mysteryType={currentMysterySet} autoPlayAudio={autoPlayCompletion} />
        )}
      </Suspense>
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
