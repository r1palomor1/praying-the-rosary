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

export default function DailyReadingsScreen({ onBack }: { onBack: () => void }) {
    const { language } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<DailyReadingsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);

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
            setCurrentlyPlayingIndex(null);
        }

        setLoading(true);
        setError(null);
        try {
            const dateStr = formatDateParam(date);
            const response = await fetch(`/api/readings?date=${dateStr}&lang=${language}`);
            if (!response.ok) throw new Error('Failed to fetch readings');
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error(err);
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

    // Play All - plays all readings sequentially
    const handlePlayAll = async () => {
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingIndex(null);
        } else {
            if (!data?.readings) return;

            const segments = data.readings.flatMap(reading => [
                { text: reading.title, gender: 'female' as const, postPause: 800 },
                { text: reading.citation || '', gender: 'female' as const, postPause: 800 },
                { text: reading.text, gender: 'female' as const, postPause: 1500 }
            ]).filter(s => s.text);

            setIsPlaying(true);
            setCurrentlyPlayingIndex(0); // Start with first reading
            await ttsManager.setLanguage(language);

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingIndex(null);
            });

            try {
                await ttsManager.speakSegments(segments);
            } catch (e) {
                console.error("Audio error", e);
                setIsPlaying(false);
                setCurrentlyPlayingIndex(null);
            }
        }
    };

    // Play individual reading
    const handlePlayReading = async (index: number) => {
        if (isPlaying && currentlyPlayingIndex === index) {
            // Stop if clicking the currently playing reading
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingIndex(null);
        } else {
            if (!data?.readings[index]) return;

            const reading = data.readings[index];
            const segments = [
                { text: reading.title, gender: 'female' as const, postPause: 800 },
                { text: reading.citation || '', gender: 'female' as const, postPause: 800 },
                { text: reading.text, gender: 'female' as const, postPause: 1500 }
            ].filter(s => s.text);

            setIsPlaying(true);
            setCurrentlyPlayingIndex(index);
            await ttsManager.setLanguage(language);

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingIndex(null);
            });

            try {
                await ttsManager.speakSegments(segments);
            } catch (e) {
                console.error("Audio error", e);
                setIsPlaying(false);
                setCurrentlyPlayingIndex(null);
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
                        {data?.title && <h2 className="liturgical-day">{data.title}</h2>}
                        <div className="lectionary-row">
                            {data?.lectionary && <p className="lectionary-text">{data.lectionary}</p>}
                            {data?.readings && data.readings.length > 0 && (
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

                {!loading && !error && data?.readings.map((reading, index) => (
                    <div key={index} className="reading-card">
                        <div className="reading-header">
                            <div className="reading-title-section">
                                <h3 className="reading-title">{reading.title}</h3>
                                {reading.citation && <div className="reading-citation">{reading.citation}</div>}
                            </div>
                            <button
                                className={`reading-play-btn ${isPlaying && currentlyPlayingIndex === index ? 'playing' : ''}`}
                                onClick={() => handlePlayReading(index)}
                                aria-label={isPlaying && currentlyPlayingIndex === index ? "Stop" : "Play"}
                            >
                                {isPlaying && currentlyPlayingIndex === index ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                        </div>
                        <div className="reading-text">
                            {reading.text.split('\n\n').map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                        </div>
                    </div>
                ))}

                {!loading && !error && data?.readings.length === 0 && (
                    <div className="empty-state">
                        <p>No readings found for this date.</p>
                        <a href={data?.source} target="_blank" rel="noreferrer" className="external-link">
                            View on USCCB Website
                        </a>
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
