
import { useEffect, useState } from 'react';
import { fetchLiturgicalDay, getLiturgicalColorHex, getSeasonName, type LiturgicalDay } from '../utils/liturgicalCalendar';
import './LiturgicalCard.css';

interface LiturgicalCardProps {
    onColorChange?: (color: string) => void;
}

export function LiturgicalCard({ onColorChange }: LiturgicalCardProps) {
    const [dayData, setDayData] = useState<LiturgicalDay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchLiturgicalDay();
            setDayData(data);
            setLoading(false);
            if (data && data.celebrations.length > 0) {
                const color = getLiturgicalColorHex(data.celebrations[0].colour);
                onColorChange?.(color);
            }
        };
        loadData();
    }, [onColorChange]);

    if (loading || !dayData) return null;

    const primaryCelebration = dayData.celebrations[0];
    const colorHex = getLiturgicalColorHex(primaryCelebration.colour);

    return (
        <>
            <div className="decorative-divider" style={{ marginBottom: '0.25rem', marginTop: '-0.75rem', opacity: 0.8 }}>
                <div
                    className="divider-line divider-line-left"
                    style={{ background: `linear-gradient(to right, transparent, ${colorHex})` }}
                ></div>
                <span
                    className="material-symbols-outlined divider-icon"
                    style={{ color: colorHex }}
                >
                    church
                </span>
                <div
                    className="divider-line divider-line-right"
                    style={{ background: `linear-gradient(to left, transparent, ${colorHex})` }}
                ></div>
            </div>

            <div className="liturgical-card">
                <div className="liturgical-header">
                    <div
                        className="liturgical-season"
                        style={{
                            color: colorHex,
                            borderColor: `${colorHex}50`,
                            backgroundColor: `${colorHex}10`
                        }}
                    >
                        {getSeasonName(dayData.season)}
                    </div>
                    <div
                        className="liturgical-date"
                        style={{
                            color: colorHex,
                            borderColor: `${colorHex}50`,
                            backgroundColor: `${colorHex}10`
                        }}
                    >
                        {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </div>
                </div>

                <div
                    className="liturgical-celebration"
                    style={{
                        borderColor: `${colorHex}50`,
                        backgroundColor: `${colorHex}10`, // Very subtle tint
                        color: '#f3f4f6', // Keep text readable (white-ish)
                        boxShadow: `0 0 15px -5px ${colorHex}30` // Glow
                    }}
                >
                    <div className="celebration-content">
                        <span
                            className="celebration-title"
                            style={{
                                textShadow: `0 0 15px ${colorHex}50`,
                                color: colorHex
                            }}
                        >
                            {primaryCelebration.title}
                        </span>
                        {primaryCelebration.rank !== 'ferial' && (
                            <span className="celebration-rank" style={{ color: colorHex }}>
                                {primaryCelebration.rank}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
