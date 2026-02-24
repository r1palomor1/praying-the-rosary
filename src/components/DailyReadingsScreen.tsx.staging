import { useState, useEffect, useRef } from 'react';
import {
    Settings as SettingsIcon,
    ChevronDown,
    Play,
    Square,
    ChevronLeft,
    Info,
    Calendar,
    CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
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
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [liturgicalColor, setLiturgicalColor] = useState('#a87d3e');
    const [liturgicalData, setLiturgicalData] = useState<any>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [showSourceInfo, setShowSourceInfo] = useState(false);
    const [completedItems, setCompletedItems] = useState<string[]>([]);

    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

    const blessingText = language === 'es'
        ? 'La lectura se ha completado. Que Dios te bendiga por tu fiel devoción.'
        : 'The reading is now complete. May God bless you for your faithful devotion.';

    const formatDateParam = (date: Date) => {
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const yy = date.getFullYear().toString().slice(-2);
        return `${mm}${dd}${yy}`;
    };

    const fetchReadings = async (date: Date) => {
        if (isPlaying || ttsManager.isSpeaking()) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        }
        setCompletedItems([]);

        setLoading(true);
        setError(null);

        try {
            const liturgy = await fetchLiturgicalDay(date, language);
            const color = getLiturgicalColorHex(liturgy.celebrations[0].colour);
            setLiturgicalColor(color);
            setLiturgicalData(liturgy);

            const dateStr = formatDateParam(date);
            const usccbResponse = await fetch(`${API_BASE}/api/readings?date=${dateStr}&lang=${language}`);

            if (usccbResponse.ok) {
                const usccbData = await usccbResponse.json();
                setData(usccbData);
            } else {
                setData(null);
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const vaticanDate = `${year}-${month}-${day}`;

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
        const timer = setTimeout(() => {
            fetchReadings(currentDate);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentDate, language]);

    useEffect(() => {
        return () => {
            if (ttsManager.isSpeaking()) {
                ttsManager.stop();
            }
        };
    }, []);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

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

    const renderReadingText = (text: string) => {
        let cleanText = text.replace(/\u003cbr\s*\/?\u003e/gi, '\n');

        return cleanText.split('\n').map((line, lineIndex) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            const startsWithR = /^(R\.|R\/\.)\s/.test(trimmed);
            const endsWithR = /\s+(R\.|R\/\.)$/.test(trimmed);

            if (startsWithR || endsWithR) {
                return (
                    <p
                        key={lineIndex}
                        style={{
                            fontWeight: '700',
                            color: liturgicalColor,
                            margin: '0.5rem 0'
                        }}
                    >
                        {trimmed.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')}
                    </p>
                );
            }

            if (trimmed.includes('<strong>')) {
                const parts: React.ReactNode[] = [];
                let lastIndex = 0;
                const strongRegex = /<strong>(.*?)<\/strong>/g;
                let match;

                while ((match = strongRegex.exec(trimmed)) !== null) {
                    if (match.index > lastIndex) {
                        const beforeText = trimmed.substring(lastIndex, match.index);
                        parts.push(beforeText.replace(/<[^>]+>/g, ''));
                    }
                    parts.push(
                        <span key={match.index} className="response-highlight" style={{ color: liturgicalColor, fontStyle: 'italic' }}>
                            {match[1]}
                        </span>
                    );
                    lastIndex = match.index + match[0].length;
                }
                if (lastIndex < trimmed.length) {
                    const afterText = trimmed.substring(lastIndex);
                    parts.push(afterText.replace(/<[^>]+>/g, ''));
                }
                return <p key={lineIndex} style={{ margin: '0.3rem 0' }}>{parts}</p>;
            }

            return <p key={lineIndex} style={{ margin: '0.3rem 0' }}>{trimmed.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')}</p>;
        });
    };

    const checkWillCompleteDaily = (playingId: string) => {
        const allIds = data?.readings.map((_, i) => `usccb-${i}`) || [];
        if (reflection) allIds.push('reflection');
        const uncompleted = allIds.filter(id => !completedItems.includes(id));
        return uncompleted.length > 0 && uncompleted.every(id => id === playingId);
    };

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

    const getSpokenText = (rawText: string) => {
        let clean = rawText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        // Strip out verse numbers in brackets (e.g., [ 1 ])
        clean = clean.replace(/\[\s*\d+\s*\]/g, '');
        // Replace "R." or "R/." with Response
        const responseWord = language === 'es' ? 'Respuesta.' : 'Response.';
        clean = clean.replace(/R\.|R\/\./g, responseWord);
        return clean;
    };

    const handlePlayContent = async (e: React.MouseEvent, id: string, title: string, text: string) => {
        e.stopPropagation();
        if (isPlaying && currentlyPlayingId === id) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        } else {
            const spokenText = getSpokenText(text);
            const segments: any[] = [
                { text: title, gender: 'female' as const, postPause: 800, onStart: () => setActiveChapterId(id) }
            ];

            const chunks = chunkText(spokenText);
            chunks.forEach((chunk, cIndex) => {
                const isLast = cIndex === chunks.length - 1;
                segments.push({
                    text: chunk,
                    gender: 'female' as const,
                    postPause: isLast ? 0 : 300,
                    onStart: () => setActiveChapterId(id),
                    onEnd: () => {
                        if (isLast) {
                            setCompletedItems(prev => prev.includes(id) ? prev : [...prev, id]);
                        }
                    }
                });
            });

            if (checkWillCompleteDaily(id)) {
                segments.push({ text: blessingText, gender: 'female' as const, postPause: 1000 });
            }

            setIsPlaying(true);
            setCurrentlyPlayingId(id);
            await ttsManager.setLanguage(language);

            ttsManager.setOnEnd(() => {
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
                setActiveChapterId(null);
            });

            try {
                await ttsManager.speakSegments(segments);
            } catch (error) {
                console.error("Audio error", error);
                setIsPlaying(false);
                setCurrentlyPlayingId(null);
                setActiveChapterId(null);
            }
        }
    };

    const handlePlayAll = async () => {
        if (isPlaying && currentlyPlayingId === 'all') {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
            return;
        }

        const readingsToPlay = data?.readings;
        if (!readingsToPlay || readingsToPlay.length === 0) return;

        const segments: any[] = [];

        let titleFallback = '';
        if (data?.title) {
            titleFallback = data.title;
        } else if (vaticanData?.readings?.[0]?.title) {
            titleFallback = vaticanData.readings[0].title;
        }

        if (titleFallback) {
            segments.push({ text: titleFallback, gender: 'female' as const, postPause: 1000 });
        }

        readingsToPlay.forEach((reading, index) => {
            const id = `usccb-${index}`;
            const spokenText = getSpokenText(reading.text);

            segments.push({
                text: normalizeReadingTitle(reading.title),
                gender: 'female' as const,
                postPause: 800,
                onStart: () => setActiveChapterId(id)
            });

            const chunks = chunkText(spokenText);
            chunks.forEach((chunk, cIndex) => {
                const isLast = cIndex === chunks.length - 1;
                segments.push({
                    text: chunk,
                    gender: 'female' as const,
                    postPause: isLast ? 1500 : 300,
                    onStart: () => setActiveChapterId(id),
                    onEnd: () => {
                        if (isLast) {
                            setCompletedItems(prev => prev.includes(id) ? prev : [...prev, id]);
                        }
                    }
                });
            });
        });

        if (reflection) {
            const id = 'reflection';
            const spokenText = getSpokenText(reflection.content);
            segments.push({
                text: reflection.title,
                gender: 'female' as const,
                postPause: 800,
                onStart: () => setActiveChapterId(id)
            });
            
            const chunks = chunkText(spokenText);
            chunks.forEach((chunk, cIndex) => {
                const isLast = cIndex === chunks.length - 1;
                segments.push({
                    text: chunk,
                    gender: 'female' as const,
                    postPause: isLast ? 0 : 300,
                    onStart: () => setActiveChapterId(id),
                    onEnd: () => {
                        if (isLast) {
                            setCompletedItems(prev => prev.includes(id) ? prev : [...prev, id]);
                        }
                    }
                });
            });
        }

        if (segments.length === 0) return;

        segments.push({ text: blessingText, gender: 'female' as const, postPause: 1000 });

        setIsPlaying(true);
        setCurrentlyPlayingId('all');
        await ttsManager.setLanguage(language);

        ttsManager.setOnEnd(() => {
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        });

        try {
            await ttsManager.speakSegments(segments);
        } catch (error) {
            console.error("Audio error", error);
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        }
    };

    const inputRef = useRef<HTMLInputElement>(null);
    const triggerDatePicker = () => {
        if (inputRef.current) {
            // @ts-ignore
            if (typeof inputRef.current.showPicker === 'function') {
                // @ts-ignore
                inputRef.current.showPicker();
            } else {
                inputRef.current.click();
            }
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            setCurrentDate(new Date(y, m - 1, d));
        }
    };

    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const htmlDateStr = `${yyyy}-${mm}-${dd}`;

    const readingsToRender = data?.readings;

    return (
        <div className="readings-screen-wrapper">
            <div className="readings-container">
                <header className="sacred-header">
                    <div className="header-top-row">
                        <button className="icon-btn-ghost" onClick={onBack} aria-label="Back">
                            <ChevronLeft size={28} />
                        </button>
                        <h1 className="header-title">
                            {language === 'es' ? 'Lecturas Diarias' : 'Daily Readings'}
                        </h1>
                        <button
                            className="icon-btn-ghost"
                            onClick={() => setShowSettings(true)}
                            aria-label="Settings"
                        >
                            <SettingsIcon size={24} />
                        </button>
                    </div>

                    <div className="date-row">
                        <span className="date-text">
                            {currentDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                month: 'long', day: 'numeric'
                            }).toUpperCase()}
                        </span>
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <button
                                className="icon-btn-ghost"
                                style={{ width: '24px', height: '24px', color: 'var(--color-primary)' }}
                                onClick={triggerDatePicker}
                                aria-label="Select Date"
                            >
                                <Calendar size={18} />
                            </button>
                            <input
                                ref={inputRef}
                                type="date"
                                value={htmlDateStr}
                                onChange={handleDateChange}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    pointerEvents: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="controls-row" style={{ justifyContent: 'center', flexWrap: 'nowrap', gap: '1rem', width: '100%' }}>
                        <div style={{ flexShrink: 0, width: '32px' }}></div>

                        <div className="liturgical-title-center" style={{
                            color: liturgicalColor,
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textAlign: 'center',
                            flex: 1,
                            padding: '0 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            textTransform: 'uppercase'
                        }}>
                            {(() => {
                                const titleSource = data?.title || vaticanData?.readings?.[0]?.title || '';
                                const hasRankPrefix = /^(Solemnity|Feast|Memorial|Optional Memorial|Solemnidad|Fiesta|Memoria) (of|de)/i.test(titleSource);

                                if (!hasRankPrefix && liturgicalData?.celebrations?.[0]?.rank) {
                                    const rank = liturgicalData.celebrations[0].rank;
                                    const rankLabel = rank === 'SOLEMNITY' ? (language === 'es' ? 'Solemnidad de' : 'Solemnity of') :
                                        rank === 'FEAST' ? (language === 'es' ? 'Fiesta de' : 'Feast of') :
                                            rank === 'MEMORIAL' ? (language === 'es' ? 'Memoria de' : 'Memorial of') : '';
                                    if (rankLabel) return `${rankLabel} ${titleSource}`;
                                }
                                return titleSource;
                            })()}
                        </div>

                        <div style={{ flexShrink: 0, width: '32px' }}></div>
                    </div>

                    <div className="decorative-divider" style={{ opacity: 0.6, marginTop: '1rem', marginBottom: '1.5rem' }}>
                        <div className="divider-line divider-line-left" style={{ backgroundColor: liturgicalColor }}></div>
                        <span className="material-symbols-outlined divider-icon" style={{ color: liturgicalColor }}>church</span>
                        <div className="divider-line divider-line-right" style={{ backgroundColor: liturgicalColor }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0' }}>
                        <button
                            className="play-all-btn-large"
                            onClick={handlePlayAll}
                            aria-label={isPlaying && currentlyPlayingId === 'all' ? "Stop All" : "Play All"}
                            disabled={loading || error !== null || (!readingsToRender?.length)}
                            style={{ opacity: (loading || error || (!readingsToRender?.length)) ? 0.3 : 1, width: '3.5rem', height: '3.5rem' }}
                        >
                            {isPlaying && currentlyPlayingId === 'all' ? (
                                <Square size={20} fill="currentColor" />
                            ) : (
                                <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                            )}
                        </button>
                    </div>
                </header>

                <main className="sacred-content">
                    {loading && (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <div className="loading-text">Loading...</div>
                        </div>
                    )}

                    {error && <div className="error-msg">{error}</div>}

                    {!loading && !error && readingsToRender?.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '2rem' }}>
                            <p>No readings found for this date.</p>
                        </div>
                    )}

                    {!loading && !error && readingsToRender && readingsToRender.map((reading, index) => {
                        const readingId = `usccb-${index}`;
                        const isActive = activeChapterId === readingId;
                        const isExpanded = expandedSections[readingId];
                        const isCompleted = completedItems.includes(readingId);

                        return (
                            <section key={index} className="reading-section-sacred fade-in">
                                <div className="section-header-sacred">
                                    <h2 className="section-title-sacred">{normalizeReadingTitle(reading.title)}</h2>
                                    <button
                                        className={`section-play-btn-small ${currentlyPlayingId === readingId ? 'active' : ''}`}
                                        onClick={(e) => handlePlayContent(e, readingId, normalizeReadingTitle(reading.title), reading.text)}
                                        aria-label={currentlyPlayingId === readingId ? "Stop" : "Play"}
                                    >
                                        {currentlyPlayingId === readingId ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                                    </button>
                                </div>

                                <div
                                    className={`reading-card-sacred ${isActive ? 'active-playing-card' : ''}`}
                                    onClick={() => toggleSection(readingId)}
                                >
                                    <div className="card-summary-row">
                                        <div className="card-left">
                                            <button
                                                onClick={(e) => handlePlayContent(e, readingId, normalizeReadingTitle(reading.title), reading.text)}
                                                className="icon-btn-ghost"
                                                style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }}
                                            >
                                                {currentlyPlayingId === readingId ? (
                                                    <Square size={18} fill="currentColor" />
                                                ) : (
                                                    <Play size={18} fill="currentColor" />
                                                )}
                                            </button>

                                            <span className="chapter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {(reading.citation ? reading.citation.replace(/,/g, ',  ') : null) || (language === 'es' ? 'Lectura' : 'Reading')}
                                                {isCompleted && (
                                                    <CheckCircle size={14} color="#22c55e" />
                                                )}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            size={20}
                                            className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}
                                        />
                                    </div>

                                    {isExpanded && (
                                        <div
                                            className="card-content-expanded"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {renderReadingText(reading.text)}
                                        </div>
                                    )}
                                </div>
                            </section>
                        );
                    })}

                    {/* Reflection Appended to the end */}
                    {!loading && !error && reflection && (
                        <section className="reading-section-sacred fade-in">
                            <div className="section-header-sacred">
                                <h2 className="section-title-sacred">{reflection.title}</h2>
                                <button
                                    className={`section-play-btn-small ${currentlyPlayingId === 'reflection' ? 'active' : ''}`}
                                    onClick={(e) => handlePlayContent(e, 'reflection', reflection.title, reflection.content)}
                                    aria-label={currentlyPlayingId === 'reflection' ? "Stop" : "Play"}
                                >
                                    {currentlyPlayingId === 'reflection' ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                                </button>
                            </div>

                            <div
                                className={`reading-card-sacred ${activeChapterId === 'reflection' ? 'active-playing-card' : ''}`}
                                onClick={() => toggleSection('reflection')}
                            >
                                <div className="card-summary-row">
                                    <div className="card-left">
                                        <button
                                            onClick={(e) => handlePlayContent(e, 'reflection', reflection.title, reflection.content)}
                                            className="icon-btn-ghost"
                                            style={{ width: '32px', height: '32px', color: 'var(--color-primary)' }}
                                        >
                                            {currentlyPlayingId === 'reflection' ? (
                                                <Square size={18} fill="currentColor" />
                                            ) : (
                                                <Play size={18} fill="currentColor" />
                                            )}
                                        </button>

                                        <span className="chapter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {reflection.title}
                                            {completedItems.includes('reflection') && (
                                                <CheckCircle size={14} color="#22c55e" />
                                            )}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        size={20}
                                        className={`expand-chevron ${expandedSections['reflection'] || activeChapterId === 'reflection' ? 'expanded' : ''}`}
                                    />
                                </div>

                                {expandedSections['reflection'] && (
                                    <div
                                        className="card-content-expanded"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {reflection.content.split('\n\n').map((para, i) => (
                                            <p key={i} style={{ margin: '0.3rem 0' }}>{para.replace(/<[^>]+>/g, '')}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Footer Source and Settings */}
                    {!loading && !error && readingsToRender && readingsToRender.length > 0 && (
                        <>
                            <div className="flourish-container">
                                <div className="flourish-line" style={{ backgroundColor: liturgicalColor }}></div>
                                <div className="flourish-text" style={{ color: liturgicalColor }}>
                                    {language === 'es' ? 'Amén' : 'Amen'}
                                </div>
                                <div className="flourish-line" style={{ backgroundColor: liturgicalColor }}></div>
                            </div>

                            <div className="footer-scrollable">
                                <div className="source-container-sacred">
                                    <div className="source-row">
                                        <a
                                            href="https://bible.usccb.org/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="source-link-sacred"
                                        >
                                            <span>Source: USCCB & VATICAN</span>
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
                                            Daily Readings are fetched securely from USCCB and Vatican APIs.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>

                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onResetProgress={() => { }}
                />
            </div>
        </div>
    );
}
