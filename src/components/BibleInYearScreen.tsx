import { useState, useEffect, useMemo } from 'react';
import {
    Settings,
    Calendar,
    Play,
    ChevronDown,
    CheckCircle,
    Square,
    Info,
    Flag,
    RotateCcw,
    Trophy,
    Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { useBibleProgress, archiveAndRestartBible } from '../hooks/useBibleProgress';
import { killBiblePlayback, getBiblePlaying } from '../hooks/useBiblePlayback';
import biblePlan from '../data/bibleInYearPlan.json';
import { parseBibleChapters, chunkBibleText, type Reading, type Chapter } from '../utils/bibleParser';
import { BibleProgressModal } from './BibleProgressModal';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import { useAI } from '../context/AIContext';
import { AIModal } from './AIModal';
import { AITopicSelectionModal, type TopicOption } from './AITopicSelectionModal';
import { formatCitation } from '../utils/textSanitizer';
import './BibleInYearScreen.css';

interface BibleDay {
    day: number;
    period: string;
    first_reading: string;
    second_reading: string | null;
    psalm_proverbs: string;
}

// Interface Reading imported from bibleParser

interface Props {
    onBack: () => void;
}

export default function BibleInYearScreen({ onBack }: Props) {
    const { language } = useApp();

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

    const [currentDay, setCurrentDay] = useState(() => {
        if (!bibleStartDate) return 1;
        if (missedDays.length > 0) return missedDays[0];

        // If there are no missed days from previous dates,
        // we should look at the current expected day.
        // Even if they have already completed it today, showing the most recent completed
        // active day is the best user experience.
        return expectedDay > 0 ? expectedDay : 1;
    });

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
    const [showRenewModal, setShowRenewModal] = useState(false);

    // AI Companion State
    const { aiEnabled } = useAI();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isAITopicModalOpen, setIsAITopicModalOpen] = useState(false);
    const [aiTopicName, setAiTopicName] = useState('');
    const [aiStartTab, setAiStartTab] = useState<'chat' | 'saved'>('chat');

    const handleOpenTopAI = () => {
        setIsAITopicModalOpen(true);
    };

    const handleSelectAITopic = (option: TopicOption) => {
        setIsAITopicModalOpen(false);
        setAiTopicName(option.topicName);
        setAiStartTab('chat');
        setIsAIModalOpen(true);
    };

    const handleOpenGlobalChat = () => {
        setIsAITopicModalOpen(false);
        setAiTopicName('General');
        setAiStartTab('chat');
        setIsAIModalOpen(true);
    };

    const handleOpenGlobalSaved = () => {
        setIsAITopicModalOpen(false);
        setAiTopicName('General');
        setAiStartTab('saved');
        setIsAIModalOpen(true);
    };

    const getAITopics = (): TopicOption[] => {
        const options: TopicOption[] = [];

        readings.forEach((reading, rIdx) => {
            const chapters = parseBibleChapters(reading);

            if (rIdx > 0) {
                options.push({
                    id: `div-reading-${rIdx}`,
                    type: 'divider',
                    title: '',
                    topicName: '',
                    source: '',
                    contextStr: ''
                });
            }

            if (chapters.length > 1) {
                const citationFormatted = formatCitation(reading.citation, language);
                const fullReadingPrompt = language === 'es' ? 'Reflexiona sobre la lectura completa...' : 'Discuss the full reading...';
                options.push({
                    id: `sec-${rIdx}`,
                    type: 'section',
                    title: fullReadingPrompt,
                    subtitle: '',
                    contextStr: '', // Not utilized in Bible yet
                    topicName: reading.citation ? `${reading.title} (${citationFormatted})` : reading.title,
                    source: 'Bible in a Year',
                    previewText: '',
                    iconType: 'chat',
                    eyebrow: reading.title,
                    eyebrowHighlight: reading.citation ? citationFormatted : undefined
                });
            }

            chapters.forEach((chapter, cIdx) => {
                const cleanChapterText = chapter.text.replace(/###.*?\n/g, '').replace(/\[\d+\]\s*/g, '').trim();
                options.push({
                    id: `chap-${rIdx}-${cIdx}`,
                    type: 'chapter',
                    title: chapter.title ? formatCitation(chapter.title, language) : '',
                    subtitle: '',
                    contextStr: '',
                    topicName: `${reading.title} (${chapter.title})`,
                    source: 'Bible in a Year',
                    previewText: cleanChapterText ? (cleanChapterText.length > 90 ? cleanChapterText.substring(0, 90).replace(/\s+[^\s]*$/, '...') : cleanChapterText) : '',
                    iconType: 'reading',
                    eyebrow: reading.title
                });
            });
        });

        options.push({
            id: 'div-general',
            type: 'divider',
            title: '',
            topicName: '',
            source: '',
            contextStr: ''
        });

        options.push({
            id: 'general',
            type: 'general',
            title: language === 'es' ? '¿Sobre qué más preferirías discutir o reflexionar?' : 'What else would you prefer to discuss or reflect on?',
            topicName: language === 'es' ? `Reflexión General` : `General Reflection`,
            contextStr: '',
            source: 'Bible in a Year',
            iconType: 'chat',
            eyebrow: language === 'es' ? 'General' : 'General'
        });

        return options;
    };

    // Auto-mark day complete if all chapters are done
    useEffect(() => {
        if (!readings || readings.length === 0) return;
        if (isDayComplete(currentDay)) return;

        let allCompleted = true;
        readings.forEach(r => {
            // Must use parseBibleChapters locally to know chapters
            const chaps = parseBibleChapters(r);

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
        // Run only once on mount or when bibleStartDate is actually assigned for the very first time.
        // We handle initial state properly in useState, but just in case it takes a tick for localStorage:
        if (missedDays.length > 0) {
            setCurrentDay(missedDays[0]);
        } else if (expectedDay > 1) {
            if (!isDayComplete(expectedDay)) {
                setCurrentDay(expectedDay);
            }
        }
    }, [bibleStartDate]); // ONLY track bibleStartDate to avoid random scrolling mid-session when days are ticked off

    const dayData: BibleDay = (biblePlan as BibleDay[])[currentDay - 1];

    const translationsObj = useMemo(() => ({
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
    }), []);

    const t = translationsObj[language as keyof typeof translationsObj];

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
    // ChunkText and ParseChapters removed and imported instead

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
            const chunks = chunkBibleText(spokenText);

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
        const allChaptersInDay = readings.flatMap(r => parseBibleChapters(r));
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
            if (!parseBibleChapters(r).every(c => isChapterComplete(currentDay, c.title))) {
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
            const chapters = parseBibleChapters(r);
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

        const chapters = parseBibleChapters(reading);
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
    const isYearComplete = completedDays.length >= 365;

    const handleRestartYear = () => {
        setShowRenewModal(true);
    };

    const confirmRestartYear = () => {
        archiveAndRestartBible();
        setCurrentDay(1);
        setShowRenewModal(false);
    };

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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {aiEnabled && (
                                <button
                                    className="icon-btn-ghost"
                                    onClick={handleOpenTopAI}
                                    style={{ color: '#d4af37' }}
                                    aria-label="Ask AI Companion"
                                >
                                    <Sparkles size={24} />
                                </button>
                            )}
                            <button
                                className="icon-btn-ghost"
                                onClick={() => setShowSettings(true)}
                                aria-label="Settings"
                            >
                                <Settings size={24} />
                            </button>
                        </div>
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
                    {/* 365-Day Celebration Card */}
                    {isYearComplete && (
                        <div className="celebration-card" style={{
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.1)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1rem'
                            }}>
                                <Trophy size={28} color="#D4AF37" />
                            </div>
                            <h2 style={{
                                color: '#D4AF37',
                                margin: '0 0 0.5rem 0',
                                fontSize: '1.25rem',
                                fontFamily: "'Playfair Display', serif"
                            }}>
                                {language === 'es' ? '365 Días de Gracia' : '365 Days of Grace'}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: '1.4' }}>
                                {language === 'es'
                                    ? 'Has terminado la Biblia en un Año. Que el Espíritu te siga guiando.'
                                    : 'You have finished the Bible in a Year. May the Spirit continue to guide you.'}
                            </p>
                            <button
                                onClick={handleRestartYear}
                                style={{
                                    backgroundColor: '#D4AF37',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '24px',
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <RotateCcw size={18} />
                                {language === 'es' ? 'RENOVAR CAMINO' : 'RENEW JOURNEY'}
                            </button>
                        </div>
                    )}

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
                            const chapters = parseBibleChapters(reading);

                            return (
                                <section key={idx} className="reading-section-sacred">
                                    <div className="section-header-sacred">
                                        <h2 className="section-title-sacred">{reading.title}</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button
                                                className={`section-play-btn-small ${currentlyPlayingId === `reading-${idx}` ? 'active' : ''}`}
                                                onClick={(e) => handlePlaySection(e, `reading-${idx}`, reading)}
                                                aria-label={currentlyPlayingId === `reading-${idx}` ? "Stop" : "Play Section"}
                                            >
                                                {currentlyPlayingId === `reading-${idx}` ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                                            </button>
                                        </div>
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

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                                            {aiEnabled && (
                                                                <button
                                                                    className="ai-guide-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setAiTopicName(`${reading.title} (${chapter.title})`);
                                                                        setAiStartTab('chat');
                                                                        setIsAIModalOpen(true);
                                                                    }}
                                                                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '20px', background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', width: '100%' }}
                                                                >
                                                                    <Sparkles size={16} />
                                                                    {language === 'es' ? 'Preguntar a la IA sobre este capítulo' : 'Ask AI about this chapter'}
                                                                </button>
                                                            )}

                                                            {!isChapterComplete(currentDay, chapter.title) && (
                                                                <button
                                                                    className="mark-read-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markChapterComplete(currentDay, chapter.title);
                                                                        setExpandedSections(prev => ({ ...prev, [rowKey]: false }));
                                                                    }}
                                                                    aria-label="Mark chapter as read"
                                                                >
                                                                    <CheckCircle size={15} />
                                                                    {language === 'es' ? 'Marcar como le�do' : 'Mark as Read'}
                                                                </button>
                                                            )}
                                                        </div>
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
                <AITopicSelectionModal
                    isOpen={isAITopicModalOpen}
                    onClose={() => setIsAITopicModalOpen(false)}
                    options={isAITopicModalOpen ? getAITopics() : []}
                    onSelect={handleSelectAITopic}
                    onOpenChat={handleOpenGlobalChat}
                    onOpenSaved={handleOpenGlobalSaved}
                    language={language}
                />
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                />
                <AIModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    contextStr=""
                    topicName={aiTopicName}
                    source="Bible in a Year"
                    language={language}
                    startTab={aiStartTab}
                />
                {showProgressModal && (
                    <BibleProgressModal
                        onClose={() => setShowProgressModal(false)}
                        onDaySelect={setCurrentDay}
                    />
                )}
                {showRenewModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1.5rem',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            backgroundColor: '#191b1f',
                            borderRadius: '24px',
                            padding: '2.5rem 2rem',
                            border: '1px solid rgba(212, 175, 55, 0.15)',
                            textAlign: 'center',
                            maxWidth: '360px',
                            width: '100%',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}>
                            <h3 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '1.6rem',
                                color: '#ffffff',
                                margin: '0 0 1rem 0'
                            }}>
                                {language === 'es' ? '¿Renovar tu Camino?' : 'Renew Your Journey?'}
                            </h3>
                            <div style={{
                                width: '32px', height: '2px', backgroundColor: '#D4AF37', margin: '0 auto 1.5rem auto', opacity: 0.5
                            }} />
                            <p style={{ color: 'var(--text-secondary, #9ca3af)', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                {language === 'es'
                                    ? '¿Estás seguro? Esto archivará tus logros actuales y establecerá hoy como tu fecha de inicio. Puedes cambiar esto a cualquier fecha en configuración.'
                                    : 'Are you sure? This will archive your current achievements and set your start date to today. You can change this to any date in settings.'}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    onClick={confirmRestartYear}
                                    style={{
                                        backgroundColor: '#D4AF37', color: '#000', border: 'none', borderRadius: '12px',
                                        padding: '1rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                                        transition: 'opacity 0.2s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    {language === 'es' ? 'Sí, Renovar Camino' : 'Yes, Renew Journey'}
                                </button>
                                <button
                                    onClick={() => setShowRenewModal(false)}
                                    style={{
                                        backgroundColor: 'transparent', color: '#9ca3af', border: 'none',
                                        padding: '1rem', fontWeight: '500', fontSize: '0.95rem', cursor: 'pointer',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
                                    onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                                >
                                    {language === 'es' ? 'Mantener mi Progreso' : 'Keep My Progress'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}







