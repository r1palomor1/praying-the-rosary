import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hasSacredCompletionOnDate, getMysteryTypeForDate } from '../utils/sacredHistory';
import { getAvailableYears, getEnhancedYTDStats, isYearEndArchiveView } from '../utils/yearlyHistory';
import { EnhancedStatsCards } from './EnhancedStatsCards';
import './ProgressScreen.css'; // Reusing the same styles as Rosary progress
import './SacredProgressModal.css';

interface SacredProgressModalProps {
    onClose: () => void;
}

export function SacredProgressModal({ onClose }: SacredProgressModalProps) {
    const { language } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get enhanced YTD stats with MTD breakdown
    const stats = getEnhancedYTDStats(currentYear, currentMonth, 'sacred');
    const availableYears = getAvailableYears('sacred');
    const isArchiveView = isYearEndArchiveView(currentYear, currentMonth);

    const translations = {
        en: {
            title: 'Your Prayer Journey',
            streak: 'Day Streak',
            total: 'Total Completed',
            totalYTD: 'Total Completed YTD',
            bestStreak: 'Best streak',
            thisMonth: 'This month MTD',
            yearEndMonth: 'Year-End Total',
            days: 'days',
            times: 'times',
            close: 'Close',
            previousMonth: 'Previous month',
            nextMonth: 'Next month',
            selectYear: 'Select Year',
            yearEnd: 'Year-End Stats'
        },
        es: {
            title: 'Tu Camino de Oración',
            streak: 'Días Seguidos',
            total: 'Total Completado',
            totalYTD: 'Total Completado ATF',
            bestStreak: 'Mejor racha',
            thisMonth: 'Este mes MTD',
            yearEndMonth: 'Total de Fin de Año',
            days: 'días',
            times: 'veces',
            close: 'Cerrar',
            previousMonth: 'Mes anterior',
            nextMonth: 'Mes siguiente',
            selectYear: 'Seleccionar Año',
            yearEnd: 'Estadísticas de Fin de Año'
        }
    };

    const t = translations[language];

    const monthNames = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    };

    const dayNames = {
        en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        es: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    };

    const renderCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const days = [];

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day-v2 empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = hasSacredCompletionOnDate(dateStr);
            const mysteryType = isCompleted ? getMysteryTypeForDate(dateStr) : null;

            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

            // Remove highlight when completed (clean badge display)
            const showTodayHighlight = isToday && !isCompleted;

            days.push(
                <div
                    key={day}
                    className={`calendar-day-v2 ${showTodayHighlight ? 'today' : ''}`}
                >
                    <span
                        className={`${isCompleted ? 'sacred-day-badge' : 'day-number-v2'} ${showTodayHighlight ? 'today-number' : ''}`}
                        data-mystery-type={isCompleted && mysteryType ? mysteryType : undefined}
                    >
                        {day}
                    </span>
                </div>
            );
        }

        return days;
    };

    const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => {
        const today = new Date();
        if (currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth())) {
            setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        }
    };
    const canGoNext = () => {
        const today = new Date();
        return currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth());
    };

    return (
        <div className="sacred-modal-overlay">
            <div className="sacred-modal-container">

                {/* Header */}
                <div className="border-b border-white/10 bg-[#16213e] sacred-modal-header">
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 className="text-2xl font-serif text-[#D4AF37] whitespace-nowrap">{t.title}</h2>
                        <p className="progress-date" style={{ marginTop: '0.5rem' }}>
                            {monthNames[language][currentMonth]} {currentDate.getDate()}, {currentYear}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors sacred-modal-close-btn"
                        aria-label={t.close}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar">

                    {/* Enhanced Stats Cards */}
                    <EnhancedStatsCards
                        ytdTotal={stats.totalCompletions}
                        ytdCurrentStreak={stats.currentStreak}
                        ytdBestStreak={stats.bestStreak}
                        ytdProgress={stats.yearProgress}
                        ytdGoal={stats.daysInYear}
                        ytdLastYear={stats.ytdLastYear}
                        mtdTotal={stats.mtdTotal}
                        mtdCurrentStreak={stats.mtdCurrentStreak}
                        mtdBestStreak={stats.mtdBestStreak}
                        mtdProgress={stats.monthProgress}
                        mtdGoal={stats.daysInMonth}
                        mtdLastYear={stats.mtdLastYear}
                        yearOverYearPercent={stats.yearOverYearPercent}
                        year={currentYear}
                        monthName={monthNames[language][currentMonth]}
                        language={language}
                        prayerType="prayers"
                    />

                    {/* Calendar */}
                    <div className="calendar-section-v2">
                        <div className="calendar-header-v2">
                            <button className="month-nav-btn-v2" onClick={goToPreviousMonth} aria-label={t.previousMonth}><ChevronLeft size={20} /></button>

                            <div className="calendar-header-inline">
                                <h2 className="calendar-month-v2">
                                    {monthNames[language][currentMonth].toUpperCase()}
                                    {isArchiveView && <span className="text-sm opacity-75"> - {t.yearEnd}</span>}
                                </h2>

                                {/* Inline Year Selector */}
                                {availableYears.length > 1 && (
                                    <select
                                        value={selectedYear || currentYear}
                                        onChange={(e) => {
                                            const year = parseInt(e.target.value);
                                            setSelectedYear(year);
                                            // Default to December for past years, current month for current year
                                            const today = new Date();
                                            const targetMonth = year < today.getFullYear() ? 11 : today.getMonth();
                                            setCurrentDate(new Date(year, targetMonth, 1));
                                        }}
                                        className="year-selector-inline"
                                        aria-label={t.selectYear}
                                    >
                                        {availableYears.map(year => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button className="month-nav-btn-v2" onClick={goToNextMonth} disabled={!canGoNext()} aria-label={t.nextMonth}><ChevronRight size={20} /></button>
                        </div>
                        <div className="calendar-grid-v2">
                            {dayNames[language].map((day, i) => (
                                <div key={i} className="calendar-day-header-v2">{day}</div>
                            ))}
                            {renderCalendar()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
