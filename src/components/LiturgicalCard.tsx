
import { useEffect, useState } from 'react';
import { fetchLiturgicalDay, getLiturgicalColorHex, getSeasonName, type LiturgicalDay } from '../utils/liturgicalCalendar';
import { Calendar } from 'lucide-react';
import './LiturgicalCard.css';

export function LiturgicalCard() {
    const [dayData, setDayData] = useState<LiturgicalDay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchLiturgicalDay();
            setDayData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading || !dayData) return null; // Don't show anything if loading or failed (clean UI)

    const primaryCelebration = dayData.celebrations[0];
    const colorHex = getLiturgicalColorHex(primaryCelebration.colour);

    // Determine text color based on background luminance (rough heuristic)
    const isLightColor = ['white', 'gold', 'yellow'].includes(primaryCelebration.colour.toLowerCase());
    const textColor = isLightColor ? '#1F2937' : 'white'; // gray-800 or white

    return (
        <div className="liturgical-card">
            <div className="liturgical-header">
                <div className="liturgical-season">
                    {getSeasonName(dayData.season)}
                </div>
                <div className="liturgical-date">
                    <Calendar size={14} className="liturgical-icon" />
                    {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div
                className="liturgical-celebration"
                style={{
                    backgroundColor: colorHex,
                    color: textColor,
                    boxShadow: `0 4px 12px ${colorHex}40` // colored glow
                }}
            >
                <span className="celebration-title">{primaryCelebration.title}</span>
                {primaryCelebration.rank !== 'ferial' && (
                    <span className="celebration-rank">{primaryCelebration.rank}</span>
                )}
            </div>
        </div>
    );
}
