import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { mysterySets } from '../data/mysteries';
import { BottomNav } from './BottomNav';
import { loadPrayerProgress, hasValidPrayerProgress } from '../utils/storage';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysterySetType } from '../types';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import './MysteriesScreen.css';

interface MysteriesScreenProps {
    onNavigateHome: () => void;
    onNavigateToPrayers: () => void;
}

interface MysteryProgress {
    percentage: number;
    lastStep: string;
}

// Order mysteries to follow weekly schedule: Joyful, Sorrowful, Glorious, Luminous
// Defined outside component to avoid recreation on every render
const orderedMysteries = [
    mysterySets.find(m => m.type === 'joyful'),
    mysterySets.find(m => m.type === 'sorrowful'),
    mysterySets.find(m => m.type === 'glorious'),
    mysterySets.find(m => m.type === 'luminous'),
].filter((m): m is NonNullable<typeof m> => Boolean(m));

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

    // Memoize progress calculation to avoid instantiating PrayerFlowEngine on every render
    const progressData = useMemo(() => {
        const data: Record<string, MysteryProgress | null> = {};

        orderedMysteries.forEach(mysterySet => {
            const type = mysterySet.type;
            const progress = loadPrayerProgress(type);

            if (!progress || !hasValidPrayerProgress(type)) {
                data[type] = null;
                return;
            }

            // Create engine only when needed and inside useMemo
            // This is the expensive operation we want to minimize
            const engine = new PrayerFlowEngine(type as MysteryType, language);
            engine.jumpToStep(progress.currentStepIndex);

            data[type] = {
                percentage: Math.round(engine.getProgress()),
                lastStep: engine.getCurrentStep().title || ''
            };
        });

        return data;
    }, [language]);

    const handleTabChange = useNavigationHandler({
        onNavigateHome,
        onNavigateToPrayers
    });

    return (
        <div className="mysteries-container">
            <header className="mysteries-header">
                <h1 className="mysteries-title">{t.title}</h1>
            </header>

            <main className="mysteries-main">
                <div className="mysteries-grid">
                    {orderedMysteries.map((mysterySet) => {
                        const progress = progressData[mysterySet.type];

                        return (
                            <button
                                key={mysterySet.type}
                                className="mystery-card-btn"
                                onClick={() => handleMysterySelect(mysterySet.type)}
                            >
                                <div className={`mystery-card-gradient mystery-${mysterySet.type}`}>
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
                                    <h2 className="mystery-card-title">{mysterySet.name[language]}</h2>
                                    <p className="mystery-card-days">{getDaysText(mysterySet.days)}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>

            <div className="bottom-section">
                <BottomNav
                    activeTab="mysteries"
                    onTabChange={handleTabChange}
                />
            </div>
        </div>
    );
}
