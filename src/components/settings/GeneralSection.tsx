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
                    className="settings-list-item"
                    onClick={onResetClick}
                >
                    <div className="settings-item-left">
                        <Trash2 className="settings-icon" size={20} />
                        <span className="settings-item-label">
                            {translations.clearProgress}
                        </span>
                    </div>
                    <div className="settings-item-right">
                        {showConfirmReset ? (
                            <span className="settings-item-value" style={{ color: '#ef4444', fontWeight: 600 }}>
                                {language === 'es' ? '¡Confirmar!' : 'Confirm!'}
                            </span>
                        ) : (
                            <ChevronRight className="settings-chevron" size={20} />
                        )}
                    </div>
                </button>
            </div>
        </section>
    );
}
