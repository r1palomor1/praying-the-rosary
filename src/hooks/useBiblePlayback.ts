import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBibleProgress } from './useBibleProgress';
import biblePlan from '../data/bibleInYearPlan.json';
import { parseBibleChapters, getChapterChunks, type Reading, type Chapter } from '../utils/bibleParser';

// ─── Module-level state (survives React component lifecycle / navigation) ────
let _isPlaying = false;
let _playVersion = 0;
let _currentlyPlayingId: string | null = null;
let _activeChapterId: string | null = null;
let _activeChapterTitle: string | null = null;
let _activeChunkIndex: number | null = null;

/** True if Bible audio is active anywhere in the app. */
export const getBiblePlaying = () => _isPlaying;
export const getBiblePlayingId = () => _currentlyPlayingId;
export const getBibleActiveChapterId = () => _activeChapterId;
export const getBibleActiveChapterTitle = () => _activeChapterTitle;
export const getBibleActiveChunkIndex = () => _activeChunkIndex;

/**
 * Kill any in-flight Bible hook audio.
 * Safe to call from any component/screen.
 */
export const killBiblePlayback = () => {
    _playVersion++;
    _isPlaying = false;
    _currentlyPlayingId = null;
    _activeChapterId = null;
    _activeChapterTitle = null;
    _activeChunkIndex = null;
    window.dispatchEvent(new CustomEvent('bible:playState', { detail: { playing: false } }));
    window.dispatchEvent(new CustomEvent('bible:chapterActive', { detail: { id: null } }));
    window.dispatchEvent(new CustomEvent('bible:chunkActive', { detail: { chapterTitle: null, chunkIndex: null } }));
};

if (typeof window !== 'undefined') {
    window.addEventListener('bible:playState', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        _isPlaying = detail.playing;
        if (detail.playing) {
            _currentlyPlayingId = detail.id || detail.type || 'all';
        } else {
            _currentlyPlayingId = null;
            _activeChapterId = null;
            _activeChapterTitle = null;
            _activeChunkIndex = null;
        }
    });
    window.addEventListener('bible:chapterActive', (e: Event) => {
        _activeChapterId = (e as CustomEvent).detail.id;
    });
    window.addEventListener('bible:chunkActive', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        _activeChapterTitle = detail.chapterTitle;
        _activeChunkIndex = detail.chunkIndex;
    });
}
// ─────────────────────────────────────────────────────────────────────────────

interface BibleDay {
    day: number;
    period: string;
    first_reading: string;
    second_reading: string | null;
    psalm_proverbs: string;
}

// Removed internal Reading and Chapter interfaces from here

interface UseBiblePlaybackOptions {
    onComplete?: () => void;
}

export function useBiblePlayback(
    currentDay: number,
    options: UseBiblePlaybackOptions = {}
) {
    const { language, playAudio, stopAudio } = useApp();
    const { onComplete } = options;
    const { 
        markChapterComplete, 
        isChapterComplete, 
        isDayComplete, 
        markDayComplete,
        getChapterChunkProgress,
        saveChapterChunkProgress
    } = useBibleProgress();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [dayData, setDayData] = useState<BibleDay | null>(null);
    const [loading, setLoading] = useState(false);
    const [liturgicalColor, setLiturgicalColor] = useState('#a87d3e');

    const isPlayingRef = useRef(false);
    const playbackIdRef = useRef(0);

    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';

    const blessingText = useMemo(() => language === 'es'
        ? 'La lectura del día se ha completado. Que Dios te bendiga por tu fiel devoción a su palabra.'
        : 'The reading for the day is now complete. May God bless you for your faithful devotion to his word.', [language]);

    const t = useMemo(() => language === 'es'
        ? { day: 'Día', phase: 'Etapa', firstReading: 'Primera Lectura', secondReading: 'Segunda Lectura', psalmProverbs: 'Salmo o Proverbio' }
        : { day: 'Day', phase: 'Phase', firstReading: 'First Reading', secondReading: 'Second Reading', psalmProverbs: 'Psalm or Proverbs' }, [language]);

    const translatePeriod = useCallback((period: string): string => {
        if (language === 'es') {
            const periodMap: Record<string, string> = {
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
            };
            return periodMap[period] || period;
        }
        return period;
    }, [language]);

    // Fetch readings data
    useEffect(() => {
        let isCurrent = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch liturgical color
                const { fetchLiturgicalDay, getLiturgicalColorHex } = await import('../utils/liturgicalCalendar');
                const today = new Date();
                const liturgy = await fetchLiturgicalDay(today, language);
                if (!isCurrent) return;
                const color = getLiturgicalColorHex(liturgy.celebrations[0].colour);
                setLiturgicalColor(color);

                const data = biblePlan.find((d: BibleDay) => d.day === currentDay);
                if (!data) {
                    setLoading(false);
                    return;
                }

                setDayData(data);

                const readingsToFetch: Reading[] = [];

                const fetchOne = async (citation: string, title: string) => {
                    try {
                        const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(citation)}&lang=${language}&v=layout_v3`);
                        if (response.ok) {
                            const json = await response.json();
                            readingsToFetch.push({ title, citation, text: json.text || '' });
                        } else {
                            readingsToFetch.push({ title, citation, text: `📖 ${citation}\n\n[Error]` });
                        }
                    } catch (e) {
                        readingsToFetch.push({ title, citation, text: `📖 ${citation}\n\n[Error]` });
                    }
                };

                await fetchOne(data.first_reading, t.firstReading);
                if (data.second_reading) await fetchOne(data.second_reading, t.secondReading);
                await fetchOne(data.psalm_proverbs, t.psalmProverbs);

                if (!isCurrent) return;

                setReadings(readingsToFetch);
            } catch (err) {
                if (isCurrent) console.error('[useBiblePlayback] Error fetching Bible readings:', err);
            } finally {
                if (isCurrent) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isCurrent = false;
        };
    }, [currentDay, language, API_BASE, t]);


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

    // Replaced chunkText and parseChapters with imported unifed versions

    const play = useCallback(() => {
        if (isPlayingRef.current || readings.length === 0) return;

        // Increment module-level version — invalidates any orphaned closures
        _playVersion++;
        const capturedVersion = _playVersion;

        _isPlaying = true;
        window.dispatchEvent(new CustomEvent('bible:playState', { detail: { playing: true, type: 'all', id: 'all' } }));
        setCurrentSubtitle(null); // Reset subtitle on start

        // Parse all chapters to check completion
        const allChapters: Chapter[] = [];
        readings.forEach(reading => {
            const chapters = parseBibleChapters(reading);
            allChapters.push(...chapters);
        });

        // Check if all chapters are complete
        const allComplete = allChapters.length > 0 && allChapters.every(ch =>
            isChapterComplete(currentDay, ch.title)
        );

        // If everything is complete, allow a full replay by bypassing the skip check.

        playbackIdRef.current++;
        const currentPlaybackId = playbackIdRef.current;
        isPlayingRef.current = true;
        setIsPlaying(true);

        const segments: any[] = [];

        // Check if we are starting clean or resuming mid-chapter
        let skipDayIntro = false;
        let isFirstReading = true;

        readings.forEach(reading => {
            const chapters = parseBibleChapters(reading);
            const chaptersToPlay = allComplete ? chapters : chapters.filter(c => !isChapterComplete(currentDay, c.title));
            if (chaptersToPlay.length > 0) {
                if (isFirstReading) {
                    const firstChapter = chaptersToPlay[0];
                    const savedProgress = getChapterChunkProgress(currentDay, firstChapter.title);
                    if (savedProgress >= 0) {
                        skipDayIntro = true;
                    }
                    isFirstReading = false;
                }
            }
        });

        // Add intro
        if (dayData && !skipDayIntro) {
            const periodString = translatePeriod(dayData.period);
            const introText = `${t.day} ${currentDay}. ${t.phase}: ${periodString}.`;
            segments.push({ text: introText, pause: 800, subtitle: `${t.day} ${currentDay} • ${periodString}` });
        }

        // Process each reading
        readings.forEach(reading => {
            const chapters = parseBibleChapters(reading);

            // Check if all chapters in this reading are complete
            const allChaptersComplete = chapters.every(ch => isChapterComplete(currentDay, ch.title));
            if (!allComplete && allChaptersComplete) return; // Skip entire reading if all chapters done unless replaying

            const firstChapter = chapters[0];
            const firstChapterProgress = firstChapter ? getChapterChunkProgress(currentDay, firstChapter.title) : -1;
            const skipHeaders = firstChapterProgress >= 0;

            if (!skipHeaders) {
                // Reading title (only if reading has incomplete chapters)
                let cleanTitle = reading.title.replace(/\//g, ' ').replace(/(Chapter|Capítulo)\s*/gi, '').trim();
                cleanTitle = cleanTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');
                segments.push({ text: cleanTitle, pause: 500, subtitle: reading.title });
            }

            // Each chapter
            chapters.forEach(chapter => {
                // Skip if already completed unless replaying
                const isComplete = isChapterComplete(currentDay, chapter.title);
                if (!allComplete && isComplete) {
                    return;
                }

                const savedProgress = getChapterChunkProgress(currentDay, chapter.title);
                const isResumingThisChapter = savedProgress >= 0;

                // Chapter title (if different from reading title)
                if (chapter.title !== reading.title && chapter.title !== reading.citation) {
                    if (!isResumingThisChapter) {
                        let chTitle = chapter.title.replace(/(Chapter|Capítulo)\s*/gi, '').trim();
                        chTitle = chTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');

                        if (language === 'en') {
                            chTitle = chTitle.replace(/:(\d+)-(\d+)/, ', verses $1 to $2');
                            chTitle = chTitle.replace(/:(\d+)/, ', verse $1');
                        } else {
                            chTitle = chTitle.replace(/:(\d+)-(\d+)/, ', versículos $1 al $2');
                            chTitle = chTitle.replace(/:(\d+)/, ', versículo $1');
                        }

                        segments.push({
                            text: chTitle,
                            pause: 400,
                            chapterTitle: chapter.title,
                            subtitle: `${reading.title} • ${chapter.title}`
                        });
                    }
                }

                // Chapter text
                const chunks = getChapterChunks(chapter.text);
                chunks.forEach((chunk, index) => {
                    if (savedProgress >= 0 && index <= savedProgress) {
                        return;
                    }

                    const isLast = index === chunks.length - 1;
                    segments.push({
                        text: chunk,
                        pause: isLast ? 800 : 300,
                        chapterTitle: chapter.title,
                        chunkIndex: index,
                        subtitle: `${reading.title} • ${chapter.title}`,
                        onComplete: () => {
                            if (isLast) {
                                markChapterComplete(currentDay, chapter.title);
                            } else {
                                saveChapterChunkProgress(currentDay, chapter.title, index);
                            }
                        }
                    });
                });
            });

            // Pause between readings
            segments.push({ text: ' ', pause: 1000 });
        });

        // Add blessing and mark day complete structural fix here
        segments.push({
            text: blessingText,
            pause: 1000,
            subtitle: blessingText,
            onComplete: () => {
                markDayComplete(currentDay);
            }
        });

        // Play sequence
        const playNext = (index: number) => {
            if (playbackIdRef.current !== currentPlaybackId) return;
            if (!isPlayingRef.current) return;
            if (_playVersion !== capturedVersion) return; // Killed externally

            if (index >= segments.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                _isPlaying = false;
                setCurrentSubtitle(null);
                window.dispatchEvent(new CustomEvent('bible:playState', { detail: { playing: false } }));
                window.dispatchEvent(new CustomEvent('bible:chapterActive', { detail: { id: null } }));
                window.dispatchEvent(new CustomEvent('bible:chunkActive', { detail: { chapterTitle: null, chunkIndex: null } }));
                onComplete?.();
                return;
            }

            const segment = segments[index];
            if (segment.subtitle) {
                setCurrentSubtitle(segment.subtitle);
            }
            if (segment.chapterTitle) {
                window.dispatchEvent(new CustomEvent('bible:chapterActive', { detail: { id: segment.chapterTitle } }));
            }
            if (segment.chapterTitle && segment.chunkIndex !== undefined) {
                window.dispatchEvent(new CustomEvent('bible:chunkActive', {
                    detail: {
                        chapterTitle: segment.chapterTitle,
                        chunkIndex: segment.chunkIndex
                    }
                }));
            } else {
                window.dispatchEvent(new CustomEvent('bible:chunkActive', {
                    detail: {
                        chapterTitle: null,
                        chunkIndex: null
                    }
                }));
            }

            if (!segment.text.trim()) {
                setTimeout(() => playNext(index + 1), segment.pause || 500);
                return;
            }

            playAudio(segment.text, () => {
                if (playbackIdRef.current !== currentPlaybackId) return;
                if (!isPlayingRef.current) return;
                if (segment.onComplete) segment.onComplete();
                setTimeout(() => playNext(index + 1), segment.pause || 500);
            });
        };

        playNext(0);
    }, [readings, dayData, currentDay, blessingText, language, playAudio, onComplete, t, translatePeriod, isChapterComplete, markChapterComplete, getChapterChunkProgress, saveChapterChunkProgress]);

    const stop = useCallback(() => {
        _playVersion++;
        _isPlaying = false;
        playbackIdRef.current++;
        isPlayingRef.current = false;
        setCurrentSubtitle(null);
        setIsPlaying(false);
        stopAudio();
        _activeChapterTitle = null;
        _activeChunkIndex = null;
        window.dispatchEvent(new CustomEvent('bible:playState', { detail: { playing: false } }));
        window.dispatchEvent(new CustomEvent('bible:chapterActive', { detail: { id: null } }));
        window.dispatchEvent(new CustomEvent('bible:chunkActive', { detail: { chapterTitle: null, chunkIndex: null } }));
    }, [stopAudio]);

    // Parse all chapters to check progress
    const allChapters: Chapter[] = [];
    readings.forEach(reading => {
        const chapters = parseBibleChapters(reading);
        allChapters.push(...chapters);
    });

    // Calculate granular chunk-level progress percentage
    let totalChunksCount = 0;
    let completedChunksCount = 0;

    allChapters.forEach(chapter => {
        const chunks = getChapterChunks(chapter.text);
        const numChunks = chunks.length;
        totalChunksCount += numChunks;

        if (isChapterComplete(currentDay, chapter.title)) {
            completedChunksCount += numChunks;
        } else {
            const savedProgress = getChapterChunkProgress(currentDay, chapter.title);
            if (savedProgress >= 0) {
                completedChunksCount += Math.min(savedProgress + 1, numChunks);
            }
        }
    });

    let progressPercentage = totalChunksCount > 0 ? (completedChunksCount / totalChunksCount) * 100 : 0;
    if (isDayComplete(currentDay)) {
        progressPercentage = 100;
    }

    // Auto-mark day complete removed as it's correctly handled structurally by onComplete now

    return {
        isPlaying,
        currentSubtitle,
        play,
        stop,
        loading,
        hasReadings: readings.length > 0,
        liturgicalColor,
        progressPercentage
    };
}
