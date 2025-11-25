import { useApp } from '../context/AppContext';
import { prayers } from '../data/prayers';
import { BottomNav } from './BottomNav';
import './PrayersScreen.css';

interface PrayersScreenProps {
    onNavigateHome: () => void;
    onNavigateToMysteries: () => void;
}

export function PrayersScreen({ onNavigateHome, onNavigateToMysteries }: PrayersScreenProps) {
    const { language } = useApp();

    const translations = {
        en: {
            title: 'Prayers',
            sections: {
                opening: 'Opening Prayers',
                sequence: 'Rosary Prayers',
                closing: 'Closing Prayers'
            }
        },
        es: {
            title: 'Oraciones',
            sections: {
                opening: 'Oraciones Iniciales',
                sequence: 'Oraciones del Rosario',
                closing: 'Oraciones Finales'
            }
        }
    };

    const t = translations[language];

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

    return (
        <div className="prayers-container">
            <header className="prayers-header">
                <h1 className="prayers-title">{t.title}</h1>
            </header>

            <main className="prayers-main">
                {renderPrayerSection(t.sections.opening, prayers.opening)}
                {renderPrayerSection(t.sections.sequence, prayers.sequence)}
                {renderPrayerSection(t.sections.closing, prayers.closing)}
            </main>

            <BottomNav
                activeTab="prayers"
                onTabChange={(tab) => {
                    if (tab === 'home') onNavigateHome();
                    if (tab === 'mysteries') onNavigateToMysteries();
                }}
            />
        </div>
    );
}
