import { X, Calendar } from 'lucide-react';
import { useState } from 'react';

interface DateEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    rosaryStartDate: string;
    sacredStartDate: string;
    onRosaryDateChange: (date: string) => void;
    onSacredDateChange: (date: string) => void;
    onApply: () => void;
    language: 'en' | 'es';
}

export function DateEditModal({
    isOpen,
    onClose,
    rosaryStartDate,
    sacredStartDate,
    onRosaryDateChange,
    onSacredDateChange,
    onApply,
    language
}: DateEditModalProps) {
    if (!isOpen) return null;

    const [localRosaryDate, setLocalRosaryDate] = useState(rosaryStartDate);
    const [localSacredDate, setLocalSacredDate] = useState(sacredStartDate);

    const translations = {
        en: {
            title: 'Edit Progress Tracking',
            rosaryStartDate: 'Rosary Start Date',
            sacredStartDate: 'Sacred Prayers Start Date',
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

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setLocalRosaryDate(today);
        setLocalSacredDate(today);
    };

    const setFirstOfMonth = () => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString().split('T')[0];
        setLocalRosaryDate(firstOfMonth);
        setLocalSacredDate(firstOfMonth);
    };

    const setFirstOfYear = () => {
        const year = new Date().getFullYear();
        const firstOfYear = `${year}-01-01`;
        setLocalRosaryDate(firstOfYear);
        setLocalSacredDate(firstOfYear);
    };

    const handleApply = () => {
        onRosaryDateChange(localRosaryDate);
        onSacredDateChange(localSacredDate);
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
                    {/* Quick Presets */}
                    <div className="settings-date-presets">
                        <p className="settings-preset-label">{t.quickPresets}</p>
                        <div className="settings-preset-buttons">
                            <button onClick={setToday} className="settings-preset-btn">{t.today}</button>
                            <button onClick={setFirstOfMonth} className="settings-preset-btn">{t.thisMonth}</button>
                            <button onClick={setFirstOfYear} className="settings-preset-btn">{t.thisYear}</button>
                        </div>
                    </div>

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
                    </div>

                    {/* Sacred Start Date */}
                    <div className="settings-date-group">
                        <div className="settings-date-header">
                            <Calendar className="settings-icon" size={20} />
                            <label className="settings-date-label">{t.sacredStartDate}</label>
                        </div>
                        <div className="settings-date-input-group">
                            <input
                                type="date"
                                value={localSacredDate}
                                onChange={(e) => setLocalSacredDate(e.target.value)}
                                className="settings-date-input"
                                max={new Date().toISOString().split('T')[0]}
                            />
                            {localSacredDate && (
                                <button
                                    onClick={() => setLocalSacredDate('')}
                                    className="settings-date-clear-btn"
                                >
                                    {t.clear}
                                </button>
                            )}
                        </div>
                    </div>

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
