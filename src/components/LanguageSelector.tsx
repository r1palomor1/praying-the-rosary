
import { useApp } from '../context/AppContext';
import type { Language } from '../types';
import './LanguageSelector.css';

export function LanguageSelector() {
    const { setLanguage } = useApp();

    const handleLanguageSelect = (lang: Language) => {
        setLanguage(lang);
    };

    return (
        <div className="language-selector-container">
            <div className="language-selector-content">
                <h1 className="language-selector-title">Welcome to Praying the Rosary</h1>
                <p className="language-selector-subtitle">Bienvenido a Rezando el Rosario</p>

                <div className="language-options">
                    <button
                        className="language-option"
                        onClick={() => handleLanguageSelect('en')}
                    >
                        <span className="language-flag">🇺🇸</span>
                        <span className="language-name">English</span>
                    </button>

                    <button
                        className="language-option"
                        onClick={() => handleLanguageSelect('es')}
                    >
                        <span className="language-flag">🇪🇸</span>
                        <span className="language-name">Español</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
