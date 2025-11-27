import { useApp } from '../context/AppContext';
import './BottomNav.css';

interface BottomNavProps {
    activeTab: 'home' | 'mysteries' | 'prayers' | 'settings';
    onTabChange?: (tab: 'home' | 'mysteries' | 'prayers' | 'settings') => void;
    onStartPrayer?: () => void;
}

export function BottomNav({ activeTab, onTabChange, onStartPrayer }: BottomNavProps) {
    const { language } = useApp();

    const translations = {
        en: {
            home: 'Home',
            mysteries: 'Mysteries',
            prayers: 'Prayers',
            start: 'Start'
        },
        es: {
            home: 'Inicio',
            mysteries: 'Misterios',
            prayers: 'Oraciones',
            start: 'Rezar'
        }
    };

    const t = translations[language];

    const handleTabClick = (tab: 'home' | 'mysteries' | 'prayers' | 'settings') => {
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    return (
        <nav className="bottom-nav">
            <button
                className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleTabClick('home')}
                aria-label={t.home}
            >
                <span className="material-icons">home</span>
                <span className="nav-label">{t.home}</span>
            </button>

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
