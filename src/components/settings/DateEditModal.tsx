
import { X, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    const [localSacredDate, setLocalSacredDate] = useState(sacredStartDate);
    const [localBibleDate, setLocalBibleDate] = useState(bibleStartDate);

    // Re-sync local state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setLocalRosaryDate(rosaryStartDate);
            setLocalSacredDate(sacredStartDate);
            setLocalBibleDate(bibleStartDate);
        }
    }, [isOpen, rosaryStartDate, sacredStartDate, bibleStartDate]);

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

    const handleApply = () => {
        onRosaryDateChange(localRosaryDate);
        onSacredDateChange(localSacredDate);
        onBibleDateChange(localBibleDate);
        onApply();
        onClose();
    };

    // Helper to calculate "This Month 1st"
    const getMonthStart = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    };

    // Helper to calculate "This Year 1st" (Jan 1)
    const getYearStart = () => {
        return `${new Date().getFullYear()}-01-01`;
    };

    // Helper to get Today
    const getToday = () => {
        return new Date().toISOString().split('T')[0];
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
                                max={getToday()}
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
                                onClick={() => setLocalRosaryDate(getToday())}
                                className="settings-quick-btn"
                            >
                                {t.today}
                            </button>
                            <button
                                onClick={() => setLocalRosaryDate(getMonthStart())}
                                className="settings-quick-btn"
                            >
                                {t.thisMonth}
                            </button>
                            <button
                                onClick={() => setLocalRosaryDate(getYearStart())}
                                className="settings-quick-btn"
                            >
                                {t.thisYear}
                            </button>
                        </div>
                    </div>

                    {/* Sacred Prayers Start Date */}
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
                                max={getToday()}
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
                        <div className="settings-quick-actions">
                            <button
                                onClick={() => setLocalSacredDate(getToday())}
                                className="settings-quick-btn"
                            >
                                {t.today}
                            </button>
                            <button
                                onClick={() => setLocalSacredDate(getMonthStart())}
                                className="settings-quick-btn"
                            >
                                {t.thisMonth}
                            </button>
                            <button
                                onClick={() => setLocalSacredDate(getYearStart())}
                                className="settings-quick-btn"
                            >
                                {t.thisYear}
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
                                max={getToday()}
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
                                onClick={() => setLocalBibleDate(getToday())}
                                className="settings-quick-btn"
                            >
                                {t.today}
                            </button>
                            <button
                                onClick={() => setLocalBibleDate(getMonthStart())}
                                className="settings-quick-btn"
                            >
                                {t.thisMonth}
                            </button>
                            <button
                                onClick={() => setLocalBibleDate(getYearStart())}
                                className="settings-quick-btn"
                            >
                                {t.thisYear}
                            </button>
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
