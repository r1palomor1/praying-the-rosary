import { Gauge } from 'lucide-react';

interface AudioSectionProps {
    playbackSpeed: number;
    onSpeedChange: (speed: number) => void;
    translations: {
        audio: string;
        speed: string;
    };
}

export function AudioSection({
    playbackSpeed,
    onSpeedChange,
    translations
}: AudioSectionProps) {
    return (
        <section>
            <h2 className="settings-section-header">
                {translations.audio}
            </h2>
            <div className="settings-card settings-audio-card">
                <div className="settings-audio-header">
                    <div className="settings-item-left">
                        <Gauge className="settings-icon" size={20} />
                        <span className="settings-item-label">{translations.speed}</span>
                    </div>
                    <span className="settings-speed-value">{Math.round(playbackSpeed * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={playbackSpeed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="settings-speed-slider"
                />
            </div>
        </section>
    );
}
