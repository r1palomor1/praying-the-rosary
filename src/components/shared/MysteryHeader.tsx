import { Volume2, StopCircle, Settings as SettingsIcon } from 'lucide-react';

interface MysteryHeaderProps {
    mysteryLayout: 'classic' | 'cinematic';
    currentStepType: string;
    userWantsTextHidden: boolean;
    setUserWantsTextHidden: (value: boolean) => void;
    onAudioToggle: () => void;
    isAudioPlaying: boolean;
    onSettingsClick: () => void;
    onLayoutToggle: () => void;
    onHighlighterToggle: () => void;
    highlightingEnabled: boolean;
    isPlaying: boolean;
    language: 'en' | 'es';
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    userDisabledHighlighting: boolean;
    setUserDisabledHighlighting: (value: boolean) => void;
    setHighlightingEnabled: (value: boolean) => void;
    mysteryName: string;
    currentDecadeTitle?: string;
    progress: number;
}

const BookOpenIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <path fillRule="evenodd" clipRule="evenodd" d="M14.5 2H9l-.35.15-.65.64-.65-.64L7 2H1.5l-.5.5v10l.5.5h5.29l.86.85h.7l.86-.85h5.29l.5-.5v-10l-.5-.5zm-7 10.32l-.18-.17L7 12H2V3h4.79l.74.74-.03 8.58zM14 12H9l-.35.15-.14.13V3.7l.7-.7H14v9zM6 5H3v1h3V5zm0 4H3v1h3V9zM3 7h3v1H3V7zm10-2h-3v1h3V5zm-3 2h3v1h-3V7zm0 2h3v1h-3V9z" />
    </svg>
);

const BookClosedIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path style={{ fill: '#B1974D', stroke: '#705F2E', strokeWidth: 3 }} d="M 22,10 77,2 77,27 22,28 z" />
        <path style={{ fill: '#B1974D', stroke: '#705F2E', strokeWidth: 3 }} d="m 34,20 58,-7 0,76 -58,7 z" />
        <path style={{ fill: '#5B4335', stroke: '#2E241F', strokeWidth: 3, strokeLinejoin: 'bevel' }} d="M 34,20 34,96 21,98 7,89 7,12 22,10 7,12 21,22 z" />
        <path style={{ fill: '#D2D2B3' }} d="M 10,13 77,3 c 0,0 -2,5 2,7 4,2 9,2 9,2 l -67,9 z" />
        <path style={{ fill: 'none', stroke: '#836959', strokeWidth: 3 }} d="m 21,23 0,74" />
    </svg>
);

const LayoutModeIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
        <g>
            <path d="M43.636,40.727v273.455h285.091V40.727H43.636z M311.273,296.727H61.091v-33.588l102.251-80.725l147.931,98.621V296.727z M311.272,260.056l-81.673-54.448l32.818-28.716l48.855,34.198V260.056z M311.273,189.783l-50.054-35.037l-46.665,40.832l-52.077-34.718l-101.385,80.04V58.182h250.182V189.783z" />
        </g>
        <g>
            <path d="M369.455,157.091V0H2.909v354.909h139.636V512h366.545V157.091H369.455z M369.455,215.273h81.455v238.545H200.727v-98.909h168.727V215.273z M20.364,337.455v-320H352v320H20.364z M491.636,494.545H160V354.909h23.273v116.364h285.091V197.818h-98.909v-23.273h122.182V494.545z" />
        </g>
        <g>
            <path d="M122.182,75.636c-20.852,0-37.818,16.965-37.818,37.818c0,20.854,16.966,37.818,37.818,37.818S160,134.308,160,113.455C160,92.601,143.034,75.636,122.182,75.636z M122.182,133.818c-11.228,0-20.364-9.136-20.364-20.364c0-11.228,9.136-20.364,20.364-20.364s20.364,9.136,20.364,20.364C142.545,124.682,133.41,133.818,122.182,133.818z" />
        </g>
        <g>
            <rect x="197.818" y="87.273" width="81.455" height="17.455" />
        </g>
        <g>
            <rect x="180.364" y="122.182" width="23.273" height="17.455" />
        </g>
        <g>
            <rect x="215.273" y="122.182" width="23.273" height="17.455" />
        </g>
    </svg>
);

export function MysteryHeader({
    mysteryLayout,
    currentStepType,
    userWantsTextHidden,
    setUserWantsTextHidden,
    onAudioToggle,
    isAudioPlaying,
    onSettingsClick,
    onLayoutToggle,
    highlightingEnabled,
    isPlaying,
    language,
    showToast,
    userDisabledHighlighting,
    setUserDisabledHighlighting,
    setHighlightingEnabled,
    mysteryName,
    currentDecadeTitle,
    progress
}: MysteryHeaderProps) {
    const t = language === 'es' ? {
        stopContinuous: 'Detener',
        continuousMode: 'Modo Continuo',
        settings: 'Configuración',
        textVisible: 'Texto visible',
        textHidden: 'Texto oculto',
        highlightingEnabled: 'Resaltado activado',
        highlightingDisabled: 'Resaltado desactivado',
        cinematicMode: 'Modo inmersivo activado',
        classicMode: 'Modo clásico activado',
        complete: 'completo'
    } : {
        stopContinuous: 'Stop',
        continuousMode: 'Continuous Mode',
        settings: 'Settings',
        textVisible: 'Text visible',
        textHidden: 'Text hidden',
        highlightingEnabled: 'Highlighting enabled',
        highlightingDisabled: 'Highlighting disabled',
        cinematicMode: 'Cinematic mode enabled',
        classicMode: 'Classic mode enabled',
        complete: 'complete'
    };

    return (
        <div className="mystery-screen-header">
            {/* Top Row: Icons */}
            <div className="header-top-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>

                {/* Left Icon Group */}
                <div className="header-left-icons" style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        className="continuous-audio-btn-header"
                        onClick={onAudioToggle}
                        aria-label={isAudioPlaying ? t.stopContinuous : t.continuousMode}
                    >
                        {isAudioPlaying ? (
                            <StopCircle size={20} strokeWidth={3} />
                        ) : (
                            <Volume2 size={20} strokeWidth={3} />
                        )}
                    </button>

                    {/* Book icon - Show in both modes, NOT on litany */}
                    {currentStepType !== 'litany_of_loreto' && (
                        <button
                            className="text-visibility-btn-header"
                            onClick={() => {
                                const newPreference = !userWantsTextHidden;
                                setUserWantsTextHidden(newPreference);
                                if (!newPreference) {
                                    showToast(t.textVisible, 'info');
                                } else {
                                    showToast(t.textHidden, 'info');
                                }
                            }}
                            aria-label={userWantsTextHidden ? "Show prayer text" : "Hide prayer text"}
                            style={{ marginLeft: '12px' }}
                        >
                            {userWantsTextHidden ? (
                                <BookClosedIcon size={20} />
                            ) : (
                                <BookOpenIcon size={20} />
                            )}
                        </button>
                    )}

                    {/* Highlighter icon */}
                    <button
                        className={`text-visibility-btn-header ${highlightingEnabled && !userWantsTextHidden ? 'pulsate-book-icon' : ''}`}
                        onClick={(e) => {
                            e.currentTarget.blur();
                            if (!isPlaying) return;
                            const newState = !highlightingEnabled;
                            setHighlightingEnabled(newState);
                            setUserDisabledHighlighting(!newState);
                            showToast(
                                newState ? t.highlightingEnabled : t.highlightingDisabled,
                                'info'
                            );
                        }}
                        aria-label={highlightingEnabled ? "Disable highlighting" : "Enable highlighting"}
                        style={{
                            marginLeft: '12px',
                            opacity: isPlaying && !userWantsTextHidden ? 1 : 0.3,
                            cursor: isPlaying && !userWantsTextHidden ? 'pointer' : 'not-allowed',
                            color: (!highlightingEnabled && isPlaying && !userWantsTextHidden) ? 'var(--color-text-secondary)' : undefined
                        }}
                        disabled={!isPlaying || userWantsTextHidden}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 36 36"
                            fill="currentColor"
                            className={highlightingEnabled ? "" : "opacity-50"}
                        >
                            <path d="M15.82,26.06a1,1,0,0,1-.71-.29L8.67,19.33a1,1,0,0,1-.29-.71,1,1,0,0,1,.29-.71L23,3.54a5.55,5.55,0,1,1,7.85,7.86L16.53,25.77A1,1,0,0,1,15.82,26.06Zm-5-7.44,5,5L29.48,10a3.54,3.54,0,0,0,0-5,3.63,3.63,0,0,0-5,0Z" />
                            <path d="M10.38,28.28A1,1,0,0,1,9.67,28L6.45,24.77a1,1,0,0,1-.22-1.09l2.22-5.44a1,1,0,0,1,1.63-.33l6.45,6.44A1,1,0,0,1,16.2,26l-5.44,2.22A1.33,1.33,0,0,1,10.38,28.28ZM8.33,23.82l2.29,2.28,3.43-1.4L9.74,20.39Z" />
                            <path d="M8.94,30h-5a1,1,0,0,1-.84-1.55l3.22-4.94a1,1,0,0,1,1.55-.16l3.21,3.22a1,1,0,0,1,.06,1.35L9.7,29.64A1,1,0,0,1,8.94,30ZM5.78,28H8.47L9,27.34l-1.7-1.7Z" />
                            <rect x="3.06" y="31" width="30" height="3" />
                        </svg>
                    </button>
                </div>

                {/* Right Icon Group */}
                <div className="header-right-icons" style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Layout toggle - hidden on litany */}
                    {currentStepType !== 'litany_of_loreto' && (
                        <button
                            className="layout-mode-btn-header"
                            onClick={() => {
                                onLayoutToggle();
                                const newLayout = mysteryLayout === 'classic' ? 'cinematic' : 'classic';
                                showToast(
                                    newLayout === 'cinematic' ? t.cinematicMode : t.classicMode,
                                    'success'
                                );
                            }}
                            aria-label={`Switch to ${mysteryLayout === 'classic' ? 'cinematic' : 'classic'} mode`}
                            style={{ marginRight: '12px' }}
                        >
                            <LayoutModeIcon size={20} />
                        </button>
                    )}

                    <button
                        className="settings-btn-header"
                        onClick={onSettingsClick}
                        aria-label={t.settings}
                    >
                        <SettingsIcon size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Text (Centered) */}
            <div className="mystery-progress" style={{ width: '100%', textAlign: 'center' }}>
                {/* Mystery set name */}
                <div className="mystery-set-name">{mysteryName}</div>
                {/* Current decade info */}
                {currentDecadeTitle && (
                    <div className="mystery-set-name current-decade-info">
                        {currentDecadeTitle}
                    </div>
                )}
                {/* Progress info */}
                <div className="progress-info progress-info-small">
                    {Math.round(progress)}% {t.complete}
                </div>
            </div>
        </div>
    );
}
