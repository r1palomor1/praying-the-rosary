import { Languages, History } from 'lucide-react';

interface GeneralSectionProps {
    language: 'en' | 'es';
    onLanguageClick: () => void;
    onResetClick: () => void;
    translations: {
        general: string;
        language: string;
        clearProgress: string;
    };
    currentLanguage: string;
}

export function GeneralSection({
    onLanguageClick,
    onResetClick,
    translations,
    currentLanguage
}: GeneralSectionProps) {
    return (
        <section>
            <h2 className="settings-section-header">
                {translations.general}
            </h2>
            <div className="settings-card">
                {/* Language */}
                <button
                    className="settings-list-item"
                    onClick={onLanguageClick}
                >
                    <div className="settings-item-left">
                        <Languages className="settings-icon" size={20} />
                        <span className="settings-item-label">{translations.language}</span>
                    </div>
                    <div className="settings-item-right">
                        <span className="settings-item-value">{currentLanguage}</span>
                        <span className="settings-chevron">›</span>
                    </div>
                </button>

                {/* Prayer Progress Reset */}
                <button
                    className="settings-list-item"
                    onClick={onResetClick}
                >
                    <div className="settings-item-left">
                        <History className="settings-icon" size={20} />
                        <span className="settings-item-label">Prayer Progress</span>
                    </div>
                    <div className="settings-item-right">
                        <span className="settings-item-value settings-reset-text">Reset</span>
                        <span className="settings-chevron">›</span>
                    </div>
                </button>
            </div>
        </section>
    );
}
