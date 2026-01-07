import { useApp } from '../context/AppContext';
import { prayers } from '../data/prayers';
import { mysterySets } from '../data/mysteries';
import { BottomNav } from './BottomNav';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import { loadPrayerProgress } from '../utils/storage';
import { PrayerFlowEngine } from '../utils/prayerFlowEngine';
import './PrayersScreen.css';

interface PrayersScreenProps {
    onNavigateHome: () => void;
    onNavigateToMysteries: () => void;
    onStartPrayer: () => void;
    onNavigateToCompletion?: () => void;
}

export function PrayersScreen({ onNavigateHome, onNavigateToMysteries, onStartPrayer, onNavigateToCompletion }: PrayersScreenProps) {
    const { language, currentMysterySet } = useApp();

    const translations = {
        en: {
            title: 'Prayers',
            sections: {
                opening: 'Opening Prayers',
                sequence: 'Rosary Prayers',
                closing: 'Closing Prayers'
            },
            hailMaryWithCount: 'Hail Mary (Pray 10 times)',
            mysteries: {
                joyful: 'The Joyful Mysteries',
                luminous: 'The Luminous Mysteries',
                sorrowful: 'The Sorrowful Mysteries',
                glorious: 'The Glorious Mysteries'
            },
            completionPrompt: 'Prayed the Rosary using this page?',
            completionButton: 'I Completed the Rosary',
            alreadyCompleted: 'You have already prayed'
        },
        es: {
            title: 'Oraciones',
            sections: {
                opening: 'Oraciones Iniciales',
                sequence: 'Oraciones del Rosario',
                closing: 'Oraciones Finales'
            },
            hailMaryWithCount: 'Ave María (Reza 10 veces)',
            mysteries: {
                joyful: 'Misterios Gozosos',
                luminous: 'Misterios Luminosos',
                sorrowful: 'Misterios Dolorosos',
                glorious: 'Misterios Gloriosos'
            },
            completionPrompt: '¿Rezaste el Rosario usando esta página?',
            completionButton: 'Completé el Rosario',
            alreadyCompleted: 'Ya rezaste los'
        }
    };

    const t = translations[language];

    // Get mystery data from mysterySets
    const mysterySet = mysterySets.find(m => m.type === currentMysterySet);
    const mysteries = mysterySet?.mysteries || [];

    // Check if current mystery has been completed today
    const checkIfCompletedToday = () => {
        const progress = loadPrayerProgress(currentMysterySet);
        if (!progress) return false;

        const today = new Date().toISOString().split('T')[0];
        if (progress.date !== today) return false; // Different day

        // Check if it's at the last step (completed)
        const flowEngine = new PrayerFlowEngine(currentMysterySet as any, language);
        const totalSteps = flowEngine.getTotalSteps();
        const progressPercent = ((progress.currentStepIndex + 1) / totalSteps) * 100;

        return progressPercent >= 99; // Consider 99%+ as completed
    };

    const isAlreadyCompleted = checkIfCompletedToday();

    const renderPrayerSection = (title: string, prayerList: Record<string, any>) => (
        <div className="prayers-section">
            <h2 className="prayers-section-title">{title}</h2>
            {Object.values(prayerList).map((prayer: any, index) => (
                <div key={index} className="prayer-card">
                    <h3 className="prayer-name">{prayer.name[language]}</h3>
                    <p className="prayer-text">{prayer.text[language]}</p>
                </div>
            ))}
        </div>
    );

    const renderMysteriesCard = () => (
        <div className="prayer-card">
            <h3 className="prayer-name">{t.mysteries[currentMysterySet]}</h3>
            <div className="mysteries-list">
                {mysteries.map((mystery: any) => (
                    <div key={mystery.number} className="mystery-item">
                        <h4 className="mystery-title">
                            {`${mystery.number}. ${mystery.title[language]}`}
                            {mystery.fruit && (
                                <span className="mystery-fruit">
                                    {` ( Fruit: ${mystery.fruit[language]} )`}
                                </span>
                            )}
                        </h4>
                    </div>
                ))}
            </div>
        </div>
    );

    const handleTabChange = useNavigationHandler({
        onNavigateHome,
        onNavigateToMysteries
    });

    return (
        <div className="prayers-container">
            <header className="prayers-header">
                <h1 className="prayers-title">{t.title}</h1>
            </header>

            <main className="prayers-main">
                {renderPrayerSection(t.sections.opening, prayers.opening)}

                {/* Rosary Prayers Section - Split to insert mysteries */}
                <div className="prayers-section">
                    <h2 className="prayers-section-title">{t.sections.sequence}</h2>

                    {/* Our Father */}
                    <div className="prayer-card">
                        <h3 className="prayer-name">{prayers.sequence.ourFather.name[language]}</h3>
                        <p className="prayer-text">{prayers.sequence.ourFather.text[language]}</p>
                    </div>
                </div>

                {/* Mysteries Card */}
                {renderMysteriesCard()}

                {/* Rest of Rosary Prayers */}
                <div className="prayers-section">
                    {/* Hail Mary with count */}
                    <div className="prayer-card">
                        <h3 className="prayer-name">{t.hailMaryWithCount}</h3>
                        <p className="prayer-text">{prayers.sequence.hailMary.text[language]}</p>
                    </div>

                    {/* Glory Be */}
                    <div className="prayer-card">
                        <h3 className="prayer-name">{prayers.sequence.gloryBe.name[language]}</h3>
                        <p className="prayer-text">{prayers.sequence.gloryBe.text[language]}</p>
                    </div>

                    {/* O My Jesus */}
                    <div className="prayer-card">
                        <h3 className="prayer-name">{prayers.sequence.oMyJesus.name[language]}</h3>
                        <p className="prayer-text">{prayers.sequence.oMyJesus.text[language]}</p>
                    </div>
                </div>

                {renderPrayerSection(t.sections.closing, Object.fromEntries(
                    Object.entries(prayers.closing).filter(([key]) => key !== 'sacredFinalPrayer')
                ))}

                {/* Completion Section */}
                {onNavigateToCompletion && (
                    <div className="completion-section">
                        <div className="completion-card">
                            {isAlreadyCompleted ? (
                                <button
                                    className="completion-button completed"
                                    disabled
                                >
                                    {t.alreadyCompleted} {t.mysteries[currentMysterySet]}
                                </button>
                            ) : (
                                <>
                                    <p className="completion-prompt">📿 {t.completionPrompt}</p>
                                    <button
                                        className="completion-button"
                                        onClick={onNavigateToCompletion}
                                    >
                                        {t.completionButton}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <div className="bottom-nav-fixed-container">
                <BottomNav
                    activeTab="prayers"
                    onTabChange={handleTabChange}
                    onStartPrayer={onStartPrayer}
                    showProgress={false}
                />
            </div>
        </div>
    );
}

export default PrayersScreen;
