import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Square, Info, Settings as SettingsIcon, Calendar, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import { BibleProgressModal } from './BibleProgressModal';
import { useBibleProgress } from '../hooks/useBibleProgress';
import biblePlan from '../data/bibleInYearPlan.json';
import './DailyReadingsScreen.css'; // Reuse Daily Readings styles

interface BibleDay {
    day: number;
    period: string;
    first_reading: string;
    second_reading: string | null;
    psalm_proverbs: string;
}

interface Reading {
    title: string;
    citation?: string;
    text: string;
}

interface Props {
    onBack: () => void;
}

// Spanish translations for Bible book names (for TTS)
// Spanish translations moved to utils/bibleBooks.ts

export default function BibleInYearScreen({ onBack }: Props) {
    const { language } = useApp();
    const [currentDay, setCurrentDay] = useState(1);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);

    // Progress Hooks
    const {
        markDayComplete,
        unmarkDay,
        isDayComplete,
        missedDays,
        expectedDay,
        bibleStartDate
    } = useBibleProgress();

    // Check for "Catch Up" opportunity on mount or when progress data loads
    useEffect(() => {
        if (!bibleStartDate) return;

        // Ensure we prioritize the FIRST missed day (Resume)
        // If no missed days, go to Expected Day (Today)
        if (missedDays.length > 0) {
            setCurrentDay(missedDays[0]);
            // Optional: Still show modal if very behind? 
            // The user feedback implies they want "card and reader to be in sync". 
            // If we jump to Day 3, and card says Day 3, we are good.
            // We can still show the modal if they are significantly behind (e.g. > 3 days) to offer the "Calendar" view
            // if (missedDays.length > 3) setShowProgressModal(true);
        } else if (expectedDay > 1) {
            if (!isDayComplete(expectedDay)) {
                setCurrentDay(expectedDay);
            }
        }
    }, [bibleStartDate, missedDays.length, expectedDay]); // React to progress updates


    const dayData: BibleDay = (biblePlan as BibleDay[])[currentDay - 1];

    const t = {
        en: {
            title: 'Bible in a Year',
            day: 'Day',
            of: 'of',
            firstReading: 'First Reading',
            secondReading: 'Second Reading',
            psalmProverbs: 'Psalm/Proverbs',
            playAll: 'All',
            back: 'Back',
            loading: 'Loading...',
            error: 'Unable to load readings. Please check your connection.',
            markComplete: 'Mark as Complete',
            completed: 'Completed',
            catchUp: 'Review Progress',
            viewCalendar: 'View Calendar'
        },
        es: {
            title: 'Biblia en un Año',
            day: 'Día',
            of: 'de',
            firstReading: 'Primera Lectura',
            secondReading: 'Segunda Lectura',
            psalmProverbs: 'Salmo/Proverbios',
            playAll: 'Todo',
            back: 'Atrás',
            loading: 'Cargando...',
            error: 'No se pudieron cargar las lecturas. Verifique su conexión.',
            markComplete: 'Marcar como Completado',
            completed: 'Completado',
            catchUp: 'Revisar Progreso',
            viewCalendar: 'Ver Calendario'
        }
    }[language];


    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

    const fetchReadings = async (day: number) => {
        if (isPlaying || ttsManager.isSpeaking()) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        }

        setLoading(true);
        setError(null);

        try {
            const data: BibleDay = (biblePlan as BibleDay[])[day - 1];
            const readingsToFetch: Reading[] = [];

            // Fetch First Reading
            try {
                const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(data.first_reading)}&lang=${language}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.debug) console.log('[Bible Debug] First Reading:', result.debug);
                    console.log('[Bible Text] First Reading length:', result.text?.length, 'Preview:', result.text?.substring(0, 100));
                    readingsToFetch.push({
                        title: t.firstReading,
                        citation: data.first_reading,
                        text: result.text || `📖 ${data.first_reading}\n\n[Scripture text loading...]`
                    });
                } else {
                    readingsToFetch.push({
                        title: t.firstReading,
                        citation: data.first_reading,
                        text: `📖 ${data.first_reading}\n\n[Scripture text will be available shortly - API deploying...]`
                    });
                }
            } catch (err) {
                readingsToFetch.push({
                    title: t.firstReading,
                    citation: data.first_reading,
                    text: `📖 ${data.first_reading}\n\n[Scripture text will be available shortly - API deploying...]`
                });
            }

            // Fetch Second Reading (if exists)
            if (data.second_reading) {
                try {
                    const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(data.second_reading)}&lang=${language}`);
                    if (response.ok) {
                        const result = await response.json();
                        if (result.debug) console.log('[Bible Debug] Second Reading:', result.debug);
                        readingsToFetch.push({
                            title: t.secondReading,
                            citation: data.second_reading,
                            text: result.text || `📖 ${data.second_reading}\n\n[Scripture text loading...]`
                        });
                    } else {
                        readingsToFetch.push({
                            title: t.secondReading,
                            citation: data.second_reading,
                            text: `📖 ${data.second_reading}\n\n[Scripture text will be available shortly - API deploying...]`
                        });
                    }
                } catch (err) {
                    readingsToFetch.push({
                        title: t.secondReading,
                        citation: data.second_reading,
                        text: `📖 ${data.second_reading}\n\n[Scripture text will be available shortly - API deploying...]`
                    });
                }
            }

            // Fetch Psalm/Proverbs
            try {
                const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(data.psalm_proverbs)}&lang=${language}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.debug) console.log('[Bible Debug] Psalm/Proverbs:', result.debug);
                    readingsToFetch.push({
                        title: t.psalmProverbs,
                        citation: data.psalm_proverbs,
                        text: result.text || `📖 ${data.psalm_proverbs}\n\n[Scripture text loading...]`
                    });
                } else {
                    readingsToFetch.push({
                        title: t.psalmProverbs,
                        citation: data.psalm_proverbs,
                        text: `📖 ${data.psalm_proverbs}\n\n[Scripture text will be available shortly - API deploying...]`
                    });
                }
            } catch (err) {
                readingsToFetch.push({
                    title: t.psalmProverbs,
                    citation: data.psalm_proverbs,
                    text: `📖 ${data.psalm_proverbs}\n\n[Scripture text will be available shortly - API deploying...]`
                });
            }

            setReadings(readingsToFetch);
        } catch (err) {
            console.error('[Bible] Error:', err);
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReadings(currentDay);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentDay, language]);

    useEffect(() => {
        return () => {
            if (ttsManager.isSpeaking()) {
                ttsManager.stop();
            }
        };
    }, []);

    const changeDay = (delta: number) => {
        const newDay = currentDay + delta;
        if (newDay >= 1 && newDay <= 365) {
            setCurrentDay(newDay);
        }
    };

    const chunkText = (text: string, maxLength: number = 200): string[] => {
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks: string[] = [];
        let currentChunk = '';

        sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length > maxLength) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        });
        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    };

    const handlePlayContent = async (id: string, title: string, text: string) => {
        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            if (ttsManager.isSpeaking()) {
                ttsManager.stop();
            }

            // Extract book name from citation (e.g., "Genesis 1-2" -> "Genesis")
            // Remove markdown headers (###) and verse numbers [1], [2], etc. for TTS
            const spokenText = text
                .replace(/###\s*/g, '')  // Remove markdown headers
                .replace(/\[\s*\d+\s*\]/g, '')  // Remove verse numbers like [1], [2], etc.
                .replace(/\//g, ' ');  // Replace slashes with spaces (e.g., "Psalm/Proverbs" -> "Psalm Proverbs")
            const chunks = chunkText(spokenText);

            // Create segments: Title first, then the text chunks
            const segments = [
                { text: title, gender: 'female' as const, postPause: 500 },
                ...chunks.map(chunk => ({
                    text: chunk,
                    gender: 'female' as const
                }))
            ];

            setIsPlaying(true);
            setCurrentlyPlayingId(id);

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
            });

            await ttsManager.speakSegments(segments);
        }
    };

    const handlePlayAll = async () => {
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            // Process all readings with titles and proper chapter markers
            const segments: any[] = [];

            readings.forEach(r => {
                // Add title segment
                segments.push({ text: r.title, gender: 'female' as const, postPause: 500 });

                // Remove markdown headers (###) and verse numbers [1], [2], etc. for TTS
                const spokenText = r.text
                    .replace(/###\s*/g, '')  // Remove markdown headers
                    .replace(/\[\s*\d+\s*\]/g, '')  // Remove verse numbers like [1], [2], etc.
                    .replace(/\//g, ' ');  // Replace slashes with spaces

                // Chunk the text
                const chunks = chunkText(spokenText);
                chunks.forEach(chunk => {
                    segments.push({ text: chunk, gender: 'female' as const });
                });

                // Add pause between readings
                if (segments.length > 0) {
                    segments[segments.length - 1].postPause = 1000;
                }
            });

            setIsPlaying(true);
            setCurrentlyPlayingId('all');

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
                // Auto-mark as complete when full playlist finishes
                markDayComplete(currentDay);
            });

            await ttsManager.speakSegments(segments);
        }
    };

    const renderReadingText = (text: string) => {
        const lines = text.split('\n');
        const nodes: any[] = [];
        let currentParagraph: string[] = [];

        const flushParagraph = (key: string) => {
            if (currentParagraph.length > 0) {
                nodes.push(
                    <p key={key} className="reading-paragraph">
                        {currentParagraph.join(' ')}
                    </p>
                );
                currentParagraph = [];
            }
        };

        lines.forEach((line, i) => {
            const cleanLine = line.trim();

            // Empty line -> Paragraph Break
            if (!cleanLine) {
                flushParagraph(`p-break-${i}`);
                return;
            }

            // Header Detection -> Flush current paragraph, then render header
            if (cleanLine.startsWith('###')) {
                flushParagraph(`p-before-header-${i}`);
                // Remove the ### marker and render as styled H4
                const headerText = cleanLine.replace(/^###\s*/, '').trim();
                nodes.push(
                    <h4 key={`h-${i}`} className="reading-chapter-header" style={{
                        marginTop: '1.5rem',
                        marginBottom: '1rem',
                        color: '#FBBF24',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {headerText}
                    </h4>
                );
            } else {
                // Regular Text Line -> Add to current paragraph buffer
                // This ensures lines like "was" are joined to the previous line
                currentParagraph.push(cleanLine);
            }
        });

        // Flush any remaining text at the end
        flushParagraph('p-end');

        return nodes;
    };



    return (
        <div className="readings-container fade-in">
            <div className="readings-header-section">
                <div className="readings-top-bar">
                    <button onClick={onBack} className="icon-btn" aria-label={t.back}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="page-title">{t.title}</h1>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="icon-btn"
                        aria-label="Settings"
                    >
                        <SettingsIcon size={24} />
                    </button>
                </div>

                <div className="date-controls-wrapper">
                    <button onClick={() => changeDay(-1)} className="icon-btn nav-arrow" aria-label="Previous Day" disabled={currentDay === 1}>
                        <ChevronLeft size={28} />
                    </button>
                    <h2 className="date-display">
                        {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                            weekday: 'long', month: 'long', day: 'numeric'
                        })}
                    </h2>
                    <button onClick={() => changeDay(1)} className="icon-btn nav-arrow" aria-label="Next Day" disabled={currentDay === 365}>
                        <ChevronRight size={28} />
                    </button>
                </div>
            </div>

            <div className="readings-content">
                {loading && (
                    <div className="readings-loading-container">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">{t.loading}</div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="liturgical-info">
                        <h2 className="liturgical-day" style={{ color: '#D4AF37', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {dayData.period}
                        </h2>
                        <div className="lectionary-row">
                            <div className="lectionary-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                {isDayComplete(currentDay) && (
                                    <CheckCircle size={18} color="#10b981" fill="#10b981" stroke="white" strokeWidth={2.5} />
                                )}
                                <p className="lectionary-text" style={{ margin: 0 }}>{t.day} {currentDay} {t.of} 365</p>
                                <button
                                    onClick={() => setShowProgressModal(true)}
                                    className="icon-btn"
                                    aria-label={t.viewCalendar}
                                    style={{
                                        position: 'relative',
                                        padding: '4px',
                                        background: 'transparent',
                                        border: 'none',
                                        boxShadow: 'none',
                                        color: 'inherit' // Inherit text color (likely gray/white)
                                    }}
                                >
                                    <Calendar size={20} />
                                    {missedDays.length > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: 8,
                                            height: 8,
                                            backgroundColor: '#ef4444',
                                            borderRadius: '50%'
                                        }} />
                                    )}
                                </button>
                            </div>
                            {readings.length > 0 && (
                                <button
                                    className={`play-all-btn ${isPlaying ? 'playing' : ''}`}
                                    onClick={handlePlayAll}
                                    aria-label={isPlaying ? "Stop All" : "Play All"}
                                >
                                    {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                    <span>{t.playAll}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!loading && !error && readings.map((reading, index) => (
                    <div key={index} className="reading-card">
                        <div className="reading-header">
                            <div className="reading-title-section">
                                <h3 className="reading-title">{reading.title}</h3>
                                {reading.citation && <div className="reading-citation">{reading.citation}</div>}
                            </div>
                            <button
                                className={`reading-play-btn ${isPlaying && currentlyPlayingId === `reading-${index}` ? 'playing' : ''}`}
                                onClick={() => handlePlayContent(`reading-${index}`, reading.title, reading.text)}
                                aria-label={isPlaying && currentlyPlayingId === `reading-${index}` ? "Stop" : "Play"}
                            >
                                {isPlaying && currentlyPlayingId === `reading-${index}` ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                        </div>
                        <div className="reading-text">
                            {renderReadingText(reading.text)}
                        </div>
                    </div>
                ))}

                {/* Completion Button */}
                {!loading && !error && (
                    <div className="completion-section" style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '4rem' }}>
                        <button
                            onClick={() => isDayComplete(currentDay) ? unmarkDay(currentDay) : markDayComplete(currentDay)}
                            className={`completion-btn ${isDayComplete(currentDay) ? 'completed' : ''}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                borderRadius: '30px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                backgroundColor: isDayComplete(currentDay) ? '#10b981' : '#1d4ed8', // Green vs Blue
                                color: '#fff',
                                transition: 'all 0.3s ease',
                                border: '2px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                boxShadow: isDayComplete(currentDay)
                                    ? '0 0 15px rgba(16, 185, 129, 0.4)'
                                    : '0 4px 12px rgba(29, 78, 216, 0.3)'
                            }}
                        >
                            {isDayComplete(currentDay) ? <CheckCircle size={20} /> : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }} />}
                            {isDayComplete(currentDay) ? t.completed : t.markComplete}
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <div className="sources-attribution">
                        <p>
                            Source:{' '}
                            <a href="https://github.com/wldeh/bible-api" target="_blank" rel="noopener noreferrer">
                                wldeh/bible-api
                            </a>
                            <button
                                className="info-btn-text"
                                onClick={() => setShowInfo(!showInfo)}
                                aria-label="Copyright Information"
                            >
                                <Info size={16} />
                            </button>
                        </p>
                        {showInfo && (
                            <p className="attribution-detail" style={{ fontSize: '0.8rem', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto' }}>
                                English: King James Version (KJV) • Spanish: Biblia en Español Sencillo (BES) • Both versions are Public Domain, served via GitHub CDN.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={() => { }}
            />

            {
                showProgressModal && (
                    <BibleProgressModal
                        onClose={() => setShowProgressModal(false)}
                        onDaySelect={(day) => {
                            setCurrentDay(day);
                            setShowProgressModal(false);
                        }}
                    />
                )
            }
        </div >
    );
}
