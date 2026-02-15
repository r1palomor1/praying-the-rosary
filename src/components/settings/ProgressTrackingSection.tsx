
import { useState } from 'react';
import { Info } from 'lucide-react';

interface ProgressTrackingSectionProps {
    rosaryStartDate: string;
    sacredStartDate: string;
    bibleStartDate: string;
    onEditClick: () => void;
    translations: {
        progressTracking: string;
        startDateTooltip: string;
        sacredPrayers: string;
        [key: string]: string;
    };
    language: 'en' | 'es';
}

export function ProgressTrackingSection({
    rosaryStartDate,
    sacredStartDate,
    bibleStartDate,
    onEditClick,
    translations,
    language
}: ProgressTrackingSectionProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return language === 'es' ? 'Hoy' : 'Today';

        // Parse as UTC to avoid timezone issues
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[date.getUTCMonth()];
        const dayNum = String(date.getUTCDate()).padStart(2, '0');
        const yearNum = date.getUTCFullYear();

        return `${monthName} ${dayNum}, ${yearNum}`;
    };

    const today = language === 'es' ? 'Hoy' : 'Today';
    const rosaryDisplay = formatDate(rosaryStartDate);
    const sacredDisplay = formatDate(sacredStartDate);
    const bibleDisplay = formatDate(bibleStartDate);

    const rosaryLabel = language === 'es' ? 'Rosario' : 'Rosary';
    const bibleLabel = language === 'es' ? 'Biblia en un Año' : 'Bible in a Year';
    const sacredLabel = translations.sacredPrayers || (language === 'es' ? 'Oraciones Sagradas' : 'Sacred Prayers');

    // Label style: Right aligned, muted color
    const labelStyle: React.CSSProperties = {
        color: 'var(--settings-text-secondary)',
        fontWeight: 500,
        textAlign: 'right',
        whiteSpace: 'nowrap'
    };



    // Value style: Primary color
    const valueStyle: React.CSSProperties = {
        color: 'var(--settings-text-primary)',
        fontWeight: 600,
        whiteSpace: 'nowrap'
    };

    return (
        <section>
            <h2 className="settings-section-header">
                {translations.progressTracking}
                <div style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}>
                    <button
                        className="info-icon-btn"
                        onClick={() => setShowTooltip(!showTooltip)}
                        aria-label="Info"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    >
                        <Info size={16} />
                    </button>

                    {showTooltip && (
                        <div className="tooltip-popup" style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '8px',
                            padding: '12px',
                            backgroundColor: 'rgba(30, 30, 30, 0.95)',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            width: '240px',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center',
                            lineHeight: '1.4'
                        }}>
                            {translations.startDateTooltip}
                        </div>
                    )}
                </div>
            </h2>
            <div className="settings-card settings-progress-card">
                <div className="settings-progress-content">
                    <div className="settings-progress-info" style={{ flex: 1, marginRight: '16px' }}>

                        {/* CSS Grid for Alignment */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'max-content auto',
                            columnGap: '12px',
                            rowGap: '6px',
                            alignItems: 'center',
                            justifyContent: 'start', // Keeps dates to the left (removing dead space)
                            fontSize: '0.875rem' // Standardize font size to match General section
                        }}>
                            {/* Rosary Row */}
                            <span style={labelStyle}>{rosaryLabel}:</span>
                            <span style={valueStyle}>{rosaryDisplay} — {today}</span>

                            {/* Sacred Prayers Row */}
                            <span style={labelStyle}>{sacredLabel}:</span>
                            <span style={valueStyle}>{sacredDisplay} — {today}</span>

                            {/* Bible Row */}
                            <span style={labelStyle}>{bibleLabel}:</span>
                            <span style={valueStyle}>{bibleDisplay} — {today}</span>
                        </div>

                    </div>
                    <button
                        className="settings-edit-button"
                        onClick={onEditClick}
                        style={{ height: 'fit-content', alignSelf: 'center' }}
                    >
                        {language === 'es' ? 'EDITAR' : 'EDIT'}
                    </button>
                </div>
            </div>
        </section>
    );
}
