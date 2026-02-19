
import { useState, useEffect } from 'react';
import {
    Settings,
    Calendar,
    Play,
    ChevronDown,
    CheckCircle,
    Square,
    ChevronLeft,
    Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { useBibleProgress } from '../hooks/useBibleProgress';
import biblePlan from '../data/bibleInYearPlan.json';
import { BibleProgressModal } from './BibleProgressModal';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import './BibleInYearScreen.css';

interface BibleDay {
    day: number;
    period: string;
    first_reading: string;
    second_reading: string | null;
    psalm_proverbs: string;
}

interface Reading {
    title: string;
    citation: string;
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

    // Expanded sections state (keyed by citation or title)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const [showSettings, setShowSettings] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showSourceInfo, setShowSourceInfo] = useState(false);

    const {
        markDayComplete,
        isDayComplete,
        missedDays,
        expectedDay,
        bibleStartDate
    } = useBibleProgress();

    // --- Hooks & Logic (Identical to previous, ported over) ---

    // Initial Load Logic (Catch Up)
    useEffect(() => {
        if (!bibleStartDate) return;
        if (missedDays.length > 0) {
            setCurrentDay(missedDays[0]);
        } else if (expectedDay > 1) {
            if (!isDayComplete(expectedDay)) {
                setCurrentDay(expectedDay);
            }
        }
    }, [bibleStartDate, missedDays.length, expectedDay]);

    const dayData: BibleDay = (biblePlan as BibleDay[])[currentDay - 1];

    // Translations
    const t = {
        en: {
            title: 'Bible in a Year',
            headerDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            day: 'Day',
            phase: 'Phase',
            firstReading: 'First Reading',
            secondReading: 'Second Reading',
            psalmProverbs: 'Psalms & Proverbs',
            markComplete: 'Mark as Complete',
            completed: 'Completed',
            amen: 'Amen'
        },
        es: {
            title: 'Biblia en un Año',
            headerDate: new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric' }),
            day: 'Día',
            phase: 'Fase',
            firstReading: 'Primera Lectura',
            secondReading: 'Segunda Lectura',
            psalmProverbs: 'Salmos y Proverbios',
            markComplete: 'Marcar como Completado',
            completed: 'Completado',
            amen: 'Amén'
        }
    }[language];

    // Fetch Logic
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

            // Helper to fetch single reading
            const fetchOne = async (citation: string, title: string) => {
                try {
                    const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(citation)}&lang=${language}&v=layout_v1`);
                    if (response.ok) {
                        const result = await response.json();
                        readingsToFetch.push({
                            title,
                            citation,
                            text: result.text || `📖 ${citation}\n\n[Loading...]`
                        });
                    } else {
                        readingsToFetch.push({
                            title,
                            citation,
                            text: `📖 ${citation}\n\n[unavailable]`
                        });
                    }
                } catch (e) {
                    readingsToFetch.push({ title, citation, text: `📖 ${citation}\n\n[Error]` });
                }
            };

            await fetchOne(data.first_reading, t.firstReading);
            if (data.second_reading) await fetchOne(data.second_reading, t.secondReading);
            await fetchOne(data.psalm_proverbs, t.psalmProverbs);

            setReadings(readingsToFetch);
        } catch (err) {
            setError('Failed to load readings');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReadings(currentDay);
    }, [currentDay, language]);

    // Wake Lock: Keep screen on during playback
    useEffect(() => {
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    // @ts-ignore - Navigator type might not include wakeLock yet
                    wakeLock = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.log('Wake Lock denied/error:', err);
                }
            }
        };

        if (isPlaying) {
            requestWakeLock();
        }

        return () => {
            if (wakeLock) {
                wakeLock.release().catch(console.error);
                wakeLock = null;
            }
        };
    }, [isPlaying]);

    // Audio Logic
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

    interface Chapter {
        title: string;
        text: string;
    }

    const parseChapters = (reading: Reading): Chapter[] => {
        const chapters: Chapter[] = [];
        // Check if text has markdown headers
        if (reading.text.includes('###')) {
            const segments = reading.text.split('###');
            segments.forEach(seg => {
                const clean = seg.trim();
                if (!clean) return;
                const lines = clean.split('\n');
                let title = lines[0].trim();
                // Strip "Chapter" or "Capítulo" to match design request
                title = title.replace(/(Chapter|Capítulo)\s+/i, '');

                const body = lines.slice(1).join('\n').trim();
                if (title && body) {
                    chapters.push({ title, text: body });
                }
            });
        }

        // Fallback if no chapters found
        if (chapters.length === 0) {
            chapters.push({ title: reading.citation || reading.title, text: reading.text });
        }

        return chapters;
    };

    const handlePlayAll = async () => {
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        } else {
            // Process all readings
            const segments: any[] = [];
            readings.forEach(r => {
                // Reading Title
                let cleanTitle = r.title
                    .replace(/\//g, ' ')
                    .replace(/(Chapter|Capítulo)\s*/gi, '')
                    .trim();
                cleanTitle = cleanTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');
                segments.push({ text: cleanTitle, gender: 'female' as const, postPause: 500 });

                // Parse chapters for this reading
                const chapters = parseChapters(r);

                chapters.forEach(chapter => {
                    // Chapter Title (if different from reading title)
                    if (chapter.title !== r.title && chapter.title !== r.citation) {
                        let pgTitle = chapter.title.replace(/(Chapter|Capítulo)\s*/gi, '').trim();
                        pgTitle = pgTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2'); // Comma injection
                        segments.push({ text: pgTitle, gender: 'female' as const, postPause: 400 });
                    }

                    // Content
                    let spokenText = chapter.text
                        .replace(/###\s*/g, '')
                        .replace(/\[\s*\d+\s*\]/g, '')
                        .replace(/\//g, ' ')
                        .replace(/(Chapter|Capítulo)\s+(?=\d)/gi, '');
                    spokenText = spokenText.replace(/([a-zA-Z])\s+(\d+)/g, '$1, $2');

                    const chunks = chunkText(spokenText);
                    chunks.forEach(chunk => {
                        segments.push({ text: chunk, gender: 'female' as const });
                    });
                    // Pause between chapters
                    if (chunks.length > 0) {
                        segments.push({ text: ' ', gender: 'female' as const, postPause: 800 });
                    }
                });
            });

            setIsPlaying(true);
            setCurrentlyPlayingId('all');
            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
                markDayComplete(currentDay);
            });
            await ttsManager.speakSegments(segments);
        }
    };

    const handlePlayItem = async (e: React.MouseEvent, id: string, title: string, text: string) => {
        e.stopPropagation(); // Prevent card toggle
        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            return;
        }

        setIsPlaying(true);
        setCurrentlyPlayingId(id);

        const segments: any[] = [];

        // Title
        let cleanTitle = title
            .replace(/\//g, ' ')
            .replace(/(Chapter|Capítulo)\s*/gi, '')
            .trim();
        cleanTitle = cleanTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');

        segments.push({ text: cleanTitle, gender: 'female', postPause: 500 });

        // If this is a full reading (contains ###), parse chapters first IF playing from header
        // But for simplicity, we treat text as raw content here. 
        // If 'text' passed here is raw full text, we should probably strip headers if we want to read it all linearly.

        // Content chunks
        let spokenText = text
            .replace(/###\s*/g, '')
            .replace(/\[\s*\d+\s*\]/g, '')
            .replace(/\//g, ' ')
            .replace(/(Chapter|Capítulo)\s+(?=\d)/gi, '');
        spokenText = spokenText.replace(/([a-zA-Z])\s+(\d+)/g, '$1, $2');

        const chunks = chunkText(spokenText);
        chunks.forEach(chunk => {
            segments.push({ text: chunk, gender: 'female' as const });
        });

        ttsManager.setOnEnd(() => {
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
        });

        await ttsManager.speakSegments(segments);
    };

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Render Helpers
    const renderContent = (text: string) => {
        // Simple markdown stripper for display
        return text.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            if (line.startsWith('###')) {
                return <h4 key={i} className="font-bold text-primary mt-4 mb-2">{line.replace('###', '')}</h4>;
            }
            return <p key={i} className="mb-2">{line}</p>;
        });
    };

    const isCompleted = isDayComplete(currentDay);

    return (
        <div className="bible-container">
            {/* Header */}
            <header className="sacred-header">
                <div className="header-top-row">
                    <button
                        className="icon-btn-ghost"
                        onClick={onBack}
                        aria-label="Back"
                    >
                        <ChevronLeft size={28} />
                    </button>

                    <h1 className="header-title">{t.title}</h1>

                    <button
                        className="icon-btn-ghost"
                        onClick={() => setShowSettings(true)}
                        aria-label="Settings"
                    >
                        <Settings size={24} />
                    </button>
                </div>

                <div className="date-row">
                    <span className="date-text">
                        {/* Dynamic Date based on current Day? Or Today? Wireframe says "January 15". */}
                        {/* We should probably show the DATE associated with the PLAN day if possible, or just Today. */}
                        {/* Implementation Plan says: [Date] < Day X of 365 >. */}
                        {/* I will use the current date for now as per wireframe text "January 15 • Day 15" */}
                        {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', day: 'numeric' })}
                        {' • '}
                        {t.day} {currentDay}
                    </span>
                    <button
                        className="icon-btn-ghost"
                        style={{ width: 'auto', height: 'auto', padding: 0, position: 'relative' }}
                        onClick={() => setShowProgressModal(true)}
                        aria-label="View Progress"
                    >
                        <Calendar size={18} />
                        {missedDays.length > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '8px',
                                    height: '8px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '50%'
                                }}
                            />
                        )}
                    </button>
                </div>

                <div className="controls-row">
                    <button
                        className="play-all-btn-large"
                        onClick={handlePlayAll}
                        aria-label={isPlaying && currentlyPlayingId === 'all' ? "Stop All" : "Play All"}
                    >
                        {isPlaying && currentlyPlayingId === 'all' ? (
                            <Square size={20} fill="currentColor" />
                        ) : (
                            <Play size={24} fill="currentColor" />
                        )}
                    </button>

                    <div className="phase-tag">
                        {/* Church Icon could go here */}
                        <span>{dayData.period}</span>
                    </div>

                    <span className="day-counter-small">
                        {t.day} {currentDay}
                    </span>
                </div>

                <div className="progress-container">
                    <div className="progress-fill" style={{ width: `${(currentDay / 365) * 100}%` }}></div>
                </div>
            </header>

            {/* Content */}
            <main className="sacred-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
                    </div>
                ) : (
                    readings.map((reading, idx) => {
                        const chapters = parseChapters(reading);

                        return (
                            <section key={idx} className="reading-section-sacred">
                                <div className="section-header-sacred">
                                    <h2 className="section-title-sacred">{reading.title}</h2>
                                    <button
                                        className={`section-play-btn-small ${currentlyPlayingId === `reading-${idx}` ? 'active' : ''}`}
                                        onClick={(e) => handlePlayItem(e, `reading-${idx}`, reading.title, reading.text)}
                                    >
                                        <span>{currentlyPlayingId === `reading-${idx}` ? (language === 'es' ? 'Detener' : 'Stop') : (language === 'es' ? 'Escuchar' : 'Listen')}</span>
                                        {currentlyPlayingId === `reading-${idx}` ? <Square size={16} /> : <Play size={20} />}
                                    </button>
                                </div>

                                {/* Render Each Parsed Chapter as a separate Card */}
                                {chapters.map((chapter, chIdx) => {
                                    const rowKey = `${idx}-${chIdx}`;
                                    return (
                                        <div
                                            key={chIdx}
                                            className="reading-card-sacred"
                                            onClick={() => toggleSection(rowKey)}
                                        >
                                            <div className="card-summary-row">
                                                <div className="card-left">
                                                    {/* Chapter Play Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlayItem(e, `chapter-${chapter.title}`, chapter.title, chapter.text);
                                                        }}
                                                        className="icon-btn-ghost"
                                                        style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }}
                                                    >
                                                        {isPlaying && currentlyPlayingId === `chapter-${chapter.title}` ? (
                                                            <Square size={18} fill="currentColor" />
                                                        ) : (
                                                            <Play size={18} fill="currentColor" />
                                                        )}
                                                    </button>

                                                    <span className="chapter-label">{chapter.title}</span>
                                                </div>
                                                <ChevronDown
                                                    size={20}
                                                    className={`expand-chevron ${expandedSections[rowKey] ? 'expanded' : ''}`}
                                                />
                                            </div>

                                            {expandedSections[rowKey] && (
                                                <div className="card-content-expanded fade-in">
                                                    {renderContent(chapter.text)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </section>
                        );
                    })
                )}

                {/* Flourish */}
                <div className="flourish-container">
                    <div className="flourish-line"></div>
                    <div className="flourish-text">{t.amen}</div>
                    <div className="flourish-line"></div>
                </div>
            </main>

            {/* Fixed Footer */}
            <div className="footer-fixed">
                <button
                    className="mark-complete-btn"
                    onClick={() => markDayComplete(currentDay)}
                    disabled={isCompleted}
                >
                    <CheckCircle size={20} />
                    <span className="mark-complete-text">
                        {isCompleted ? t.completed : t.markComplete}
                    </span>
                </button>

                <div className="source-container-sacred">
                    <div className="source-row">
                        <a
                            href="https://github.com/wldeh/bible-api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link-sacred"
                        >
                            <span>Source: wldeh/bible-api</span>
                        </a>
                        <button
                            className="info-icon-btn"
                            onClick={() => setShowSourceInfo(!showSourceInfo)}
                            aria-label="Show source details"
                        >
                            <Info size={14} />
                        </button>
                    </div>

                    {showSourceInfo && (
                        <p className="source-details-text">
                            English: King James Version (KJV) • Spanish: Biblia en Español Sencillo (BES) • Both versions are Public Domain, served via GitHub CDN.
                        </p>
                    )}
                </div>
            </div>

            {/* Modals */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
            {showProgressModal && (
                <BibleProgressModal
                    onClose={() => setShowProgressModal(false)}
                    onDaySelect={setCurrentDay}
                />
            )}
        </div>
    );
}
