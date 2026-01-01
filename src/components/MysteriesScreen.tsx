import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { mysterySets } from '../data/mysteries';
import { BottomNav } from './BottomNav';
import { ConfirmModal } from './ConfirmModal';
import { loadPrayerProgress, hasValidPrayerProgress, clearPrayerProgress } from '../utils/storage';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import type { MysterySetType } from '../types';
import type { MysteryType } from '../utils/prayerFlowEngine';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import { sortMysteriesWithPriority, hasInProgressMystery } from '../utils/mysterySorting';
import { CheckCircle, Timer, X } from 'lucide-react';
import './MysteriesScreen.css';

interface MysteriesScreenProps {
    onNavigateHome: () => void;
    onNavigateToPrayers: () => void;
    onStartPrayer: () => void;
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

export function MysteriesScreen({ onNavigateHome, onNavigateToPrayers, onStartPrayer }: MysteriesScreenProps) {
    const { language, setCurrentMysterySet } = useApp();
    const [showClearModal, setShowClearModal] = useState(false);

    const translations = {
        en: {
            title: 'Mysteries',
            completed: 'Done',
            clearAll: 'Clear All Progress',
            clearAllTitle: 'Clear Progress',
            clearAllConfirm: 'Clear all mystery progress? Any completed mysteries will remain counted in your statistics.',
            confirm: 'Clear',
            cancel: 'Cancel',
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
            completed: 'Completado',
            clearAll: 'Borrar Todo el Progreso',
            clearAllTitle: 'Borrar Progreso',
            clearAllConfirm: '¿Borrar todo el progreso de misterios? Los misterios completados permanecerán contados en tus estadísticas.',
            confirm: 'Borrar',
            cancel: 'Cancelar',
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

    const handleMysteryClick = (mysteryType: MysterySetType) => {
        setCurrentMysterySet(mysteryType);

        // If there's saved progress, skip home and start prayer directly (auto-resumes)
        if (hasValidPrayerProgress(mysteryType)) {
            onStartPrayer();
        } else {
            // No progress, show intro/home page first
            onNavigateHome();
        }
    };

    const handleClearProgress = (e: React.MouseEvent, mysteryType: MysterySetType, mysteryName: string, isComplete: boolean) => {
        e.stopPropagation(); // Prevent card click

        const message = isComplete
            ? (language === 'es'
                ? `¿Reiniciar ${mysteryName}? Tu completación permanecerá contada en tus estadísticas.`
                : `Restart ${mysteryName}? Your completion will remain counted in your statistics.`)
            : (language === 'es'
                ? `¿Borrar progreso de ${mysteryName}? Esto reiniciará tu oración actual.`
                : `Clear progress for ${mysteryName}? This will reset your current prayer.`);

        if (window.confirm(message)) {
            clearPrayerProgress(mysteryType);
            // Force re-render by navigating home and back
            window.location.reload();
        }
    };

    const handleClearAllProgress = () => {
        setShowClearModal(true);
    };

    const confirmClearProgress = () => {
        // Clear all mystery types
        orderedMysteries.forEach(mysterySet => {
            clearPrayerProgress(mysterySet.type);
        });
        setShowClearModal(false);
        window.location.reload();
    };

    const getDaysText = (days: string[]) => {
        return days.map((day) => t.days[day as keyof typeof t.days]).join(' & ');
    };

    // Memoize progress calculation to avoid instantiating PrayerFlowEngine on every render
    // Include current date to ensure progress refreshes daily
    const currentDate = new Date().toISOString().split('T')[0];
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
    }, [language, currentDate]);

    // Smart sorting: In-progress first, then today's mystery, then traditional order
    const sortedMysteries = useMemo(() => {
        return sortMysteriesWithPriority(orderedMysteries, progressData);
    }, [progressData]);

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
                    {sortedMysteries.map((mysterySet) => {
                        const progress = progressData[mysterySet.type];
                        const isInProgress = hasInProgressMystery(mysterySet.type, progress?.percentage ?? null);
                        const isComplete = progress?.percentage === 100;

                        return (
                            <div key={mysterySet.type} className="mystery-card-wrapper">
                                <button
                                    className="mystery-card-btn"
                                    onClick={() => handleMysteryClick(mysterySet.type)}
                                >
                                    <div className="mystery-card-content">
                                        <h2 className="mystery-card-title">{mysterySet.name[language]}</h2>
                                        <p className="mystery-card-days">{getDaysText(mysterySet.days)}</p>
                                    </div>
                                </button>

                                {/* Status Badges - Outside button to avoid nesting */}
                                {isComplete ? (
                                    <div className="mystery-badge mystery-badge-done">
                                        <CheckCircle />
                                        <span>{t.completed}</span>
                                        <button
                                            className="mystery-badge-clear"
                                            onClick={(e) => handleClearProgress(e, mysterySet.type, mysterySet.name[language], true)}
                                            aria-label="Clear progress"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : isInProgress ? (
                                    <div className="mystery-badge mystery-badge-progress">
                                        <Timer />
                                        <span>{progress?.percentage}%</span>
                                        <button
                                            className="mystery-badge-clear"
                                            onClick={(e) => handleClearProgress(e, mysterySet.type, mysterySet.name[language], false)}
                                            aria-label="Clear progress"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                {/* Clear All Progress Button */}
                {(sortedMysteries.some(m => progressData[m.type] !== null)) && (
                    <div className="clear-all-container">
                        <button
                            className="btn-clear-all"
                            onClick={handleClearAllProgress}
                        >
                            {t.clearAll}
                        </button>
                    </div>
                )}
            </main>

            <div className="bottom-section">
                <BottomNav
                    activeTab="mysteries"
                    onTabChange={handleTabChange}
                    showProgress={false}
                />
            </div>

            <ConfirmModal
                isOpen={showClearModal}
                title={t.clearAllTitle}
                message={t.clearAllConfirm}
                confirmText={t.confirm}
                cancelText={t.cancel}
                onConfirm={confirmClearProgress}
                onCancel={() => setShowClearModal(false)}
            />
        </div>
    );
}

export default MysteriesScreen;
