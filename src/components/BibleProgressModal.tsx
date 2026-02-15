
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useBibleProgress } from '../hooks/useBibleProgress';

interface BibleProgressModalProps {
    onClose: () => void;
    onDaySelect: (day: number) => void;
}

export function BibleProgressModal({ onClose, onDaySelect }: BibleProgressModalProps) {
    const { language } = useApp();
    const { completedDays, bibleStartDate, missedDays } = useBibleProgress();
    const [currentDate, setCurrentDate] = useState(new Date());

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const translations = {
        en: {
            title: 'Stats Overview',
            remaining: 'Days Remaining',
            missed: 'Days Missed',
            completed: 'Days Completed',
            progress: 'Progress',
            previousMonth: 'Previous month',
            nextMonth: 'Next month'
        },
        es: {
            title: 'Resumen de Estadísticas',
            remaining: 'Días Restantes',
            missed: 'Días Perdidos',
            completed: 'Días Completados',
            progress: 'Progreso',
            previousMonth: 'Mes anterior',
            nextMonth: 'Mes siguiente'
        }
    };

    const t = translations[language];

    const monthNames = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    };

    const dayNames = {
        en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        es: ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
    };

    // Helper logic (same as before)
    const getPlanDayForDate = (date: Date): number | null => {
        if (!bibleStartDate) return null;
        const [y, m, d] = bibleStartDate.split('-').map(Number);
        const start = new Date(y, m - 1, d);
        start.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        if (target < start) return null;
        const diffTime = target.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayNum = diffDays + 1;
        if (dayNum > 365) return null;
        return dayNum;
    };

    // Stats
    const totalDays = 365;
    const daysCompletedCount = completedDays.length;
    const daysMissedCount = missedDays.length;
    const daysRemainingCount = Math.max(0, totalDays - daysCompletedCount);
    const progressPercent = Math.round((daysCompletedCount / totalDays) * 100);

    // CSS-in-JS Styles for Premium Look (No Tailwind)
    const styles: Record<string, React.CSSProperties> = {
        overlay: {
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        },
        container: {
            backgroundColor: '#0f172a', // Dark slate
            borderRadius: '16px',
            maxWidth: '500px', // Reduced width for better mobile fit
            width: '95%', // Ensure it fits within mobile screen width
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
        },
        header: {
            backgroundColor: '#16213e',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 16px', // Compact padding
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        headerTitle: {
            color: '#D4AF37', // Gold
            fontSize: '1.15rem',
            fontFamily: 'serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0
        },
        closeBtn: {
            color: '#94a3b8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
        },
        content: {
            padding: '16px', // Reduced from 24px to prevent overflow
            overflowY: 'auto'
        },
        statsCard: {
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '16px', // Compact stats card
            marginBottom: '20px', // Reduced spacing
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            paddingBottom: '16px'
        },
        statCol: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
        },
        statValue: {
            fontSize: '1.5rem', // Slightly smaller
            fontWeight: 300,
            marginBottom: '2px',
            color: '#ffffff'
        },
        statLabel: {
            fontSize: '0.6rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            lineHeight: 1.2
        },
        progressBarContainer: {
            height: '6px', // Thinner bar
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginTop: '8px'
        },
        progressBarFill: {
            height: '100%',
            background: 'linear-gradient(90deg, #D4AF37 0%, #FCD34D 100%)',
            width: `${progressPercent}%`,
            transition: 'width 1s ease-out'
        },
        calendarHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '0 4px'
        },
        monthTitle: {
            fontSize: '1.2rem',
            color: '#D4AF37', // Gold color for Month
            fontFamily: 'serif',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textAlign: 'center',
            flex: 1
        },
        navBtn: {
            width: '32px', // Smaller buttons
            height: '32px',
            borderRadius: '50%',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            background: 'transparent',
            color: '#D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
        },
        daysHeader: {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            marginBottom: '8px',
            textAlign: 'center',
            gap: '6px' // Match grid gap
        },
        dayName: {
            fontSize: '0.65rem',
            color: 'rgba(212, 175, 55, 0.6)',
            fontWeight: 'bold',
            letterSpacing: '0.1em'
        },
        calendarGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px' // Tighter gap for mobile
        }
    };

    const renderCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`}></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const planDay = getPlanDayForDate(date);
            const isCompleted = planDay ? completedDays.includes(planDay) : false;
            const isMissed = planDay ? missedDays.includes(planDay) : false;
            const isToday = date.toDateString() === new Date().toDateString();

            let bg = 'rgba(255, 255, 255, 0.03)';
            let border = '1px solid rgba(255, 255, 255, 0.05)';
            let color = '#94a3b8';

            if (isCompleted) {
                bg = 'rgba(212, 175, 55, 0.15)';
                border = '1px solid #D4AF37';
                color = '#D4AF37';
            } else if (isMissed) {
                bg = 'rgba(239, 68, 68, 0.1)';
                border = '1px solid rgba(239, 68, 68, 0.3)';
                color = '#f87171';
            } else if (isToday) {
                bg = 'rgba(255, 255, 255, 0.1)';
                border = '1px solid rgba(255, 255, 255, 0.3)';
                color = '#ffffff';
            }

            days.push(
                <div
                    key={day}
                    onClick={() => { if (planDay) { onDaySelect(planDay); onClose(); } }}
                    style={{
                        backgroundColor: bg,
                        border: border,
                        color: color,
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: planDay ? 'pointer' : 'default',
                        opacity: !planDay ? 0.3 : 1,
                        position: 'relative'
                    }}
                >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{day}</span>
                    {planDay && (
                        <span style={{ fontSize: '0.5rem', opacity: 0.8, marginTop: '1px' }}>
                            {isCompleted ? '✓' : (isMissed ? '!' : `Day ${planDay}`)}
                        </span>
                    )}
                </div>
            );
        }
        return days;
    };

    // Navigation
    const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={{ width: 32 }}></div> {/* Spacer */}
                    <h2 style={styles.headerTitle}>{t.title}</h2>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <div style={styles.content} className="custom-scrollbar">
                    {/* Stats Card */}
                    <div style={styles.statsCard}>
                        {/* Title Removed to save space */}
                        <div style={styles.statsGrid}>
                            <div style={styles.statCol}>
                                <span style={styles.statValue}>{daysRemainingCount}</span>
                                <span style={styles.statLabel}>{t.remaining}</span>
                            </div>
                            <div style={{ ...styles.statCol, borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ ...styles.statValue, color: '#f87171' }}>{daysMissedCount}</span>
                                <span style={styles.statLabel}>{t.missed}</span>
                            </div>
                            <div style={styles.statCol}>
                                <span style={{ ...styles.statValue, color: '#D4AF37' }}>{daysCompletedCount}</span>
                                <span style={{ ...styles.statLabel, color: 'rgba(212, 175, 55, 0.8)' }}>{t.completed}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{t.progress}</span>
                            <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 700 }}>{progressPercent}%</span>
                        </div>
                        <div style={styles.progressBarContainer}>
                            <div style={styles.progressBarFill}></div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div style={styles.calendarHeader}>
                        <button onClick={goToPreviousMonth} style={styles.navBtn} aria-label={t.previousMonth}>
                            <ChevronLeft size={18} />
                        </button>
                        <h2 style={styles.monthTitle}>
                            {monthNames[language][currentMonth]} <span style={{ fontWeight: 300 }}>{currentYear}</span>
                        </h2>
                        <button onClick={goToNextMonth} style={styles.navBtn} aria-label={t.nextMonth}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div style={styles.daysHeader}>
                        {dayNames[language].map((day, i) => (
                            <div key={i} style={styles.dayName}>{day}</div>
                        ))}
                    </div>

                    <div style={styles.calendarGrid}>
                        {renderCalendar()}
                    </div>
                </div>
            </div>
        </div>
    );
}
