import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Square, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { SettingsModal } from './SettingsModal';
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
                console.log('[Vatican API] Success:', vatican);
                console.log('[Vatican API] Readings count:', vatican.readings?.length);
                console.log('[Vatican API] Reflection:', vatican.reflection ? 'Found' : 'None');
                if (vatican.debug) {
                    console.log('[Vatican API] Debug Structure:', JSON.stringify(vatican.debug, null, 2));
                }
                setVaticanData(vatican);
                setReflection(vatican.reflection);
            } else {
                console.log('[Vatican API] Failed');
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
            ttsManager.stop();
        };
    }, []);

    const changeDate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    // Normalize reading titles: convert "Reading I" -> "First Reading", "Reading II" -> "Second Reading"
    const normalizeReadingTitle = (title: string): string => {
        const romanToOrdinal: Record<string, string> = {
            'I': language === 'es' ? 'Primera Lectura' : 'First Reading',
            'II': language === 'es' ? 'Segunda Lectura' : 'Second Reading',
            'III': language === 'es' ? 'Tercera Lectura' : 'Third Reading'
        };

        // Match "Reading I", "Reading II", etc.
        const match = title.match(/Reading\s+([IVX]+)/i);
        if (match && romanToOrdinal[match[1]]) {
            return romanToOrdinal[match[1]];
        }

        return title;
    };

    // Parse reading text and highlight responses (text inside <strong> tags or starting with R. / R/)
    const renderReadingText = (text: string) => {
        return text.split('\n\n').map((para, paraIndex) => {
            if (para.includes('R.') || para.includes('R/')) {
                console.log('[Text Render] Checking R.:', para.substring(0, 50));
            }
            if (para.includes('<strong>')) {
                console.log('[Text Render] Found strong:', para.substring(0, 50));
            }

            // Check if paragraph contains <strong> tags (response text)
            if (para.includes('<strong>')) {
                // Parse HTML and highlight strong content
                const parts: React.ReactNode[] = [];
                let lastIndex = 0;
                const strongRegex = /<strong>(.*?)<\/strong>/g;
                let match;

                while ((match = strongRegex.exec(para)) !== null) {
                    // Add text before <strong>
                    if (match.index > lastIndex) {
                        const beforeText = para.substring(lastIndex, match.index);
                        // Remove HTML tags from plain text
                        parts.push(beforeText.replace(/<[^>]+>/g, ''));
                    }
                    // Add highlighted response text
                    parts.push(
                        <span key={match.index} className="response-highlight">
                            {match[1]}
                        </span>
                    );
                    lastIndex = match.index + match[0].length;
                }

                // Add remaining text after last <strong>
                if (lastIndex < para.length) {
                    const afterText = para.substring(lastIndex);
                    parts.push(afterText.replace(/<[^>]+>/g, ''));
                }

                return <p key={paraIndex}>{parts}</p>;
            }

            // Fallback for "R." removed - only highlight if explicit <strong> tags exist
            // to avoid highlighting entire paragraphs incorrectly.

            // No strong tags - render as plain text (strip any HTML and entities)
            return <p key={paraIndex}>{para.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')}</p>;
        });
    };

    // Normalize text for speech (fix punctuation pronunciation)
    const normalizeForSpeech = (text: string): string => {
        return text
            // Replace hyphens in number ranges (1-5 -> 1 to 5)
            .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 to $2')
            // Replace colons in time/verse with pause
            .replace(/(\d+):(\d+)/g, '$1 $2')
            // Replace commas between numbers (European/Spanish notation: Mk 2, 18)
            .replace(/(\d+),\s*(\d+)/g, '$1 $2')
            // Replace semicolons with commas for better pausing
            .replace(/;/g, ',')
            // Remove parentheses and brackets but keep content
            .replace(/[()\[\]]/g, '')
            // Normalize smart quotes to nothing
            .replace(/['""'']/g, '')
            // Replace other standalone hyphens with pauses
            .replace(/\s[-–—]\s/g, ', ')
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;?/g, ' ')  // Replace &nbsp with or without semicolon
            .replace(/\u00A0/g, ' ')   // Replace literal non-breaking space char
            .replace(/<[^>]+>/g, '');
    };

    // Remove scripture citations from text for audio (lines that look like "Isaiah 40:1-5, 9-11" or "1 Corintios 13:4")
    const stripCitations = (text: string): string => {
        const cleaned = text
            .split('\n')
            .filter(line => {
                // Aggressively clean line: remove HTML tags, replace nbsp, then trim
                const trimmed = line.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').trim();

                // Skip lines that look like scripture references (book name followed by numbers/colons)
                // Updated to handle:
                // 1. Optional leading number (1 Kings, 2 Cor) -> ^(\d\s+)?
                // 2. Accented characters in book names -> [A-Za-z\u00C0-\u00FF]
                if (/^(\d\s+)?[A-Z\u00C0-\u00FF][a-z\u00C0-\u00FF]+(\s+[A-Z\u00C0-\u00FF][a-z\u00C0-\u00FF]+)*\s+\d+[:;\d\s,\-–—]+$/.test(trimmed)) {
                    return false;
                }
                return true;
            })
            .join('\n')
            .trim();

        return normalizeForSpeech(cleaned);
    };

    // Play arbitrary content (Vatican, Reflection, etc)
    const handlePlayContent = async (id: string, title: string, text: string) => {
        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            const cleanText = stripCitations(text.replace(/<[^>]+>/g, ''));
            console.log('[TTS Debug] Speaking Text:', cleanText);
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

    // Play All - plays all readings sequentially
    const handlePlayAll = async () => {
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            // Determine which readings to play based on source
            const readingsToPlay = readingSource === 'usccb' ? data?.readings : vaticanData?.readings;

            if (!readingsToPlay || readingsToPlay.length === 0) return;

            // Build segments with only titles and text
            const segments = [
                // Add day title for both sources (Liturgical day is universal-ish)
                ...(data?.title ? [{ text: data.title, gender: 'female' as const, postPause: 1000 }] : []),

                ...readingsToPlay.flatMap(reading => [
                    { text: normalizeReadingTitle(reading.title), gender: 'female' as const, postPause: 800 },
                    { text: stripCitations(reading.text), gender: 'female' as const, postPause: 1500 }
                ]),
                // Always add reflection if available
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

    // Play individual reading


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
                        {data?.title && <h2 className="liturgical-day">{data.title}</h2>}
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

                {/* USCCB Readings */}
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

                {/* Vatican Readings */}
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

                {/* Common Reflection (Bottom for both) */}
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

                {/* Source Attribution */}
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
