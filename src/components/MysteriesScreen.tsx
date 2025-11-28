import { useApp } from '../context/AppContext';
import { mysterySets } from '../data/mysteries';
import { BottomNav } from './BottomNav';
import { loadPrayerProgress, hasValidPrayerProgress } from '../utils/storage';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysterySetType } from '../types';
import type { MysteryType } from '../utils/prayerFlowEngine';
import './MysteriesScreen.css';

interface MysteriesScreenProps {
    onNavigateHome: () => void;
    onNavigateToPrayers: () => void;
}

interface MysteryProgress {
    percentage: number;
    lastStep: string;
}

export function MysteriesScreen({ onNavigateHome, onNavigateToPrayers }: MysteriesScreenProps) {
    const { language, setCurrentMysterySet } = useApp();

    const translations = {
        en: {
            title: 'Mysteries',
            completed: 'completed',
            days: {
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday',
            },
        },
        es: {
            title: 'Misterios',
            completed: 'completado',
            days: {
                monday: 'Lunes',
                tuesday: 'Martes',
                wednesday: 'Miércoles',
                thursday: 'Jueves',
                friday: 'Viernes',
                saturday: 'Sábado',
                sunday: 'Domingo',
            },
        },
    };

    const t = translations[language];

    const handleMysterySelect = (mysteryType: MysterySetType) => {
        setCurrentMysterySet(mysteryType);
        onNavigateHome();
    };

    const getDaysText = (days: string[]) => {
        return days.map((day) => t.days[day as keyof typeof t.days]).join(' & ');
    };

    // Get progress for a specific mystery type
    const getMysteryProgress = (mysteryType: MysterySetType): MysteryProgress | null => {
        const progress = loadPrayerProgress(mysteryType);
        if (!progress || !hasValidPrayerProgress(mysteryType)) {
            return null;
        }

        // Create a temporary engine to get progress info
        const engine = new PrayerFlowEngine(mysteryType as MysteryType, language);
        engine.jumpToStep(progress.currentStepIndex);

        const percentage = Math.round(engine.getProgress());
        const currentStep = engine.getCurrentStep();
        const lastStep = currentStep.title || '';

        return {
            percentage,
            lastStep
        };
    };

    // Order mysteries to follow weekly schedule: Joyful, Sorrowful, Glorious, Luminous
    const orderedMysteries = [
        mysterySets.find(m => m.type === 'joyful'),
        mysterySets.find(m => m.type === 'sorrowful'),
        mysterySets.find(m => m.type === 'glorious'),
        mysterySets.find(m => m.type === 'luminous'),
    ].filter(Boolean);

    return (
        <div className="mysteries-container">
            <header className="mysteries-header">
                <h1 className="mysteries-title">{t.title}</h1>
            </header>

            <main className="mysteries-main">
                <div className="mysteries-grid">
                    {orderedMysteries.map((mysterySet) => {
                        const progress = getMysteryProgress(mysterySet!.type);

                        return (
                            <button
                                key={mysterySet!.type}
                                className="mystery-card-btn"
                                onClick={() => handleMysterySelect(mysterySet!.type)}
                            >
                                <div className={`mystery-card-gradient mystery-${mysterySet!.type}`}>
                                    {progress && (
                                        <div className="mystery-progress-overlay">
                                            <div className="mystery-progress-percentage">
                                                {progress.percentage}% {t.completed}
                                            </div>
                                            <div className="mystery-progress-step">
                                                {progress.lastStep}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mystery-card-content">
                                    <h2 className="mystery-card-title">{mysterySet!.name[language]}</h2>
                                    <p className="mystery-card-days">{getDaysText(mysterySet!.days)}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>

            <div className="bottom-section">
                <BottomNav
                    activeTab="mysteries"
                    onTabChange={(tab) => {
                        if (tab === 'home') {
                            onNavigateHome();
                        } else if (tab === 'prayers') {
                            onNavigateToPrayers();
                        }
                    }}
                />
            </div>
        </div>
    );
}
