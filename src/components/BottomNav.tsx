import { useApp } from '../context/AppContext';
import './BottomNav.css';

interface BottomNavProps {
    activeTab: 'home' | 'mysteries' | 'prayers' | 'settings';
    onTabChange?: (tab: 'home' | 'mysteries' | 'prayers' | 'settings') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const { language } = useApp();

    const translations = {
        en: {
            home: 'Home',
            mysteries: 'Mysteries',
            prayers: 'Prayers',
            settings: 'Placeholder'
        },
        es: {
            home: 'Inicio',
            mysteries: 'Misterios',
            prayers: 'Oraciones',
            settings: 'Marcador'
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
                className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabClick('settings')}
                aria-label={t.settings}
            >
                <span className="material-icons">more_horiz</span>
                <span className="nav-label">{t.settings}</span>
            </button>
        </nav>
    );
}
