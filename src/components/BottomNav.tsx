import { CalendarCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './BottomNav.css';

interface BottomNavProps {
    activeTab: 'home' | 'progress' | 'mysteries' | 'prayers' | 'settings';
    onTabChange?: (tab: 'home' | 'progress' | 'mysteries' | 'prayers' | 'settings') => void;
    onStartPrayer?: () => void;
    showProgress?: boolean; // true = show Progress icon, false = show Home icon
}

export function BottomNav({ activeTab, onTabChange, onStartPrayer, showProgress = false }: BottomNavProps) {
    const { language } = useApp();

    const translations = {
        en: {
            home: 'Home',
            progress: 'Progress',
            mysteries: 'Mysteries',
            prayers: 'Prayers',
            start: 'Pray'
        },
        es: {
            home: 'Inicio',
            progress: 'Progreso',
            mysteries: 'Misterios',
            prayers: 'Oraciones',
            start: 'Rezar'
        }
    };

    const t = translations[language];

    const handleTabClick = (tab: 'home' | 'progress' | 'mysteries' | 'prayers' | 'settings') => {
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    return (
        <nav className="bottom-nav">
            {/* First tab: Either Progress (on Home) or Home (on other pages) */}
            {showProgress ? (
                <button
                    className={`nav-tab ${activeTab === 'progress' ? 'active' : ''}`}
                    onClick={() => handleTabClick('progress')}
                    aria-label={t.progress}
                >
                    <CalendarCheck size={24} strokeWidth={2} />
                    <span className="nav-label">{t.progress}</span>
                </button>
            ) : (
                <button
                    className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => handleTabClick('home')}
                    aria-label={t.home}
                >
                    <span className="material-icons">home</span>
                    <span className="nav-label">{t.home}</span>
                </button>
            )}

            <button
                className={`nav-tab ${activeTab === 'mysteries' ? 'active' : ''}`}
                onClick={() => handleTabClick('mysteries')}
                aria-label={t.mysteries}
            >
                <span className="material-icons">auto_stories</span>
                <span className="nav-label">{t.mysteries}</span>
            </button>

            <button
                className={`nav-tab ${activeTab === 'prayers' ? 'active' : ''}`}
                onClick={() => handleTabClick('prayers')}
                aria-label={t.prayers}
            >
                <span className="material-icons">book</span>
                <span className="nav-label">{t.prayers}</span>
            </button>

            <button
                className="nav-tab start-action-tab"
                onClick={onStartPrayer}
                aria-label={t.start}
            >
                <span className="material-icons">play_arrow</span>
                <span className="nav-label">{t.start}</span>
            </button>
        </nav>
    );
}
