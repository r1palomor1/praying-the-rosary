
import { useState, useEffect } from 'react';
import {
    Settings,
    Calendar,
    Play,
    ChevronDown,
    CheckCircle,
    Square,
    Info,
    Flag,
    RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { useBibleProgress } from '../hooks/useBibleProgress';
import { killBiblePlayback, getBiblePlaying } from '../hooks/useBiblePlayback';
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
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    const [isBibleGlobalActive, setIsBibleGlobalActive] = useState(() => getBiblePlaying());

    useEffect(() => {
        const handlePlayState = (e: Event) => setIsBibleGlobalActive((e as CustomEvent).detail.playing);
        const handleChapterActive = (e: Event) => setActiveChapterId((e as CustomEvent).detail.id);

        window.addEventListener('bible:playState', handlePlayState);
        window.addEventListener('bible:chapterActive', handleChapterActive);

        return () => {
            window.removeEventListener('bible:playState', handlePlayState);
            window.removeEventListener('bible:chapterActive', handleChapterActive);
        };
    }, []);

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
        bibleStartDate,
        markChapterComplete,
        isChapterComplete,
        completedChapters,
        completedDays
    } = useBibleProgress();

    // Auto-mark day complete if all chapters are done
    useEffect(() => {
        if (!readings || readings.length === 0) return;
        if (isDayComplete(currentDay)) return;

        let allCompleted = true;
        readings.forEach(r => {
            // Must use parseChapters locally to know chapters
            // We can define it above if needed, but it's pure logic
            let chaps: any[] = [];
            if (r.text.includes('###')) {
                const segments = r.text.split('###');
                segments.forEach((seg: string) => {
                    const clean = seg.trim();
                    if (!clean) return;
                    const lines = clean.split('\n');
                    let title = lines[0].trim().replace(/(Chapter|Capítulo)\s+/i, '');
                    const body = lines.slice(1).join('\n').trim();
                    if (title && body) chaps.push({ title });
                });
            }
            if (chaps.length === 0) chaps.push({ title: r.citation || r.title });

            if (!chaps.every(c => isChapterComplete(currentDay, c.title))) {
                allCompleted = false;
            }
        });

        if (allCompleted) {
            markDayComplete(currentDay);
        }
    }, [currentDay, readings, completedChapters, isDayComplete, isChapterComplete, markDayComplete]);

    // --- Hooks & Logic (Identical to previous, ported over) ---

    // Initial Load Logic (Catch Up)
    useEffect(() => {
        if (!bibleStartDate || isPlaying) return;
        if (missedDays.length > 0) {
            setCurrentDay(missedDays[0]);
        } else if (expectedDay > 1) {
            if (!isDayComplete(expectedDay)) {
                setCurrentDay(expectedDay);
            }
        }
    }, [bibleStartDate, missedDays.length, expectedDay, isPlaying]);

    const dayData: BibleDay = (biblePlan as BibleDay[])[currentDay - 1];

    // Translations
    const t = {
        en: {
            title: 'Bible in a Year',
            headerDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            day: 'Day',
            phase: 'Time Period',
            firstReading: 'First Reading',
            secondReading: 'Second Reading',
            psalmProverbs: 'Psalms & Proverbs',
            markComplete: 'Mark as Complete',
            completed: 'Completed',
            amen: 'Amen',
            blessing: 'The reading is now complete. May God bless you for your faithful devotion.'
        },
        es: {
            title: 'Biblia en un Año',
            headerDate: new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric' }),
            day: 'Día',
            phase: 'Etapa',
            firstReading: 'Primera Lectura',
            secondReading: 'Segunda Lectura',
            psalmProverbs: 'Salmos y Proverbios',
            markComplete: 'Marcar como Completado',
            completed: 'Completado',
            amen: 'Amén',
            blessing: 'La lectura se ha completado. Que Dios te bendiga por tu fiel devoción.'
        }
    }[language];

    // Period name translations (data source is English-only)
    const periodTranslations: Record<string, string> = language === 'es' ? {
        'Early World': 'El Mundo Antiguo',
        'Patriarchs': 'Los Patriarcas',
        'Egypt and Exodus': 'Egipto y el Éxodo',
        'Desert Wanderings': 'Las Peregrinaciones por el Desierto',
        'Conquest and Judges': 'La Conquista y los Jueces',
        'Royal Kingdom': 'El Reino Real',
        'Divided Kingdom': 'El Reino Dividido',
        'Exile': 'El Exilio',
        'Return': 'El Retorno',
        'Maccabean Revolt': 'La Revuelta Macabea',
        'Messianic Checkpoint': 'Control Mesiánico',
        'Messianic Fulfillment': 'El Cumplimiento Mesiánico',
        'The Church': 'La Iglesia'
    } : {};

    const translatePeriod = (p: string) => periodTranslations[p] ?? p;

    // Fetch Logic
    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

    const fetchReadings = async (day: number) => {
        // Only stop if this screen itself started audio. Support background global handoff.
        if (isPlaying) {
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
                    const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(citation)}&lang=${language}&v=layout_v3`);
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
        // Broaden punctuation to include colons, semicolons, and newlines to prevent Safari cutoffs
        const sentences = text.match(/[^.!?\n:;]+[.!?\n:;]+|[^.!?\n:;]+$/g) || [text];
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

        // Final safety net: slice chunks strictly exceeding 250 characters if they lacked any delimiters
        return chunks.flatMap(chunk => {
            if (chunk.length <= 250) return [chunk];
            return chunk.match(/.{1,250}(?:\s|$)|.{1,250}/g) || [chunk];
        });
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

    const buildSegmentsForChapters = (readingTitle: string, readingCitation: string, chapters: Chapter[]) => {
        const segments: any[] = [];

        // Reading Title
        let cleanTitle = readingTitle.replace(/\//g, ' ').replace(/(Chapter|Capítulo)\s*/gi, '').trim();
        cleanTitle = cleanTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');
        segments.push({ text: cleanTitle, gender: 'female' as const, postPause: 500 });

        chapters.forEach((chapter, index) => {
            // Chapter Title
            if (chapter.title !== readingTitle && chapter.title !== readingCitation) {
                let pgTitle = chapter.title.replace(/(Chapter|Capítulo)\s*/gi, '').trim();
                pgTitle = pgTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');

                if (language === 'en') {
                    pgTitle = pgTitle.replace(/:(\d+)-(\d+)/, ', verses $1 to $2');
                    pgTitle = pgTitle.replace(/:(\d+)/, ', verse $1');
                } else {
                    pgTitle = pgTitle.replace(/:(\d+)-(\d+)/, ', versículos $1 al $2');
                    pgTitle = pgTitle.replace(/:(\d+)/, ', versículo $1');
                }

                segments.push({
                    text: pgTitle,
                    gender: 'female' as const,
                    postPause: 400,
                    onStart: () => setActiveChapterId(chapter.title)
                });
            }

            // Body
            let spokenText = chapter.text.replace(/###\s*/g, '').replace(/\[\s*\d+\s*\]/g, '').replace(/\//g, ' ').replace(/(Chapter|Capítulo)\s+(?=\d)/gi, '');
            spokenText = spokenText.replace(/([a-zA-Z])\s+(\d+)/g, '$1, $2');
            const chunks = chunkText(spokenText);

            chunks.forEach((chunk, chunkIndex) => {
                const isLastChunk = chunkIndex === chunks.length - 1;
                segments.push({
                    text: chunk,
                    gender: 'female' as const,
                    onStart: () => {
                        setActiveChapterId(chapter.title);
                        if (isLastChunk) {
                            markChapterComplete(currentDay, chapter.title);
                        }
                    }
                });
            });

            if (chunks.length > 0 && index < chapters.length - 1) {
                segments.push({ text: ' ', gender: 'female' as const, postPause: 800 });
            }
        });
        return segments;
    };

    const checkWillCompleteDay = (chaptersBeingPlayed: Chapter[]) => {
        const allChaptersInDay = readings.flatMap(r => parseChapters(r));
        const uncompleted = allChaptersInDay.filter(c => !isChapterComplete(currentDay, c.title));

        if (uncompleted.length === 0) return false;

        const playingTitles = chaptersBeingPlayed.map(c => c.title);
        return uncompleted.every(c => playingTitles.includes(c.title));
    };

    const handlePlayAll = async () => {
        killBiblePlayback();

        if (isPlaying && currentlyPlayingId === 'all') {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
            return;
        }

        const segments: any[] = [];
        let allDayCompleted = true;

        readings.forEach(r => {
            if (!parseChapters(r).every(c => isChapterComplete(currentDay, c.title))) {
                allDayCompleted = false;
            }
        });

        // Add intro (play it for standard play and replays)
        const periodString = translatePeriod(dayData?.period || '');
        const introText = `${t.day} ${currentDay}. ${t.phase}: ${periodString}.`;

        segments.push({
            text: introText,
            gender: 'female' as const,
            postPause: 800
        });

        readings.forEach(r => {
            const chapters = parseChapters(r);
            const chaptersToPlay = allDayCompleted ? chapters : chapters.filter(c => !isChapterComplete(currentDay, c.title));
            if (chaptersToPlay.length > 0) {
                segments.push(...buildSegmentsForChapters(r.title, r.citation, chaptersToPlay));
                segments.push({ text: ' ', gender: 'female' as const, postPause: 1000 });
            }
        });

        if (segments.length === 0) return;

        // Play All always gets the blessing appended as a reward
        segments.push({ text: t.blessing, gender: 'female' as const, postPause: 1000 });

        setIsPlaying(true);
        setCurrentlyPlayingId('all');
        ttsManager.setOnEnd(() => {
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        });
        await ttsManager.speakSegments(segments);
    };

    const handlePlaySection = async (e: React.MouseEvent, id: string, reading: Reading) => {
        e.stopPropagation();
        killBiblePlayback();

        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
            return;
        }

        const chapters = parseChapters(reading);
        let allSectionCompleted = chapters.every(c => isChapterComplete(currentDay, c.title));
        const chaptersToPlay = allSectionCompleted ? chapters : chapters.filter(c => !isChapterComplete(currentDay, c.title));

        if (chaptersToPlay.length === 0) return;

        const segments = buildSegmentsForChapters(reading.title, reading.citation, chaptersToPlay);

        if (checkWillCompleteDay(chaptersToPlay)) {
            segments.push({ text: ' ', gender: 'female' as const, postPause: 800 });
            segments.push({ text: t.blessing, gender: 'female' as const, postPause: 1000 });
        }

        setIsPlaying(true);
        setCurrentlyPlayingId(id);
        ttsManager.setOnEnd(() => {
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        });
        await ttsManager.speakSegments(segments);
    };

    const handlePlayChapter = async (e: React.MouseEvent, id: string, reading: Reading, chapter: Chapter) => {
        e.stopPropagation();
        killBiblePlayback();

        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
            return;
        }

        // Always play just this chapter, explicit override
        const segments = buildSegmentsForChapters(reading.title, reading.citation, [chapter]);

        if (checkWillCompleteDay([chapter])) {
            segments.push({ text: ' ', gender: 'female' as const, postPause: 800 });
            segments.push({ text: t.blessing, gender: 'female' as const, postPause: 1000 });
        }

        setIsPlaying(true);
        setCurrentlyPlayingId(id);
        ttsManager.setOnEnd(() => {
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
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
        <div className="bible-screen-wrapper">
            <div className="bible-container">
                {/* Header */}
                <header className="sacred-header">
                    <div className="header-top-row">
                        <button
                            className="icon-btn-ghost"
                            onClick={onBack}
                            aria-label="Back"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>family_home</span>
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

                    <div className="controls-row" style={{ justifyContent: 'center', position: 'relative' }}>
                        <div className="phase-tag">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>church</span>
                            <span>{translatePeriod(dayData.period)}</span>
                        </div>

                        <span className="day-counter-small" style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'absolute', right: 0 }}>
                            {Math.round((completedDays.length / 365) * 100)}% <Flag size={14} />
                        </span>
                    </div>

                    <div className="progress-container" style={{ marginBottom: '1.5rem' }}>
                        <div className="progress-fill" style={{ width: `${(completedDays.length / 365) * 100}%` }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0' }}>
                        <button
                            className="play-all-btn-large"
                            onClick={handlePlayAll}
                            aria-label={isPlaying && currentlyPlayingId === 'all' ? "Stop All" : (isCompleted ? "Replay All" : "Play All")}
                            style={{ width: '3.5rem', height: '3.5rem' }}
                        >
                            {isPlaying && currentlyPlayingId === 'all' ? (
                                <Square size={20} fill="currentColor" />
                            ) : isCompleted ? (
                                <RotateCcw size={24} fill="none" strokeWidth={2.5} style={{ marginLeft: '1px' }} />
                            ) : (
                                <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                            )}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="sacred-content">
                    {error ? (
                        <div className="loading-container">
                            <p style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>{error}</p>
                            <button
                                className="btn-secondary"
                                onClick={() => fetchReadings(currentDay)}
                                style={{ marginTop: '1rem' }}
                            >
                                {language === 'es' ? 'Reintentar' : 'Retry'}
                            </button>
                        </div>
                    ) : loading ? (
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
                                            onClick={(e) => handlePlaySection(e, `reading-${idx}`, reading)}
                                            aria-label={currentlyPlayingId === `reading-${idx}` ? "Stop" : "Play Section"}
                                        >
                                            {currentlyPlayingId === `reading-${idx}` ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                                        </button>
                                    </div>

                                    {/* Render Each Parsed Chapter as a separate Card */}
                                    {chapters.map((chapter, chIdx) => {
                                        const rowKey = `${idx}-${chIdx}`;
                                        const isActivePlayingCard = (isPlaying || isBibleGlobalActive) && activeChapterId === chapter.title;
                                        return (
                                            <div
                                                key={chIdx}
                                                className={`reading-card-sacred ${isActivePlayingCard ? 'active-playing-card' : ''}`}
                                                onClick={() => toggleSection(rowKey)}
                                            >
                                                <div className="card-summary-row">
                                                    <div className="card-left">
                                                        {/* Chapter Play Button */}
                                                        <button
                                                            onClick={(e) => handlePlayChapter(e, `chapter-${chapter.title}`, reading, chapter)}
                                                            className="icon-btn-ghost"
                                                            style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }}
                                                        >
                                                            {isPlaying && currentlyPlayingId === `chapter-${chapter.title}` ? (
                                                                <Square size={18} fill="currentColor" />
                                                            ) : (
                                                                <Play size={18} fill="currentColor" />
                                                            )}
                                                        </button>

                                                        <span className="chapter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {chapter.title}
                                                            {isChapterComplete(currentDay, chapter.title) && (
                                                                <CheckCircle size={14} color="#22c55e" />
                                                            )}
                                                        </span>
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
                    <div className="footer-scrollable">
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
                </main>

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
        </div>
    );
}
