import { useState, useEffect, useRef } from 'react';
import {
    Settings as SettingsIcon,
    ChevronDown,
    Play,
    Square,
    Info,
    Calendar,
    CheckCircle,
    RotateCcw,
    Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ttsManager } from '../utils/ttsManager';
import { killDailyReadingsPlayback, getDailyReadingsActiveId } from '../hooks/useDailyReadingsPlayback';
import { SettingsModalV2 as SettingsModal } from './settings/SettingsModalV2';
import { fetchLiturgicalDay, getLiturgicalColorHex } from '../utils/liturgicalCalendar';
import { formatCitation } from '../utils/textSanitizer';
import { useAI } from '../context/AIContext';
import { AIModal } from './AIModal';
import { AITopicSelectionModal, type TopicOption } from './AITopicSelectionModal';
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
    const [activeChapterId, setActiveChapterId] = useState<string | null>(getDailyReadingsActiveId());
    const [showSettings, setShowSettings] = useState(false);
    const [liturgicalColor, setLiturgicalColor] = useState('#a87d3e');
    const [liturgicalData, setLiturgicalData] = useState<any>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [showSourceInfo, setShowSourceInfo] = useState(false);

    // AI Companion State
    const { aiEnabled } = useAI();
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isAITopicModalOpen, setIsAITopicModalOpen] = useState(false);
    const [aiContextText, setAiContextText] = useState('');
    const [aiTopicName, setAiTopicName] = useState('');
    const [aiSource, setAiSource] = useState('Daily Readings');
    const [aiStartTab, setAiStartTab] = useState<'chat' | 'saved'>('chat');

    const handleSelectAITopic = (option: TopicOption) => {
        setIsAITopicModalOpen(false);
        setAiTopicName(option.topicName);
        setAiContextText(option.contextStr);
        setAiSource(option.source);
        setAiStartTab('chat');
        setIsAIModalOpen(true);
    };

    const handleOpenGlobalChat = () => {
        setIsAITopicModalOpen(false);
        setAiTopicName('General');
        setAiContextText('');
        setAiStartTab('chat');
        setIsAIModalOpen(true);
    };

    const handleOpenGlobalSaved = () => {
        setIsAITopicModalOpen(false);
        setAiTopicName('General');
        setAiContextText('');
        setAiStartTab('saved');
        setIsAIModalOpen(true);
    };

    const getAITopics = (): TopicOption[] => {
        const options: TopicOption[] = [];

        if (readingsToRender) {
            readingsToRender.forEach((reading, rIdx) => {
                const citationFormatted = formatCitation(reading.citation, language);
                const titleWithCitation = reading.citation
                    ? `${normalizeReadingTitle(reading.title)} (${citationFormatted})`
                    : (language === 'es' ? 'Lectura' : 'Reading');

                options.push({
                    id: `reading-${rIdx}`,
                    type: 'chapter',
                    title: reading.citation ? citationFormatted : normalizeReadingTitle(reading.title),
                    subtitle: '',
                    contextStr: reading.text,
                    topicName: titleWithCitation,
                    source: 'Daily Readings',
                    previewText: reading.text ? (reading.text.length > 90 ? reading.text.substring(0, 90).replace(/\s+[^\s]*$/, '...') : reading.text) : '',
                    iconType: reading.title.toLowerCase().includes('gospel') || reading.title.toLowerCase().includes('evangelio') ? 'book' : 'reading',
                    eyebrow: normalizeReadingTitle(reading.title)
                });
            });
        }

        if (reflection) {
            options.push({
                id: 'reflection',
                type: 'chapter',
                title: reflection.title,
                subtitle: '',
                contextStr: reflection.content,
                topicName: reflection.title,
                source: 'Words of the Pope',
                previewText: reflection.content ? (reflection.content.length > 90 ? reflection.content.substring(0, 90).replace(/\s+[^\s]*$/, '...') : reflection.content) : '',
                iconType: 'chat',
                eyebrow: language === 'es' ? 'Palabras del Papa' : 'Words of the Pope'
            });
        }

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
            topicName: language === 'es' ? `Reflexión General - Lecturas Diarias` : `General Reflection - Daily Readings`,
            contextStr: '',
            source: 'Daily Readings',
            iconType: 'chat',
            eyebrow: language === 'es' ? 'General' : 'General'
        });

        return options;
    };

    const handleOpenAI = (e: React.MouseEvent, title: string, text: string, source = 'Daily Readings') => {
        e.stopPropagation();
        setAiTopicName(title);
        setAiContextText(text);
        setAiSource(source);
        setAiStartTab('chat');
        setIsAIModalOpen(true);
    };

    // Initialize from localStorage with current date
    const [completedItems, setCompletedItems] = useState<string[]>(() => {
        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const saved = localStorage.getItem(`dailyReadings_completed_${dateKey}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [];
            }
        }
        return [];
    });

    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

    // Helper for date-keyed localStorage
    const getDateKey = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Mark a single section as manually read
    const markSectionComplete = (id: string, collapse = true) => {
        const newCompleted = completedItems.includes(id) ? completedItems : [...completedItems, id];
        setCompletedItems(newCompleted);
        localStorage.setItem(`dailyReadings_completed_${getDateKey(currentDate)}`, JSON.stringify(newCompleted));
        if (collapse) {
            setExpandedSections(prev => ({ ...prev, [id]: false }));
        }
    };

    // Mark ALL sections complete at once
    const markAllComplete = () => {
        const allIds = [
            ...(readingsToRender ?? []).map((_, i) => `usccb-${i}`),
            ...(reflection ? ['reflection'] : [])
        ];
        setCompletedItems(allIds);
        localStorage.setItem(`dailyReadings_completed_${getDateKey(currentDate)}`, JSON.stringify(allIds));
        // Also persist to rosary history so home screen badge updates
        const today = getDateKey(currentDate);
        const histKey = 'dailyReadings_history';
        const existing = JSON.parse(localStorage.getItem(histKey) ?? '[]') as string[];
        if (!existing.includes(today)) {
            localStorage.setItem(histKey, JSON.stringify([...existing, today]));
        }
    };

    const blessingText = language === 'es'
        ? 'La lectura se ha completado. Que Dios te bendiga por tu fiel devoción.'
        : 'The reading is now complete. May God bless you for your faithful devotion.';

    // Load completedItems from localStorage when date changes
    useEffect(() => {
        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const saved = localStorage.getItem(`dailyReadings_completed_${dateKey}`);
        if (saved) {
            try {
                setCompletedItems(JSON.parse(saved));
            } catch {
                setCompletedItems([]);
            }
        } else {
            setCompletedItems([]);
        }

        // Cleanup old completion data (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('dailyReadings_completed_')) {
                const dateStr = key.replace('dailyReadings_completed_', '');
                try {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const itemDate = new Date(year, month - 1, day);
                    if (itemDate < sevenDaysAgo) {
                        localStorage.removeItem(key);
                    }
                } catch {
                    // Invalid date format, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }, [currentDate]);

    const formatDateParam = (date: Date) => {
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const yy = date.getFullYear().toString().slice(-2);
        return `${mm}${dd}${yy}`;
    };

    const fetchReadings = async (date: Date) => {
        // Only kill audio the screen itself started (isPlaying = screen's Play All / individual player).
        // Church icon audio is tracked by the hook, not this screen's isPlaying state,
        // so it is intentionally preserved when user navigates in or changes date.
        if (isPlaying) {
            ttsManager.stop();
            setIsPlaying(false);
            setCurrentlyPlayingId(null);
            setActiveChapterId(null);
        }

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

    // Audio lifecycle is owned by ttsManager singleton — no cleanup needed here.

    // Listen for church icon playback events (hook running in background after navigation)
    useEffect(() => {
        const handleReadingActive = (e: Event) => {
            const id = (e as CustomEvent).detail.id as string | null;
            setActiveChapterId(id);
        };
        const handleReadingComplete = (e: Event) => {
            const id = (e as CustomEvent).detail.id as string;
            setCompletedItems(prev => prev.includes(id) ? prev : [...prev, id]);
        };
        window.addEventListener('dailyReading:readingActive', handleReadingActive);
        window.addEventListener('dailyReading:readingComplete', handleReadingComplete);
        return () => {
            window.removeEventListener('dailyReading:readingActive', handleReadingActive);
            window.removeEventListener('dailyReading:readingComplete', handleReadingComplete);
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

        // Strip out citation numbers like (17b) or (2) immediately following R.
        cleanText = cleanText.replace(/(R\.|R\/\.)\s*\(\d+[a-zA-Z]?\)\s*/g, '$1 ');

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
                            margin: '1.25rem 0 0.5rem 0'
                        }}
                    >
                        {trimmed.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')}
                    </p>
                );
            }

            const verseStyle = { margin: '0.4rem 0' };

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
                return <p key={lineIndex} style={verseStyle}>{parts}</p>;
            }

            return <p key={lineIndex} style={verseStyle}>{trimmed.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')}</p>;
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
        // Strip out verse references in parenthesis after R. (e.g., (17b))
        clean = clean.replace(/(R\.|R\/\.)\s*\(\d+[a-zA-Z]?\)\s*/g, '$1 ');
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
                            setCompletedItems(prev => {
                                if (prev.includes(id)) return prev;
                                const updated = [...prev, id];
                                const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                localStorage.setItem(`dailyReadings_completed_${dateKey}`, JSON.stringify(updated));
                                return updated;
                            });
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
        // Kill any in-flight church icon audio before toggling Play All
        killDailyReadingsPlayback();

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

        const allReadingIds = readingsToPlay.map((_, i) => `usccb-${i}`);
        const allIds = reflection ? [...allReadingIds, 'reflection'] : allReadingIds;
        const isAllComplete = allIds.length > 0 && allIds.every(id => completedItems.includes(id));

        readingsToPlay.forEach((reading, index) => {
            const id = `usccb-${index}`;
            if (!isAllComplete && completedItems.includes(id)) return; // Skip if already completed unless replaying
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
                            setCompletedItems(prev => {
                                if (prev.includes(id)) return prev;
                                const updated = [...prev, id];
                                const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                localStorage.setItem(`dailyReadings_completed_${dateKey}`, JSON.stringify(updated));
                                return updated;
                            });
                        }
                    }
                });
            });
        });

        if (reflection && (isAllComplete || !completedItems.includes('reflection'))) {
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
                            setCompletedItems(prev => {
                                if (prev.includes(id)) return prev;
                                const updated = [...prev, id];
                                const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                localStorage.setItem(`dailyReadings_completed_${dateKey}`, JSON.stringify(updated));
                                return updated;
                            });
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
            const newDate = new Date(y, m - 1, d);
            setCurrentDate(newDate);
            fetchReadings(newDate); // Fetch immediately — avoids iOS two-tap / "Set" button requirement
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
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>family_home</span>
                        </button>
                        <h1 className="header-title">
                            {language === 'es' ? 'Lecturas Diarias' : 'Daily Readings'}
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {aiEnabled && (
                                <button
                                    className="icon-btn-ghost"
                                    onClick={() => setIsAITopicModalOpen(true)}
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
                                <SettingsIcon size={24} />
                            </button>
                        </div>
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
                        {(() => {
                            const allReadingIds = readingsToRender ? readingsToRender.map((_, i) => `usccb-${i}`) : [];
                            const allIds = reflection ? [...allReadingIds, 'reflection'] : allReadingIds;
                            const isAllComplete = allIds.length > 0 && allIds.every(id => completedItems.includes(id));

                            return (
                                <button
                                    className="play-all-btn-large"
                                    onClick={handlePlayAll}
                                    aria-label={isPlaying && currentlyPlayingId === 'all' ? "Stop All" : (isAllComplete ? "Replay All" : "Play All")}
                                    disabled={loading || error !== null || (!readingsToRender?.length)}
                                    style={{ opacity: (loading || error || (!readingsToRender?.length)) ? 0.3 : 1, width: '3.5rem', height: '3.5rem' }}
                                >
                                    {isPlaying && currentlyPlayingId === 'all' ? (
                                        <Square size={20} fill="currentColor" />
                                    ) : isAllComplete ? (
                                        <RotateCcw size={24} fill="none" strokeWidth={2.5} style={{ marginLeft: '1px' }} />
                                    ) : (
                                        <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                                    )}
                                </button>
                            );
                        })()}
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
                                                {reading.citation
                                                    ? formatCitation(reading.citation, language)
                                                    : (language === 'es' ? 'Lectura' : 'Reading')}
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

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                                {aiEnabled && (
                                                    <button
                                                        className="ai-guide-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const titleWithCitation = reading.citation
                                                                ? `${normalizeReadingTitle(reading.title)} (${reading.citation.replace(/,/g, ', ')})`
                                                                : normalizeReadingTitle(reading.title);
                                                            handleOpenAI(e, titleWithCitation, reading.text);
                                                        }}
                                                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '20px', background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', width: '100%' }}
                                                    >
                                                        <Sparkles size={16} />
                                                        {language === 'es' ? 'Preguntar a la IA sobre esta lectura' : 'Ask AI about this reading'}
                                                    </button>
                                                )}

                                                {!isCompleted && (
                                                    <button
                                                        className="mark-read-btn"
                                                        onClick={(e) => { e.stopPropagation(); markSectionComplete(readingId); }}
                                                        aria-label="Mark as read"
                                                    >
                                                        <CheckCircle size={15} />
                                                        {language === 'es' ? 'Marcar como leído' : 'Mark as Read'}
                                                    </button>
                                                )}
                                            </div>
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

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                            {aiEnabled && (
                                                <button
                                                    className="ai-guide-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenAI(e, reflection.title, reflection.content, 'Words of the Pope');
                                                    }}
                                                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '20px', background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', width: '100%' }}
                                                >
                                                    <Sparkles size={16} />
                                                    {language === 'es' ? 'Preguntar a la IA sobre esta reflexión' : 'Ask AI about this reflection'}
                                                </button>
                                            )}

                                            {!completedItems.includes('reflection') && (
                                                <button
                                                    className="mark-read-btn"
                                                    onClick={(e) => { e.stopPropagation(); markSectionComplete('reflection'); }}
                                                    aria-label="Mark reflection as read"
                                                >
                                                    <CheckCircle size={15} />
                                                    {language === 'es' ? 'Marcar como leído' : 'Mark as Read'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Mark All Complete Button */}
                    {!loading && !error && readingsToRender && readingsToRender.length > 0 && (() => {
                        const allIds = [
                            ...readingsToRender.map((_, i) => `usccb-${i}`),
                            ...(reflection ? ['reflection'] : [])
                        ];
                        const allDone = allIds.every(id => completedItems.includes(id));
                        return (
                            <div className="mark-all-complete-row">
                                <button
                                    className="mark-all-complete-btn"
                                    onClick={!allDone ? markAllComplete : undefined}
                                    disabled={allDone}
                                    aria-label={allDone
                                        ? (language === 'es' ? 'Completado' : 'Completed')
                                        : (language === 'es' ? 'Marcar todo como completado' : 'Mark all as complete')}
                                >
                                    <CheckCircle size={16} />
                                    {allDone
                                        ? (language === 'es' ? 'Completado' : 'Completed')
                                        : (language === 'es' ? 'Marcar como Completado' : 'Mark as Complete')}
                                </button>
                            </div>
                        );
                    })()}

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
                                    <div className="source-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <a
                                                href="https://bible.usccb.org/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="source-link-sacred"
                                            >
                                                <span>Source: USCCB</span>
                                            </a>
                                            {reflection && (
                                                <a
                                                    href={language === 'es' ? "https://www.vaticannews.va/es/evangelio-de-hoy.html" : "https://www.vaticannews.va/en/word-of-the-day.html"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="source-link-sacred"
                                                >
                                                    <span>Vatican News</span>
                                                </a>
                                            )}
                                        </div>
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
                    onResetProgress={() => { }}
                />

                <AIModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    contextStr={aiContextText}
                    topicName={aiTopicName}
                    source={aiSource}
                    language={language}
                    startTab={aiStartTab}
                />
            </div>
        </div>
    );
}



