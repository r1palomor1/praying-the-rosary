# Feature Preservation Document

This document contains the source code and logic for features developed after commit `770088c`. This will be used to re-integrate these features after reverting to a stable state.

## 1. Learn More Feature

### `src/components/LearnMoreModal.tsx`
```tsx
import React from 'react';
import { X, BookOpen, Heart, Lightbulb, Anchor, History, Sparkles } from 'lucide-react';
import './LearnMoreModal.css';

export interface GlobalContent {
    title: string;
    theological_foundation: string;
    gospel_compendium: string;
}

export interface MysteryContent {
    mystery_name: string;
    mystery_number: number;
    title: string;
    meaning: string;
    scripture_primary: string;
    scripture_secondary: string;
    fruit: string;
    fruit_explanation: string;
    life_application: string;
    meditation: string;
    deeper_theology: string;
    historical_context: string;
    mary_and_christ_role: string;
    virtue_formation: string;
}

export type EducationalContent = GlobalContent | MysteryContent;

interface LearnMoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: EducationalContent | null;
    language: 'en' | 'es';
}

export function LearnMoreModal({ isOpen, onClose, data, language }: LearnMoreModalProps) {
    if (!isOpen || !data) return null;

    const t = language === 'es' ? {
        title: 'Profundizar',
        meaning: 'Significado',
        scripture: 'Sagradas Escrituras',
        fruit: 'Fruto Espiritual',
        meditation: 'Meditación',
        theology: 'Teología Profunda',
        application: 'Aplicación de Vida',
        history: 'Contexto Histórico',
        close: 'Cerrar'
    } : {
        title: 'Learn More',
        meaning: 'Meaning',
        scripture: 'Scripture',
        fruit: 'Spiritual Fruit',
        meditation: 'Meditation',
        theology: 'Deeper Theology',
        application: 'Life Application',
        history: 'Historical Context',
        close: 'Close'
    };

    const [activeTab, setActiveTab] = React.useState<'context' | 'reflection'>('context');

    // Reset tab when data changes
    React.useEffect(() => {
        setActiveTab('context');
    }, [data]);

    const isGlobal = (content: EducationalContent): content is GlobalContent => {
        return 'theological_foundation' in content;
    };

    if (isGlobal(data)) {
        return (
            <div className="learn-more-overlay" onClick={onClose}>
                <div className="learn-more-content" onClick={(e) => e.stopPropagation()}>
                    <header className="learn-more-header">
                        <div className="header-title-container">
                            <Lightbulb className="header-icon" size={24} />
                            <h2>{t.title}</h2>
                        </div>
                        <button className="btn-close-learn-more" onClick={onClose} aria-label={t.close}>
                            <X size={24} />
                        </button>
                    </header>
                    <main className="learn-more-body">
                        <h1 className="mystery-title-large">{data.title}</h1>
                        <section className="info-section">
                            <div className="section-header">
                                <Anchor size={20} />
                                <h3>{language === 'es' ? 'Fundamento Teológico' : 'Theological Foundation'}</h3>
                            </div>
                            <p>{data.theological_foundation}</p>
                        </section>
                        <section className="info-section">
                            <div className="section-header">
                                <BookOpen size={20} />
                                <h3>{language === 'es' ? 'Compendio del Evangelio' : 'Gospel Compendium'}</h3>
                            </div>
                            <p>{data.gospel_compendium}</p>
                        </section>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="learn-more-overlay" onClick={onClose}>
            <div className="learn-more-content" onClick={(e) => e.stopPropagation()}>
                <header className="learn-more-header">
                    <div className="header-title-container">
                        <Lightbulb className="header-icon" size={24} />
                        <h2>{t.title}</h2>
                    </div>
                    <button className="btn-close-learn-more" onClick={onClose} aria-label={t.close}>
                        <X size={24} />
                    </button>
                </header>

                <main className="learn-more-body">
                    <h1 className="mystery-title-large">{data.title}</h1>

                    <div className="learn-more-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'context' ? 'active' : ''}`}
                            onClick={() => setActiveTab('context')}
                        >
                            {language === 'es' ? 'Contexto' : 'Context'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'reflection' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reflection')}
                        >
                            {language === 'es' ? 'Reflexión' : 'Reflection'}
                        </button>
                    </div>

                    {activeTab === 'context' ? (
                        <div className="tab-content fade-in">
                            <section className="info-section highlight-section">
                                <p className="meaning-text">{data.meaning}</p>
                            </section>

                            <section className="info-card">
                                <div className="card-header">
                                    <BookOpen size={18} />
                                    <h3>{t.scripture}</h3>
                                </div>
                                <div className="card-body">
                                    <p className="scripture-ref primary">{data.scripture_primary}</p>
                                    {data.scripture_secondary && (
                                        <p className="scripture-ref secondary">{data.scripture_secondary}</p>
                                    )}
                                </div>
                            </section>

                            <section className="info-section">
                                <div className="section-header">
                                    <History size={20} />
                                    <h3>{t.history}</h3>
                                </div>
                                <p>{data.historical_context}</p>
                            </section>

                            <section className="info-section">
                                <div className="section-header">
                                    <Anchor size={20} />
                                    <h3>{language === 'es' ? 'Rol de Cristo y María' : 'Role of Christ & Mary'}</h3>
                                </div>
                                <p>{data.mary_and_christ_role}</p>
                            </section>
                        </div>
                    ) : (
                        <div className="tab-content fade-in">
                            <section className="info-card">
                                <div className="card-header">
                                    <Heart size={18} />
                                    <h3>{t.fruit}: {data.fruit}</h3>
                                </div>
                                <div className="card-body">
                                    <p>{data.fruit_explanation}</p>
                                </div>
                            </section>

                            <section className="info-section">
                                <div className="section-header">
                                    <Sparkles size={20} />
                                    <h3>{t.meditation}</h3>
                                </div>
                                <p>{data.meditation}</p>
                            </section>

                            <section className="info-section">
                                <div className="section-header">
                                    <Anchor size={20} />
                                    <h3>{t.theology}</h3>
                                </div>
                                <p>{data.deeper_theology}</p>
                            </section>

                            <section className="info-section application-section">
                                <h3>{t.application}</h3>
                                <p>{data.life_application}</p>
                                <div className="virtue-tag">
                                    <span className="label">{language === 'es' ? 'Virtud:' : 'Virtue:'}</span>
                                    <span className="value">{data.virtue_formation}</span>
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
```

### `src/components/LearnMoreModal.css`
```css
.learn-more-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    animation: fadeIn 0.3s ease-out;
}

@media (min-width: 768px) {
    .learn-more-overlay {
        align-items: center;
        padding: 2rem;
    }
}

.learn-more-content {
    background: var(--color-bg-card);
    width: 100%;
    max-width: 800px;
    height: 90vh;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
    border: 1px solid var(--color-border-light);
    animation: slideUp 0.3s ease-out;
}

@media (min-width: 768px) {
    .learn-more-content {
        height: 85vh;
        border-radius: 24px;
        animation: scaleIn 0.3s ease-out;
    }
}

/* Header */
.learn-more-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border-light);
    background: var(--color-bg-card);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
}

.header-title-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-gold);
}

.header-icon {
    color: var(--color-gold);
}

.learn-more-header h2 {
    font-family: var(--font-display);
    font-size: 1.25rem;
    margin: 0;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.btn-close-learn-more {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s;
}

.btn-close-learn-more:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
}

/* Body */
.learn-more-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.mystery-title-large {
    font-family: var(--font-display);
    font-size: 1.75rem;
    color: var(--color-text-primary);
    text-align: center;
    margin-bottom: 0.5rem;
    line-height: 1.3;
}

/* Tabs */
.learn-more-tabs {
    display: flex;
    gap: 1rem;
    padding: 0.25rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.tab-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 0.75rem;
    color: var(--color-text-secondary);
    font-family: var(--font-display);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}

.tab-btn:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
    background: var(--color-gold);
    color: #000;
    font-weight: bold;
}

.tab-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.fade-in {
    animation: fadeIn 0.3s ease-out;
}

/* Sections */
.info-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-gold);
    margin-bottom: 0.25rem;
}

.section-header h3 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-section p {
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 0;
}

/* Highlight Section (Meaning) */
.highlight-section {
    background: rgba(212, 175, 55, 0.1);
    padding: 1.25rem;
    border-radius: 12px;
    border-left: 4px solid var(--color-gold);
}

.meaning-text {
    font-size: 1.1rem !important;
    color: var(--color-text-primary) !important;
    font-style: italic;
}

/* Grid for Cards */
.grid-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

@media (min-width: 640px) {
    .grid-section {
        grid-template-columns: 1fr 1fr;
    }
}

.info-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border-light);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-gold);
    margin-bottom: 0.25rem;
}

.card-header h3 {
    font-family: var(--font-display);
    font-size: 0.9rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.card-body p {
    font-size: 0.95rem;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
}

.scripture-ref {
    font-family: var(--font-display);
}

.scripture-ref.primary {
    color: var(--color-text-primary);
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
}

.scripture-ref.secondary {
    font-size: 0.9rem;
    opacity: 0.8;
}

/* Subsection */
.subsection {
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border-light);
}

.subsection h4 {
    font-family: var(--font-display);
    font-size: 0.9rem;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
}

/* Application Section */
.application-section {
    background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
    padding: 1.5rem;
    border-radius: 16px;
    border: 1px solid var(--color-border-light);
}

.application-section h3 {
    font-family: var(--font-display);
    font-size: 1.2rem;
    color: var(--color-gold);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    text-align: center;
}

.virtue-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-gold);
    color: #000;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    margin-top: 1rem;
    font-weight: bold;
    font-size: 0.9rem;
}

.virtue-tag .label {
    opacity: 0.7;
    text-transform: uppercase;
    font-size: 0.75rem;
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
```

### `src/components/MysteryScreen.tsx` (Integration Logic)
**Key Changes:**
1.  **Imports:**
    ```tsx
    import educationalDataEs from '../data/es-rosary-educational-content.json';
    import educationalDataEn from '../data/en-rosary-educational-content.json';
    import { LearnMoreModal, type EducationalContent } from './LearnMoreModal';
    ```
2.  **State:**
    ```tsx
    const [showLearnMore, setShowLearnMore] = useState(false);
    ```
3.  **Data Retrieval Logic:**
    ```tsx
    // Get current educational data
    const currentData = language === 'es' ? educationalDataEs : educationalDataEn;

    // Helper to get current educational content
    const getCurrentEducationalContent = (): EducationalContent | null => {
        const decadeInfo = flowEngine.getCurrentDecadeInfo();

        const mysteryNameMap: Record<string, Record<string, string>> = {
            'es': {
                'joyful': 'Misterios Gozosos',
                'luminous': 'Misterios Luminosos',
                'sorrowful': 'Misterios Dolorosos',
                'glorious': 'Misterios Gloriosos'
            },
            'en': {
                'joyful': 'Joyful Mysteries',
                'luminous': 'Luminous Mysteries',
                'sorrowful': 'Sorrowful Mysteries',
                'glorious': 'Glorious Mysteries'
            }
        };

        if (decadeInfo) {
            const targetName = mysteryNameMap[language]?.[currentMysterySet];
            if (!targetName) return null;

            // Find matching data in JSON
            // Note: The JSON uses 1-based indexing for mystery_number
            const data = currentData.mysteries.find((item: any) =>
                item.mystery_name === targetName &&
                item.mystery_number === decadeInfo.number
            );
            return (data as EducationalContent) || null;
        }

        // If not in a decade (start or end), show global intro
        return currentData.global_intro as EducationalContent;
    };

    const currentEducationalData = getCurrentEducationalContent();
    const hasEducationalContent = !!currentEducationalData;
    ```
4.  **UI Button (Bottom Nav):**
    ```tsx
    <button
        className={`mystery-nav-btn ${!hasEducationalContent ? 'nav-btn-dimmed' : ''}`}
        onClick={() => hasEducationalContent && setShowLearnMore(true)}
        disabled={!hasEducationalContent}
        aria-label={t.learnMore}
        title={t.learnMore}
    >
        <Lightbulb size={24} strokeWidth={hasEducationalContent ? 2 : 1.5} />
        <span className="mystery-nav-label">{t.learnMore}</span>
    </button>
    ```
5.  **Modal Rendering:**
    ```tsx
    <LearnMoreModal
        isOpen={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        data={currentEducationalData}
        language={language}
    />
    ```

## 2. Clear Progress Logic

### `src/components/SettingsModal.tsx`
**Updated `handleClearProgress`:**
```tsx
const handleClearProgress = () => {
    let message = '';
    if (language === 'es') {
        message = currentMysteryName
            ? `¿Estás seguro de que quieres borrar el progreso de ${currentMysteryName}?`
            : '¿Estás seguro de que quieres borrar todo el progreso de oración?';
    } else {
        message = currentMysteryName
            ? `Are you sure you want to clear progress for ${currentMysteryName}?`
            : 'Are you sure you want to clear all prayer progress?';
    }

    if (window.confirm(message)) {
        console.log('Confirmed. Clearing data...');

        // If a specific reset handler is provided (e.g., from MysteryScreen), use it
        if (onResetProgress) {
            onResetProgress();
            onClose();
            return;
        }

        // Fallback: Global Clear (e.g., from Home Screen)
        // Debug: Log keys before
        const keysBefore = Object.keys(localStorage);
        console.log('Keys before:', keysBefore);

        // 1. Aggressive Clear
        // Clear via utility
        clearPrayerProgress();
        clearLocalStorageSession();

        // Clear specific known keys manually to be absolutely sure
        try {
            localStorage.removeItem('rosary_session');
            localStorage.removeItem('rosary_prayer_progress');
            // Clear all mystery-specific keys found in the snapshot
            keysBefore.forEach(key => {
                if (key.startsWith('rosary_prayer_progress') || key.startsWith('rosary_session')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.error('Manual clear failed:', e);
        }

        // Debug: Log keys after
        console.log('Keys after:', Object.keys(localStorage));

        // 2. Force Hard Reset to Home
        window.location.href = '/';
    }
};
```

### `src/components/MysteryScreen.tsx` (Reset Logic)
```tsx
// Handle resetting progress for current mystery
const handleResetProgress = () => {
    console.log('[MysteryScreen] Resetting progress for', currentMysterySet);

    // 1. Clear storage for this mystery
    clearPrayerProgress(currentMysterySet);

    // 2. Reset flow engine to step 0
    flowEngine.jumpToStep(0);

    // 3. Update local state to reflect step 0
    const initialStep = flowEngine.getCurrentStep();
    setCurrentStep(initialStep);

    // 4. Close settings
    setShowSettings(false);

    // 5. Ensure continuous mode is off
    setContinuousMode(false);
    stopAudio();
};
```

## 3. Style Updates

### `src/components/MysteryBottomNav.css`
```css
/* Fixed Bottom Navigation Bar */
.mystery-bottom-nav {
    display: flex;
    justify-content: space-between;
    /* Changed from flex-start to space-between */
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-elevated);
    border-top: 1px solid var(--color-border-light);
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
}

[data-theme="dark"] .mystery-bottom-nav {
    background: rgba(16, 22, 34, 0.95);
    border-top-color: rgba(255, 255, 255, 0.1);
}

.mystery-nav-center {
    display: flex;
    gap: var(--spacing-xl);
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}
/* ... rest of file ... */
```

## 4. Other Fixes

### `src/components/MysteryScreen.tsx` (Intro Prayer Fix)
```tsx
const isIntroPrayer = ['The Sign of the Cross', 'Apostles\' Creed', 'La Señal de la Cruz', 'Credo de los Apóstoles'].includes(currentStep.title || '');
```
