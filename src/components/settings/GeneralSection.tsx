import { Languages, Trash2, ChevronRight } from 'lucide-react';

interface GeneralSectionProps {
    language: 'en' | 'es';
    onLanguageChange: (lang: 'en' | 'es') => void;
    onResetClick: () => void;
    showConfirmReset: boolean;
    translations: {
        general: string;
        language: string;
        clearProgress: string;
    };
    currentLanguage: string;
}

export function GeneralSection({
    language,
    onLanguageChange,
    onResetClick,
    showConfirmReset,
    translations,
    currentLanguage
}: GeneralSectionProps) {
    return (
        <section>
            <h2 className="settings-section-header">{translations.general}</h2>
            <div className="settings-card">
                {/* Language */}
                <button
                    className="settings-list-item"
                    onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
                >
                    <div className="settings-item-left">
                        <Languages className="settings-icon" size={20} />
                        <span className="settings-item-label">{translations.language}</span>
                    </div>
                    <div className="settings-item-right">
                        <span className="settings-item-value">{currentLanguage}</span>
                    </div>
                </button>

                {/* Clear Prayer Progress */}
                <button
                    className={`settings-list-item ${showConfirmReset ? 'settings-reset-item-confirm' : 'settings-reset-item'}`}
                    onClick={onResetClick}
                >
                    <div className="settings-item-left">
                        <Trash2 className="settings-icon settings-icon-red" size={20} />
                        <span className={`settings-item-label ${showConfirmReset ? 'settings-label-confirm' : 'settings-label-red'}`}>
                            {showConfirmReset
                                ? (language === 'es' ? '¡Haz clic de nuevo para confirmar!' : 'Click again to confirm!')
                                : translations.clearProgress
                            }
                        </span>
                    </div>
                    {!showConfirmReset && <ChevronRight className="settings-chevron" size={20} />}
                </button>
            </div>
        </section>
    );
}
