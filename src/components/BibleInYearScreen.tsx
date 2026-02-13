import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Play, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
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

export default function BibleInYearScreen({ onBack }: Props) {
    const { language } = useApp();
    const [currentDay, setCurrentDay] = useState(1);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);


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
            error: 'Unable to load readings. Please check your connection.'
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
            error: 'No se pudieron cargar las lecturas. Verifique su conexión.'
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

    const handlePlayContent = async (id: string, text: string) => {
        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            if (ttsManager.isSpeaking()) {
                ttsManager.stop();
            }
            setIsPlaying(true);
            setCurrentlyPlayingId(id);
            await ttsManager.speakSegments([{ text, gender: 'female' }]);
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        }
    };

    const handlePlayAll = async () => {
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            const allText = readings.map(r => r.text).join(' ');
            setIsPlaying(true);
            setCurrentlyPlayingId('all');
            await ttsManager.speakSegments([{ text: allText, gender: 'female' }]);
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        }
    };

    const renderReadingText = (text: string) => {
        return text.split('\n').map((paragraph, i) => (
            <p key={i} className="reading-paragraph">{paragraph}</p>
        ));
    };



    return (
        <div className="readings-container fade-in">
            <div className="readings-header-section">
                <div className="readings-top-bar">
                    <button onClick={onBack} className="icon-btn" aria-label={t.back}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="page-title">{t.title}</h1>
                    <div style={{ width: '40px' }}></div>
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
                            <div className="lectionary-center">
                                <p className="lectionary-text">{t.day} {currentDay} {t.of} 365</p>
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
                                onClick={() => handlePlayContent(`reading-${index}`, reading.text)}
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
            </div>
        </div>
    );
}
