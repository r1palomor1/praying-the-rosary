import { TrendingUp, TrendingDown, Flame } from 'lucide-react';
import './EnhancedStatsCards.css';

interface EnhancedStatsCardsProps {
    ytdTotal: number;
    ytdCurrentStreak: number;
    ytdBestStreak: number;
    ytdProgress: number;
    ytdGoal: number;
    mtdTotal: number;
    mtdCurrentStreak: number;
    mtdBestStreak: number;
    mtdProgress: number;
    mtdGoal: number;
    yearOverYearPercent: number | null;
    year: number;
    monthName: string;
    language: 'en' | 'es';
    prayerType?: 'rosaries' | 'prayers'; // Default to 'rosaries'
}

export function EnhancedStatsCards({
    ytdTotal,
    ytdCurrentStreak,
    ytdBestStreak,
    ytdProgress,
    ytdGoal,
    mtdTotal,
    mtdCurrentStreak,
    mtdBestStreak,
    mtdProgress,
    mtdGoal,
    yearOverYearPercent,
    year,
    monthName,
    language,
    prayerType = 'rosaries'
}: EnhancedStatsCardsProps) {

    const t = {
        en: {
            ytd: 'YEAR TO DATE',
            mtd: 'CURRENT MONTH',
            yearlyGoal: 'Yearly Goal Progress',
            monthlyGoal: 'Monthly Goal Progress',
            target: 'Target',
            rosariesBy: prayerType === 'rosaries' ? 'Rosaries by' : 'Prayers by',
            vsPreviousYear: 'vs previous year',
            bestStreak: 'BEST STREAK',
            currentStreak: 'CURRENT STREAK',
            days: 'days',
            daysLeft: 'days left'
        },
        es: {
            ytd: 'AÑO HASTA LA FECHA',
            mtd: 'MES ACTUAL',
            yearlyGoal: 'Progreso de Meta Anual',
            monthlyGoal: 'Progreso de Meta Mensual',
            target: 'Meta',
            rosariesBy: prayerType === 'rosaries' ? 'Rosarios para' : 'Oraciones para',
            vsPreviousYear: 'vs año anterior',
            bestStreak: 'MEJOR RACHA',
            currentStreak: 'RACHA ACTUAL',
            days: 'días',
            daysLeft: 'días restantes'
        }
    }[language];

    const showYoY = yearOverYearPercent !== null;
    const yoyPositive = yearOverYearPercent && yearOverYearPercent > 0;

    return (
        <div className="enhanced-stats-container">
            {/* Background Icon */}
            <div className="stats-bg-icon">
                🙏
            </div>

            <div className="stats-grid">
                {/* YTD Card */}
                <div className="stat-card ytd-card">
                    <div className="card-content">
                        {/* Header */}
                        <div className="card-header">
                            <div className="header-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <h4 className="card-title">{t.ytd} ({year})</h4>
                        </div>

                        {/* Main Number */}
                        <div className="main-stat">
                            <span className="stat-number ytd-number">{ytdTotal}</span>
                            {showYoY && (
                                <div className="yoy-badge">
                                    {yoyPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    <span>{yoyPositive ? '+' : ''}{yearOverYearPercent}%</span>
                                </div>
                            )}
                        </div>
                        {showYoY && (
                            <p className="yoy-label">{t.vsPreviousYear}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-label">{t.yearlyGoal}: {ytdProgress}%</span>
                                <span className="progress-remaining">{ytdGoal - ytdTotal} {t.daysLeft}</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill ytd-fill" style={{ width: `${Math.min(ytdProgress, 100)}%` }}></div>
                            </div>
                            <p className="progress-target">{t.target}: {ytdGoal} {t.rosariesBy} Dec 31</p>
                        </div>

                        {/* Streak Stats */}
                        <div className="streak-grid">
                            <div className="streak-box">
                                <p className="streak-label">{t.bestStreak}</p>
                                <p className="streak-value">{ytdBestStreak}</p>
                            </div>
                            <div className="streak-box">
                                <p className="streak-label">{t.currentStreak}</p>
                                <div className="streak-value-with-icon">
                                    <p className="streak-value">{ytdCurrentStreak}</p>
                                    {ytdCurrentStreak > 0 && <Flame size={16} className="flame-icon" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MTD Card */}
                <div className="stat-card mtd-card">
                    <div className="card-content">
                        {/* Header */}
                        <div className="card-header">
                            <div className="header-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <h4 className="card-title">{t.mtd} ({monthName.toUpperCase()})</h4>
                        </div>

                        {/* Main Number */}
                        <div className="main-stat">
                            <span className="stat-number mtd-number">{mtdTotal}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-label">{t.monthlyGoal}: {mtdProgress}%</span>
                                <span className="progress-remaining">{mtdGoal - mtdTotal} {t.daysLeft}</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill mtd-fill" style={{ width: `${Math.min(mtdProgress, 100)}%` }}></div>
                            </div>
                            <p className="progress-target">{t.target}: {mtdGoal} {t.rosariesBy} {monthName} {new Date(year, 0, 1).getDate()}</p>
                        </div>

                        {/* Streak Stats */}
                        <div className="streak-grid">
                            <div className="streak-box">
                                <p className="streak-label">{t.bestStreak}</p>
                                <p className="streak-value">{mtdBestStreak}</p>
                            </div>
                            <div className="streak-box">
                                <p className="streak-label">{t.currentStreak}</p>
                                <div className="streak-value-with-icon">
                                    <p className="streak-value">{mtdCurrentStreak}</p>
                                    {mtdCurrentStreak > 0 && <Flame size={16} className="flame-icon" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
