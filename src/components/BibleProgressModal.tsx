import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useBibleProgress } from '../hooks/useBibleProgress';
// Reusing Sacred styles for consistency
import './ProgressScreen.css';
import './SacredProgressModal.css';

interface BibleProgressModalProps {
    onClose: () => void;
    onDaySelect: (day: number) => void;
}

export function BibleProgressModal({ onClose, onDaySelect }: BibleProgressModalProps) {
    const { language } = useApp();
    const { completedDays, bibleStartDate, missedDays } = useBibleProgress();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Default to current month/year
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const translations = {
        en: {
            title: 'Bible Journey',
            totalread: 'Total Read',
            progress: 'Progress',
            missed: 'Missed Days',
            days: 'days',
            close: 'Close',
            previousMonth: 'Previous month',
            nextMonth: 'Next month',
            today: 'Today'
        },
        es: {
            title: 'Mi Camino Bíblico',
            totalread: 'Total Leído',
            progress: 'Progreso',
            missed: 'Días Perdidos',
            days: 'días',
            close: 'Cerrar',
            previousMonth: 'Mes anterior',
            nextMonth: 'Mes siguiente',
            today: 'Hoy'
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

    // Helper to map a calendar date to a Bible Plan Day (1-365)
    const getPlanDayForDate = (date: Date): number | null => {
        if (!bibleStartDate) return null;

        // Parse start date explicitly as local time to avoid UTC shifts
        const [y, m, d] = bibleStartDate.split('-').map(Number);
        const start = new Date(y, m - 1, d); // Month is 0-indexed
        // Normalize time
        start.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);

        if (target < start) return null; // Before start date

        const diffTime = target.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayNum = diffDays + 1;

        if (dayNum > 365) return null; // Plan ends at 365
        return dayNum;
    };

    const renderCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const days = [];

        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day-v2 empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const planDay = getPlanDayForDate(date);
            const isCompleted = planDay ? completedDays.includes(planDay) : false;

            // Check if missed: Only if it's a valid plan day, simpler than expectedDay logic for now
            // Just check if it's in the missedDays array from hook
            const isMissed = planDay ? missedDays.includes(planDay) : false;

            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

            // Determine badge class
            let badgeClass = 'day-number-v2';
            if (isCompleted) badgeClass = 'sacred-day-badge'; // Reuse green/gold badge
            else if (isMissed) badgeClass = 'day-number-v2 missed-day-badge'; // We'll need css for this

            // Handle click
            const handleClick = () => {
                if (planDay) {
                    onDaySelect(planDay);
                    onClose();
                }
            };

            // Style for today
            const showTodayHighlight = isToday && !isCompleted;

            days.push(
                <div
                    key={day}
                    className={`calendar-day-v2 ${showTodayHighlight ? 'today' : ''} ${!planDay ? 'disabled-day' : ''}`}
                    onClick={handleClick}
                    style={{ cursor: planDay ? 'pointer' : 'default' }}
                >
                    <span
                        className={`${badgeClass} ${showTodayHighlight ? 'today-number' : ''}`}
                        style={isMissed ? { backgroundColor: '#ef4444', color: 'white', border: 'none' } : {}}
                    >
                        {day}
                    </span>
                    {planDay && (
                        <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '-2px' }}>
                            Day {planDay}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    // --- Navigation ---
    const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

    // --- Stats Calculation ---
    // Simple stats for now
    const totalRead = completedDays.length;
    const progressPercent = Math.round((totalRead / 365) * 100);
    const totalMissed = missedDays.length;

    return (
        <div className="sacred-modal-overlay">
            <div className="sacred-modal-container">
                {/* Header */}
                <div className="border-b border-white/10 bg-[#16213e] sacred-modal-header">
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 className="text-2xl font-serif text-[#D4AF37] whitespace-nowrap">{t.title}</h2>
                        <p className="progress-date" style={{ marginTop: '0.5rem' }}>
                            {monthNames[language][currentMonth]} {currentYear}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors sacred-modal-close-btn">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-3 space-y-4 custom-scrollbar">

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="stats-card p-3 bg-[#1e293b] rounded-lg text-center border border-white/5">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.totalread}</div>
                            <div className="text-2xl font-bold text-white">{totalRead}</div>
                            <div className="text-xs text-gray-500">of 365</div>
                        </div>
                        <div className="stats-card p-3 bg-[#1e293b] rounded-lg text-center border border-white/5">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.progress}</div>
                            <div className="text-2xl font-bold text-[#D4AF37]">{progressPercent}%</div>
                        </div>
                        <div className="stats-card p-3 bg-[#1e293b] rounded-lg text-center border border-white/5">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t.missed}</div>
                            <div className="text-2xl font-bold text-red-400">{totalMissed}</div>
                            <div className="text-xs text-gray-500">{t.days}</div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="calendar-section-v2">
                        <div className="calendar-header-v2">
                            <button className="month-nav-btn-v2" onClick={goToPreviousMonth} aria-label={t.previousMonth}>
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="calendar-month-v2">
                                {monthNames[language][currentMonth].toUpperCase()}
                            </h2>
                            <button className="month-nav-btn-v2" onClick={goToNextMonth} aria-label={t.nextMonth}>
                                <ChevronRight size={20} />
                            </button>
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
