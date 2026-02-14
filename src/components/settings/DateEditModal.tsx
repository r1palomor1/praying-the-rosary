import { X, Calendar } from 'lucide-react';
import { useState } from 'react';

interface DateEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    rosaryStartDate: string;
    sacredStartDate: string;
    bibleStartDate: string;
    onRosaryDateChange: (date: string) => void;
    onSacredDateChange: (date: string) => void;
    onBibleDateChange: (date: string) => void;
    onApply: () => void;
    language: 'en' | 'es';
}

export function DateEditModal({
    isOpen,
    onClose,
    rosaryStartDate,
    sacredStartDate,
    bibleStartDate,
    onRosaryDateChange,
    onSacredDateChange,
    onBibleDateChange,
    onApply,
    language
}: DateEditModalProps) {
    if (!isOpen) return null;

    const [localRosaryDate, setLocalRosaryDate] = useState(rosaryStartDate);
    const [localSacredDate] = useState(sacredStartDate);
    const [localBibleDate, setLocalBibleDate] = useState(bibleStartDate);

    const translations = {
        en: {
            title: 'Edit Progress Tracking',
            rosaryStartDate: 'Rosary Start Date',
            sacredStartDate: 'Sacred Prayers Start Date',
            bibleStartDate: 'Bible in a Year Start Date',
            quickPresets: 'Quick Presets:',
            today: 'Today',
            thisMonth: 'This Month',
            thisYear: 'This Year',
            clear: 'Clear',
            apply: 'Apply Changes',
            cancel: 'Cancel'
        },
        es: {
            title: 'Editar Seguimiento',
            rosaryStartDate: 'Fecha de Inicio del Rosario',
            sacredStartDate: 'Fecha de Inicio de Oraciones Sagradas',
            bibleStartDate: 'Inicio Biblia en un Año',
            quickPresets: 'Atajos Rápidos:',
            today: 'Hoy',
            thisMonth: 'Este Mes',
            thisYear: 'Este Año',
            clear: 'Borrar',
            apply: 'Aplicar Cambios',
            cancel: 'Cancelar'
        }
    };

    const t = translations[language];

    // Helper functions removed in favor of inline specific handlers

    const handleApply = () => {
        onRosaryDateChange(localRosaryDate);
        onSacredDateChange(localSacredDate);
        onBibleDateChange(localBibleDate);
        onApply();
        onClose();
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-date-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-picker-header">
                    <h2 className="settings-picker-title">{t.title}</h2>
                    <button className="settings-picker-close" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div className="settings-date-content">
                    {/* Rosary Start Date */}
                    <div className="settings-date-group">
                        <div className="settings-date-header">
                            <Calendar className="settings-icon" size={20} />
                            <label className="settings-date-label">{t.rosaryStartDate}</label>
                        </div>
                        <div className="settings-date-input-group">
                            <input
                                type="date"
                                value={localRosaryDate}
                                onChange={(e) => setLocalRosaryDate(e.target.value)}
                                className="settings-date-input"
                                max={new Date().toISOString().split('T')[0]}
                            />
                            {localRosaryDate && (
                                <button
                                    onClick={() => setLocalRosaryDate('')}
                                    className="settings-date-clear-btn"
                                >
                                    {t.clear}
                                </button>
                            )}
                        </div>
                        <div className="settings-quick-actions">
                            <button
                                onClick={() => setLocalRosaryDate(new Date().toISOString().split('T')[0])}
                                className="settings-quick-btn"
                            >
                                {t.today}
                            </button>
                            <button
                                onClick={() => setLocalRosaryDate(`${new Date().getFullYear()}-01-01`)}
                                className="settings-quick-btn"
                            >
                                Jan 1
                            </button>
                        </div>
                    </div>

                    {/* Bible Start Date */}
                    <div className="settings-date-group">
                        <div className="settings-date-header">
                            <Calendar className="settings-icon" size={20} />
                            <label className="settings-date-label">{t.bibleStartDate}</label>
                        </div>
                        <div className="settings-date-input-group">
                            <input
                                type="date"
                                value={localBibleDate}
                                onChange={(e) => setLocalBibleDate(e.target.value)}
                                className="settings-date-input"
                                max={new Date().toISOString().split('T')[0]}
                            />
                            {localBibleDate && (
                                <button
                                    onClick={() => setLocalBibleDate('')}
                                    className="settings-date-clear-btn"
                                >
                                    {t.clear}
                                </button>
                            )}
                        </div>
                        <div className="settings-quick-actions">
                            <button
                                onClick={() => setLocalBibleDate(new Date().toISOString().split('T')[0])}
                                className="settings-quick-btn"
                            >
                                {t.today}
                            </button>
                            <button
                                onClick={() => setLocalBibleDate(`${new Date().getFullYear()}-01-01`)}
                                className="settings-quick-btn"
                            >
                                Jan 1
                            </button>
                        </div>
                    </div>

                    {/* Sacred Prayers (Hidden/Disabled via UI removal, but state preserved) */}

                    {/* Action Buttons */}
                    <div className="settings-date-actions">
                        <button onClick={onClose} className="settings-date-cancel-btn">
                            {t.cancel}
                        </button>
                        <button onClick={handleApply} className="settings-date-apply-btn">
                            {t.apply}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
