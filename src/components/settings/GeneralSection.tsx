import { useState } from 'react';
import { Languages, Trash2, ChevronRight, ChevronDown, Database } from 'lucide-react';

interface GeneralSectionProps {
    language: 'en' | 'es';
    onLanguageChange: (lang: 'en' | 'es') => void;
    onResetClick: () => void;
    showConfirmReset: boolean;
    onResetBibleClick: () => void;
    showConfirmBibleReset: boolean;
    hasBibleBackupFlag: boolean;
    onRestoreBibleClick: () => void;
    translations: {
        general: string;
        language: string;
        clearProgress: string;
        resetOptions: string;
        resetBible: string;
        restoreBibleBackup: string;
    };
    currentLanguage: string;
}

export function GeneralSection({
    language,
    onLanguageChange,
    onResetClick,
    showConfirmReset,
    onResetBibleClick,
    showConfirmBibleReset,
    hasBibleBackupFlag,
    onRestoreBibleClick,
    translations,
    currentLanguage
}: GeneralSectionProps) {
    const [showResets, setShowResets] = useState(false);

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

                {/* Collapsible Reset Options */}
                <button
                    className="settings-list-item"
                    onClick={() => setShowResets(!showResets)}
                    style={{ borderBottom: showResets ? '1px solid var(--settings-border)' : 'none' }}
                >
                    <div className="settings-item-left">
                        <Database className="settings-icon" size={20} />
                        <span className="settings-item-label">{translations.resetOptions}</span>
                    </div>
                    <div className="settings-item-right">
                        {showResets ? (
                            <ChevronDown className="settings-chevron" size={20} />
                        ) : (
                            <ChevronRight className="settings-chevron" size={20} />
                        )}
                    </div>
                </button>

                {showResets && (
                    <div style={{ backgroundColor: 'var(--settings-bg)', padding: '0.5rem 0' }}>
                        {/* Clear Prayer Progress */}
                        <button
                            className="settings-list-item"
                            onClick={onResetClick}
                            style={{ paddingLeft: '2.5rem', borderBottom: 'none' }}
                        >
                            <div className="settings-item-left">
                                <Trash2 className="settings-icon" size={18} />
                                <span className="settings-item-label" style={{ fontSize: '0.9rem' }}>
                                    {translations.clearProgress}
                                </span>
                            </div>
                            <div className="settings-item-right">
                                {showConfirmReset ? (
                                    <span className="settings-item-value" style={{ color: '#ef4444', fontWeight: 600 }}>
                                        {language === 'es' ? '¡Confirmar!' : 'Confirm!'}
                                    </span>
                                ) : (
                                    <ChevronRight className="settings-chevron" size={18} />
                                )}
                            </div>
                        </button>

                        {/* Reset Bible in a Year Progress */}
                        <button
                            className="settings-list-item"
                            onClick={onResetBibleClick}
                            style={{ paddingLeft: '2.5rem', borderBottom: 'none' }}
                        >
                            <div className="settings-item-left">
                                <Trash2 className="settings-icon" size={18} style={{ color: '#ef4444' }} />
                                <span className="settings-item-label" style={{ fontSize: '0.9rem' }}>
                                    {translations.resetBible}
                                </span>
                            </div>
                            <div className="settings-item-right">
                                {showConfirmBibleReset ? (
                                    <span className="settings-item-value" style={{ color: '#ef4444', fontWeight: 600 }}>
                                        {language === 'es' ? '¡Confirmar!' : 'Confirm!'}
                                    </span>
                                ) : (
                                    <ChevronRight className="settings-chevron" size={18} />
                                )}
                            </div>
                        </button>

                        {/* Restore Bible Backup (Only if available) */}
                        {hasBibleBackupFlag && (
                            <button
                                className="settings-list-item"
                                onClick={onRestoreBibleClick}
                                style={{ paddingLeft: '2.5rem', borderBottom: 'none' }}
                            >
                                <div className="settings-item-left">
                                    <span className="settings-item-label" style={{ color: '#10B981', marginLeft: '28px', fontSize: '0.9rem' }}>
                                        {translations.restoreBibleBackup}
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
