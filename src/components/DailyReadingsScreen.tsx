
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Square, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { SettingsModal } from './SettingsModal';
import { fetchLiturgicalDay, getLiturgicalColorHex } from '../utils/liturgicalCalendar';
import './DailyReadingsScreen.css';

interface Reading {
    title: string;
    citation?: string;
    text: string;
}

interface DailyReadingsData {
    date: string;
    source: string;
    title?: string;
    lectionary?: string;
    readings: Reading[];
}

interface DailyReflection {
    title: string;
    content: string;
    date: string;
}

export default function DailyReadingsScreen({ onBack }: { onBack: () => void }) {
    const { language } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<DailyReadingsData | null>(null);
    const [vaticanData, setVaticanData] = useState<{ readings: Reading[], reflection: DailyReflection | null } | null>(null);
    const [reflection, setReflection] = useState<DailyReflection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
    const [readingSource, setReadingSource] = useState<'usccb' | 'vatican'>('vatican');
    const [showSettings, setShowSettings] = useState(false);
    const [liturgicalColor, setLiturgicalColor] = useState('#10B981'); // Default green

    // Use production API in dev mode for browser testing
    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

    // Format date as MMDDYY for the API
    const formatDateParam = (date: Date) => {
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const yy = date.getFullYear().toString().slice(-2);
        return `${mm}${dd}${yy}`;
    };

    const fetchReadings = async (date: Date) => {
        // Stop any playing audio when changing dates
        if (isPlaying || ttsManager.isSpeaking()) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch Liturgical Color for this specific date
            fetchLiturgicalDay(date, language).then(liturgy => {
                if (liturgy && liturgy.celebrations && liturgy.celebrations.length > 0) {
                    setLiturgicalColor(getLiturgicalColorHex(liturgy.celebrations[0].colour));
                } else {
                    setLiturgicalColor('#10B981');
                }
            }).catch(e => console.log('Color fetch minor error', e));


            // Fetch USCCB readings
            const dateStr = formatDateParam(date);
            const usccbResponse = await fetch(`${API_BASE}/api/readings?date=${dateStr}&lang=${language}`);

            if (usccbResponse.ok) {
                const usccbData = await usccbResponse.json();
                setData(usccbData);
            } else {
                setData(null);
            }

            // Fetch Vatican readings + reflection
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const vaticanDate = `${year}-${month}-${day}`;

            console.log('[Vatican API] Fetching:', vaticanDate, 'lang:', language);
            const vaticanResponse = await fetch(`${API_BASE}/api/vatican-reflection?date=${vaticanDate}&lang=${language}`);

            if (vaticanResponse.ok) {
                const vatican = await vaticanResponse.json();
                setVaticanData(vatican);
                setReflection(vatican.reflection);
            } else {
                setVaticanData(null);
                setReflection(null);
            }

        } catch (err) {
            console.error('[Readings] Error:', err);
            setError('Unable to load readings. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce slightly to avoid rapid clicks spamming API
        const timer = setTimeout(() => {
            fetchReadings(currentDate);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentDate, language]);

    // Handle cleanup when unmounting
    useEffect(() => {
        return () => {
            if (ttsManager.isSpeaking()) {
                ttsManager.stop();
            }
        };
    }, []);

    const changeDate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    // Normalize reading titles
    const normalizeReadingTitle = (title: string): string => {
        const romanToOrdinal: Record<string, string> = {
            'I': language === 'es' ? 'Primera Lectura' : 'First Reading',
            'II': language === 'es' ? 'Segunda Lectura' : 'Second Reading',
            'III': language === 'es' ? 'Tercera Lectura' : 'Third Reading'
        };

        const match = title.match(/Reading\s+([IVX]+)/i);
        if (match && romanToOrdinal[match[1]]) {
            return romanToOrdinal[match[1]];
        }
        return title;
    };

    // Parse reading text
    const renderReadingText = (text: string) => {
        return text.split('\n\n').map((para, paraIndex) => {
            if (para.includes('<strong>')) {
                const parts: React.ReactNode[] = [];
                let lastIndex = 0;
                const strongRegex = /<strong>(.*?)<\/strong>/g;
                let match;

                while ((match = strongRegex.exec(para)) !== null) {
                    if (match.index > lastIndex) {
                        const beforeText = para.substring(lastIndex, match.index);
                        parts.push(beforeText.replace(/<[^>]+>/g, ''));
                    }
                    parts.push(
                        <span key={match.index} className="response-highlight">
                            {match[1]}
                        </span>
                    );
                    lastIndex = match.index + match[0].length;
                }
                if (lastIndex < para.length) {
                    const afterText = para.substring(lastIndex);
                    parts.push(afterText.replace(/<[^>]+>/g, ''));
                }
                return <p key={paraIndex}>{parts}</p>;
            }
            return <p key={paraIndex}>{para.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')}</p>;
        });
    };

    // Play arbitrary content
    const handlePlayContent = async (id: string, title: string, text: string) => {
        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            const cleanText = text.replace(/<[^>]+>/g, '');
            const segments = [
                { text: title, gender: 'female' as const, postPause: 800 },
                { text: cleanText, gender: 'female' as const, postPause: 0 }
            ];

            setIsPlaying(true);
            setCurrentlyPlayingId(id);
            await ttsManager.setLanguage(language);

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
            });

            try {
                await ttsManager.speakSegments(segments);
            } catch (e) {
                console.error("Audio error", e);
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
            }
        }
    };

    // Play All
    const handlePlayAll = async () => {
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            const readingsToPlay = readingSource === 'usccb' ? data?.readings : vaticanData?.readings;
            if (!readingsToPlay || readingsToPlay.length === 0) return;

            const segments = [
                ...(data?.title ? [{ text: data.title, gender: 'female' as const, postPause: 1000 }] : []),
                ...readingsToPlay.flatMap(reading => [
                    { text: normalizeReadingTitle(reading.title), gender: 'female' as const, postPause: 800 },
                    { text: reading.text.replace(/<[^>]+>/g, ''), gender: 'female' as const, postPause: 1500 }
                ]),
                ...(reflection ? [
                    { text: reflection.title, gender: 'female' as const, postPause: 800 },
                    { text: reflection.content.replace(/<[^>]+>/g, ''), gender: 'female' as const, postPause: 0 }
                ] : [])
            ].filter(s => s.text);

            setIsPlaying(true);
            setCurrentlyPlayingId('all');
            await ttsManager.setLanguage(language);

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
            });

            try {
                await ttsManager.speakSegments(segments);
            } catch (e) {
                console.error("Audio error", e);
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
            }
        }
    };

    return (
        <div className="readings-container fade-in">
            <div className="readings-header-section">
                <div className="readings-top-bar">
                    <button onClick={onBack} className="icon-btn" aria-label="Back">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="page-title">
                        {language === 'es' ? 'Lecturas Diarias' : 'Daily Readings'}
                    </h1>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="icon-btn"
                        aria-label="Settings"
                    >
                        <SettingsIcon size={24} />
                    </button>
                </div>

                <div className="date-controls-wrapper">
                    <button onClick={() => changeDate(-1)} className="icon-btn nav-arrow" aria-label="Previous Day">
                        <ChevronLeft size={28} />
                    </button>
                    <h2 className="date-display">
                        {currentDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                            weekday: 'long', month: 'long', day: 'numeric'
                        })}
                    </h2>
                    <button onClick={() => changeDate(1)} className="icon-btn nav-arrow" aria-label="Next Day">
                        <ChevronRight size={28} />
                    </button>
                </div>
            </div>

            <div className="readings-content">
                {loading && (
                    <div className="readings-loading-container">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">Loading...</div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && (
                    <div className="liturgical-info">
                        {data?.title && (
                            <h2
                                className="liturgical-day"
                                style={{ color: liturgicalColor, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                            >
                                {data.title}
                            </h2>
                        )}
                        <div className="lectionary-row">
                            <div className="lectionary-center">
                                {data?.lectionary && <p className="lectionary-text">{data.lectionary}</p>}
                            </div>
                            <select
                                className="source-select"
                                value={readingSource}
                                onChange={(e) => setReadingSource(e.target.value as 'usccb' | 'vatican')}
                                aria-label={language === 'es' ? 'Fuente de lectura' : 'Reading Source'}
                            >
                                <option value="vatican">VATICAN</option>
                                <option value="usccb">USCCB</option>
                            </select>
                            {(readingSource === 'usccb' ? data?.readings : vaticanData?.readings) && (readingSource === 'usccb' ? data!.readings.length > 0 : vaticanData!.readings.length > 0) && (
                                <button
                                    className={`play-all-btn ${isPlaying ? 'playing' : ''}`}
                                    onClick={handlePlayAll}
                                    aria-label={isPlaying ? "Stop All" : "Play All"}
                                >
                                    {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                    <span>{language === 'es' ? 'Todo' : 'All'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!loading && !error && readingSource === 'usccb' && data?.readings.map((reading, index) => (
                    <div key={index} className="reading-card">
                        <div className="reading-header">
                            <div className="reading-title-section">
                                <h3 className="reading-title">{normalizeReadingTitle(reading.title)}</h3>
                                {reading.citation && <div className="reading-citation">{reading.citation}</div>}
                            </div>
                            <button
                                className={`reading-play-btn ${isPlaying && currentlyPlayingId === `usccb-${index}` ? 'playing' : ''}`}
                                onClick={() => handlePlayContent(`usccb-${index}`, normalizeReadingTitle(reading.title), reading.text)}
                                aria-label={isPlaying && currentlyPlayingId === `usccb-${index}` ? "Stop" : "Play"}
                            >
                                {isPlaying && currentlyPlayingId === `usccb-${index}` ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                        </div>
                        <div className="reading-text">
                            {renderReadingText(reading.text)}
                        </div>
                    </div>
                ))}

                {!loading && !error && readingSource === 'vatican' && vaticanData?.readings.map((reading, index) => (
                    <div key={`vatican-${index}`} className="reading-card">
                        <div className="reading-header">
                            <div className="reading-title-section">
                                <h3 className="reading-title">{reading.title}</h3>
                            </div>
                            <button
                                className={`reading-play-btn ${isPlaying && currentlyPlayingId === `vatican-${index}` ? 'playing' : ''}`}
                                onClick={() => handlePlayContent(`vatican-${index}`, reading.title, reading.text)}
                                aria-label={isPlaying && currentlyPlayingId === `vatican-${index}` ? "Stop" : "Play"}
                            >
                                {isPlaying && currentlyPlayingId === `vatican-${index}` ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                        </div>
                        <div className="reading-text">
                            {renderReadingText(reading.text)}
                        </div>
                    </div>
                ))}

                {!loading && !error && reflection && (
                    <div className="reading-card reflection-card">
                        <div className="reading-header">
                            <div className="reading-title-section">
                                <h3 className="reading-title">
                                    {reflection.title}
                                </h3>
                            </div>
                            <button
                                className={`reading-play-btn ${isPlaying && currentlyPlayingId === 'reflection' ? 'playing' : ''}`}
                                onClick={() => handlePlayContent('reflection', reflection.title, reflection.content)}
                                aria-label={isPlaying && currentlyPlayingId === 'reflection' ? "Stop" : "Play"}
                            >
                                {isPlaying && currentlyPlayingId === 'reflection' ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                        </div>
                        <div className="reading-text">
                            {reflection.content.split('\n\n').map((para, i) => (
                                <p key={i}>{para.replace(/<[^>]+>/g, '')}</p>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && data?.readings.length === 0 && (
                    <div className="empty-state">
                        <p>No readings found for this date.</p>
                        <a href={data?.source} target="_blank" rel="noreferrer" className="external-link">
                            View on USCCB Website
                        </a>
                    </div>
                )}

                {!loading && !error && data && (
                    <div className="sources-attribution">
                        <p>
                            {language === 'es' ? 'Fuentes' : 'Sources'}:{' '}
                            <a href="https://bible.usccb.org/" target="_blank" rel="noopener noreferrer">
                                {language === 'es' ? 'Lecturas Diarias' : 'Daily Readings'}
                            </a>
                            {' • '}
                            <a href="https://www.vaticannews.va/" target="_blank" rel="noopener noreferrer">
                                {language === 'es' ? 'Palabras de los Papas' : 'Words of the Popes'}
                            </a>
                        </p>
                    </div>
                )}
            </div>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onResetProgress={() => { }}
            />
        </div>
    );
}
