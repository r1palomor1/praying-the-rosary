import { useState } from 'react';
import { Languages, Database, ChevronRight, ChevronDown, Download, RefreshCw, BookOpen, Trash2 } from 'lucide-react';
import { getBibleBackupDate } from '../../hooks/useBibleProgress';

interface GeneralSectionProps {
    language: 'en' | 'es';
    onLanguageChange: (lang: 'en' | 'es') => void;
    onResetClick: () => void;
    showConfirmReset: boolean;
    onResetBibleClick: () => void;
    showConfirmBibleReset: boolean;
    hasBibleBackupFlag: boolean;
    onRestoreBibleClick: () => void;
    onExportDataClick: () => void;
    onImportDataClick: () => void;
    translations: {
        general: string;
        language: string;
        resetBible: string;
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
    onExportDataClick,
    onImportDataClick,
    translations,
    currentLanguage
}: GeneralSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isEs = language === 'es';

    const backupDateIso = getBibleBackupDate();
    let backupDateText = '';
    if (backupDateIso) {
        try {
            const d = new Date(backupDateIso);
            const dateStr = d.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            backupDateText = isEs ? `( Última copia: ${dateStr} )` : `( Last Backup: ${dateStr} )`;
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <section>
            <h2 className="settings-section-header">{translations.general}</h2>
            <div className="settings-card">
                {/* Language */}
                <button
                    className="settings-list-item"
                    onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
                    style={{ borderBottom: '1px solid var(--settings-border)' }}
                >
                    <div className="settings-item-left">
                        <Languages className="settings-icon" size={20} />
                        <span className="settings-item-label">{translations.language}</span>
                    </div>
                    <div className="settings-item-right">
                        <span className="settings-item-value">{currentLanguage}</span>
                    </div>
                </button>

                {/* Collapsible Data Management Options */}
                <button
                    className="settings-list-item"
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ borderBottom: isExpanded ? '1px solid var(--settings-border)' : 'none' }}
                >
                    <div className="settings-item-left">
                        <Database className="settings-icon" size={20} />
                        <span className="settings-item-label">{isEs ? 'Gestión de Datos' : 'Data Management'}</span>
                    </div>
                    <div className="settings-item-right">
                        {isExpanded ? (
                            <ChevronDown className="settings-chevron" size={20} />
                        ) : (
                            <ChevronRight className="settings-chevron" size={20} />
                        )}
                    </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                    <div style={{ backgroundColor: 'var(--settings-bg)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                        
                        {/* BACKUP & RESTORE SECTION */}
                        <div style={{ padding: '1.25rem 1rem 0.5rem 1rem' }}>
                            <h3 style={{ color: '#D4AF37', fontSize: '0.70rem', fontWeight: 700, letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
                                {isEs ? 'Copia de Seguridad y Restaurar' : 'Backup & Restore'}
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Export Data */}
                            <button
                                className="settings-list-item"
                                onClick={onExportDataClick}
                                style={{ alignItems: 'flex-start', padding: '1rem', borderBottom: 'none' }}
                            >
                                <div className="settings-item-left" style={{ gap: '16px' }}>
                                    <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '10px', borderRadius: '50%', color: '#D4AF37' }}>
                                        <Download size={20} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <span className="settings-item-label" style={{ fontWeight: 600 }}>
                                            {isEs ? 'Exportar Datos Espirituales' : 'Export Spiritual Data'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--settings-text-secondary)', textAlign: 'left', lineHeight: '1.2' }}>
                                            {isEs ? 'Guarda tu progreso en un archivo seguro' : 'Save your app progress to a secure file'}
                                        </span>
                                    </div>
                                </div>
                                <div className="settings-item-right" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                                    <ChevronRight className="settings-chevron" size={18} />
                                </div>
                            </button>

                            {/* Import Data */}
                            <button
                                className="settings-list-item"
                                onClick={onImportDataClick}
                                style={{ alignItems: 'flex-start', padding: '1rem', borderTop: '1px solid var(--settings-border)', borderBottom: 'none' }}
                            >
                                <div className="settings-item-left" style={{ gap: '16px' }}>
                                    <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '10px', borderRadius: '50%', color: '#D4AF37' }}>
                                        <RefreshCw size={20} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <span className="settings-item-label" style={{ fontWeight: 600 }}>
                                            {isEs ? 'Importar Datos' : 'Import Data Backup'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--settings-text-secondary)', textAlign: 'left', lineHeight: '1.2' }}>
                                            {isEs ? 'Restaura progreso desde un archivo previo' : 'Restore progress from a previously saved file'}
                                        </span>
                                    </div>
                                </div>
                                <div className="settings-item-right" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                                    <ChevronRight className="settings-chevron" size={18} />
                                </div>
                            </button>

                            {/* Restore Bible Backup (Only if active) */}
                            {hasBibleBackupFlag && (
                                <button
                                    className="settings-list-item"
                                    onClick={onRestoreBibleClick}
                                    style={{ alignItems: 'flex-start', padding: '1rem', borderTop: '1px solid var(--settings-border)', borderBottom: 'none' }}
                                >
                                    <div className="settings-item-left" style={{ gap: '16px' }}>
                                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '50%', color: '#10B981' }}>
                                            <BookOpen size={20} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                            <span className="settings-item-label" style={{ fontWeight: 600 }}>
                                                {isEs ? 'Restaurar Progreso Bíblico' : 'Restore Bible Progress'}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--settings-text-secondary)', textAlign: 'left', lineHeight: '1.2' }}>
                                                {isEs ? `Deshaz tu último reinicio y restaura días activos ${backupDateText}` : `Undo your last Bible reset and restore your active days ${backupDateText}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="settings-item-right" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                                        <ChevronRight className="settings-chevron" size={18} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* RESET PROGRESS SECTION */}
                        <div style={{ padding: '1.5rem 1rem 0.5rem 1rem' }}>
                            <h3 style={{ color: '#ef4444', fontSize: '0.70rem', fontWeight: 700, letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
                                {isEs ? 'Reiniciar Progreso' : 'Reset Progress'}
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Clear Prayer Progress */}
                            <button
                                className="settings-list-item"
                                onClick={onResetClick}
                                style={{ alignItems: 'flex-start', padding: '1rem', borderBottom: 'none' }}
                            >
                                <div className="settings-item-left" style={{ gap: '16px' }}>
                                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
                                        <Trash2 size={20} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <span className="settings-item-label" style={{ fontWeight: 600 }}>
                                            {isEs ? 'Reiniciar Historial de Oración' : 'Reset Prayer History'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--settings-text-secondary)', textAlign: 'left', fontStyle: 'italic', lineHeight: '1.2' }}>
                                            {isEs ? 'Borra el progreso parcial activo del Rosario y Oraciones.' : 'Clears active Rosary and Sacred Prayers partial progress.'}
                                        </span>
                                    </div>
                                </div>
                                <div className="settings-item-right" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                                    {showConfirmReset ? (
                                        <span className="settings-item-value" style={{ color: '#ef4444', fontWeight: 600, paddingRight: '8px' }}>
                                            {isEs ? '¡Confirmar!' : 'Confirm!'}
                                        </span>
                                    ) : (
                                        <Trash2 className="settings-chevron" size={18} style={{ color: 'rgba(239, 68, 68, 0.6)' }} />
                                    )}
                                </div>
                            </button>

                            {/* Reset Bible in a Year Progress */}
                            <button
                                className="settings-list-item"
                                onClick={onResetBibleClick}
                                style={{ alignItems: 'flex-start', padding: '1rem', borderTop: '1px solid var(--settings-border)', borderBottom: 'none' }}
                            >
                                <div className="settings-item-left" style={{ gap: '16px' }}>
                                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
                                        <BookOpen size={20} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <span className="settings-item-label" style={{ fontWeight: 600 }}>
                                            {translations.resetBible}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--settings-text-secondary)', textAlign: 'left', fontStyle: 'italic', lineHeight: '1.2' }}>
                                            {isEs ? 'Borra el registro bíblico. Se creará un backup automático.' : 'Clears all Bible logs. An automatic backup will be created.'}
                                        </span>
                                    </div>
                                </div>
                                <div className="settings-item-right" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                                    {showConfirmBibleReset ? (
                                        <span className="settings-item-value" style={{ color: '#ef4444', fontWeight: 600, paddingRight: '8px' }}>
                                            {isEs ? '¡Confirmar!' : 'Confirm!'}
                                        </span>
                                    ) : (
                                        <Trash2 className="settings-chevron" size={18} style={{ color: 'rgba(239, 68, 68, 0.6)' }} />
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
