/**
 * Checkpoint: Stable Web Speech API - December 2025
 * TTS: Web Speech API (browser-native, all platforms)
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageSelector } from './components/LanguageSelector';
import { loadPrayerProgress, hasValidPrayerProgress } from './utils/storage';
import { PrayerFlowEngine } from './utils/prayerFlowEngine';
import { cleanupPrayerHistory } from './utils/cleanupHistory';

// Lazy load screen components for code splitting
const HomeScreen = lazy(() => import('./components/HomeScreen'));
const MysteriesScreen = lazy(() => import('./components/MysteriesScreen'));
const MysteryScreen = lazy(() => import('./components/MysteryScreen'));
const CompletionScreen = lazy(() => import('./components/CompletionScreen'));
const PrayersScreen = lazy(() => import('./components/PrayersScreen'));
const ProgressScreen = lazy(() => import('./components/ProgressScreen'));
const PrayerSelectionScreen = lazy(() => import('./components/PrayerSelectionScreen'));
// Placeholder for SacredPrayersScreen until we create it - using MysteryScreen temporarily if needed or just null
// We will create it shortly, but defining the lazy load now
const SacredPrayersScreen = lazy(() => import('./components/SacredPrayersScreen'));
const SacredCompletionScreen = lazy(() => import('./components/SacredCompletionScreen'));

import './styles/index.css';

type AppScreen = 'language' | 'home' | 'mysteries' | 'prayers' | 'prayer' | 'complete' | 'progress' | 'prayer-selection' | 'sacred-prayers' | 'sacred-complete';

function AppContent() {
  const { language, clearSession, completeSession, currentMysterySet } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [startWithContinuous, setStartWithContinuous] = useState(false);
  const [autoPlayCompletion, setAutoPlayCompletion] = useState(false);

  // Check if language has been selected before and cleanup contaminated history
  useEffect(() => {
    // Clean up any Sacred Prayer entries that were mistakenly saved to Rosary history
    const cleanup = cleanupPrayerHistory();
    if (cleanup.removed > 0) {
      console.log(`Removed ${cleanup.removed} contaminated entries from Rosary history`);
    }

    const savedSettings = localStorage.getItem('rosary_settings');
    if (savedSettings) {
      const { language: savedLanguage } = JSON.parse(savedSettings);
      if (savedLanguage) {
        setHasSelectedLanguage(true);
        setCurrentScreen('prayer-selection');
      }
    }
  }, []);

  // When language changes from selector, move to home
  useEffect(() => {
    if (!hasSelectedLanguage && language) {
      setHasSelectedLanguage(true);
      setCurrentScreen('prayer-selection');
    }
  }, [language, hasSelectedLanguage]);

  const handleStartPrayer = () => {
    // Check if today's rosary is already complete before starting
    const savedProgress = loadPrayerProgress(currentMysterySet);
    if (savedProgress && hasValidPrayerProgress(currentMysterySet)) {
      // Create temporary engine to check progress
      const engine = new PrayerFlowEngine(currentMysterySet, language);
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
      const engine = new PrayerFlowEngine(currentMysterySet, language);
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

  const handleNavigateToProgress = () => {
    setCurrentScreen('progress');
  };

  const handleSelectRosary = () => {
    setCurrentScreen('home');
  };

  const handleBackToSelection = () => {
    setCurrentScreen('prayer-selection');
  };

  const handleSelectSacredPrayers = () => {
    setCurrentScreen('sacred-prayers');
  };

  const handleCompleteSacredPrayers = () => {
    // Logic for completing sacred prayers
    setCurrentScreen('sacred-complete');
  };

  const handleResetProgress = () => {
    clearSession();
    // This will reset both Rosary and Sacred Prayers progress
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
            onNavigateToProgress={handleNavigateToProgress}
            onNavigateToSelection={handleBackToSelection}
          />
        )}
        {currentScreen === 'mysteries' && (
          <MysteriesScreen
            onNavigateHome={handleNavigateToHome}
            onNavigateToPrayers={handleNavigateToPrayers}
            onStartPrayer={handleStartPrayer}
          />
        )}
        {currentScreen === 'prayers' && (
          <PrayersScreen
            onNavigateHome={handleNavigateToHome}
            onNavigateToMysteries={handleNavigateToMysteries}
            onStartPrayer={handleStartPrayer}
          />
        )}
        {currentScreen === 'progress' && (
          <ProgressScreen
            onNavigateHome={handleNavigateToHome}
            onNavigateToMysteries={handleNavigateToMysteries}
            onNavigateToPrayers={handleNavigateToPrayers}
            onStartPrayer={handleStartPrayer}
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
        {currentScreen === 'prayer-selection' && (
          <PrayerSelectionScreen
            onSelectRosary={handleSelectRosary}
            onSelectSacredPrayers={handleSelectSacredPrayers}
            onResetProgress={handleResetProgress}
          />
        )}
        {currentScreen === 'sacred-prayers' && (
          <SacredPrayersScreen
            onComplete={handleCompleteSacredPrayers}
            onBack={handleBackToSelection}
          />
        )}
        {currentScreen === 'sacred-complete' && (
          <SacredCompletionScreen onHome={handleBackToSelection} />
        )}
      </Suspense>
    </div>
  );
}

import { ToastProvider } from './context/ToastContext';

// ... (existing imports)

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
