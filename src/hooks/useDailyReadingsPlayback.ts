import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

// ─── Module-level state (survives React component lifecycle / navigation) ────
let _isPlaying = false;
let _playVersion = 0;

/** True if Daily Readings audio is active anywhere in the app. */
export const getDailyReadingsPlaying = () => _isPlaying;

/**
 * Kill any in-flight Daily Readings audio (hook closures + ttsManager).
 * Safe to call from any component/screen.
 */
export const killDailyReadingsPlayback = () => {
    _playVersion++;
    _isPlaying = false;
    window.dispatchEvent(new CustomEvent('dailyReading:playState', { detail: { playing: false } }));
    window.dispatchEvent(new CustomEvent('dailyReading:readingActive', { detail: { id: null } }));
};
// ─────────────────────────────────────────────────────────────────────────────

interface Reading {
    title: string;
    citation?: string;
    text: string;
}

interface DailyReflection {
    title: string;
    content: string;
    date: string;
}

interface UseDailyReadingsPlaybackOptions {
    onComplete?: () => void;
}

export function useDailyReadingsPlayback(
    currentDate: Date,
    options: UseDailyReadingsPlaybackOptions = {}
) {
    const { language, playAudio, stopAudio } = useApp();
    const { onComplete } = options;

    // Stabilize the date - convert to string for comparison (use local time, not UTC)
    const dateString = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, [currentDate]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [reflection, setReflection] = useState<DailyReflection | null>(null);
    const [title, setTitle] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
    const [liturgicalColor, setLiturgicalColor] = useState('#a87d3e');

    // Initialize completedIds from localStorage
    const [completedIds, setCompletedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem(`dailyReadings_completed_${dateString}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [];
            }
        }
        return [];
    });

    const isPlayingRef = useRef(false);
    const playbackIdRef = useRef(0);

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

    // Fetch readings data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch liturgical color
            const { fetchLiturgicalDay, getLiturgicalColorHex } = await import('../utils/liturgicalCalendar');
            const liturgy = await fetchLiturgicalDay(currentDate, language);
            const color = getLiturgicalColorHex(liturgy.celebrations[0].colour);
            setLiturgicalColor(color);

            // Fetch readings
            const dateStr = formatDateParam(currentDate);
            const usccbResponse = await fetch(`${API_BASE}/api/readings?date=${dateStr}&lang=${language}`);

            if (usccbResponse.ok) {
                const usccbData = await usccbResponse.json();
                setReadings(usccbData.readings || []);
                setTitle(usccbData.title || '');
            } else {
                setReadings([]);
                setTitle('');
            }

            // Fetch reflection
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const vaticanDate = `${year}-${month}-${day}`;
            const vaticanResponse = await fetch(`${API_BASE}/api/vatican-reflection?date=${vaticanDate}&lang=${language}`);

            if (vaticanResponse.ok) {
                const vatican = await vaticanResponse.json();
                setReflection(vatican.reflection);
            } else {
                setReflection(null);
            }
        } catch (err) {
            console.error('Error fetching readings:', err);
        } finally {
            setLoading(false);
        }
    }, [currentDate, language, API_BASE]);

    useEffect(() => {
        fetchData();
    }, [dateString, language]);

    // Reload completedIds when date changes, and listen for external completions
    useEffect(() => {
        const saved = localStorage.getItem(`dailyReadings_completed_${dateString}`);
        if (saved) {
            try {
                setCompletedIds(JSON.parse(saved));
            } catch {
                setCompletedIds([]);
            }
        } else {
            setCompletedIds([]);
        }

        const handleReadingComplete = (e: Event) => {
            const id = (e as CustomEvent).detail.id as string;
            setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id]);
        };
        window.addEventListener('dailyReading:readingComplete', handleReadingComplete);
        return () => window.removeEventListener('dailyReading:readingComplete', handleReadingComplete);
    }, [dateString]);

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

    const chunkText = (text: string, maxLength: number = 200): string[] => {
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

        return chunks.flatMap(chunk => {
            if (chunk.length <= 250) return [chunk];
            return chunk.match(/.{1,250}(?:\s|$)|.{1,250}/g) || [chunk];
        });
    };

    const getSpokenText = (rawText: string) => {
        let clean = rawText
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        clean = clean.replace(/\[\s*\d+\s*\]/g, '');
        const responseWord = language === 'es' ? 'Respuesta.' : 'Response.';
        clean = clean.replace(/R\.|R\/\./g, responseWord);
        return clean;
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

    const play = useCallback(() => {
        if (isPlayingRef.current || readings.length === 0) return;

        // Increment module-level version — invalidates any orphaned closures from previous session
        _playVersion++;
        const capturedVersion = _playVersion;

        _isPlaying = true;
        window.dispatchEvent(new CustomEvent('dailyReading:playState', { detail: { playing: true } }));

        // Check if all readings are already complete
        const allReadingIds = readings.map((_, i) => `usccb-${i}`);
        const allIds = reflection ? [...allReadingIds, 'reflection'] : allReadingIds;
        const allComplete = allIds.length > 0 && allIds.every(id => completedIds.includes(id));

        // If all readings are complete, allow a full replay by bypassing the skip check.

        playbackIdRef.current++;
        const currentPlaybackId = playbackIdRef.current;
        isPlayingRef.current = true;
        setIsPlaying(true);

        const segments: any[] = [];

        // Add title
        if (title) {
            segments.push({ text: title, pause: 1000, subtitle: title });
        }

        // Add readings (skip completed unless we are replaying all)
        readings.forEach((reading, readingIndex) => {
            const id = `usccb-${readingIndex}`;
            if (!allComplete && completedIds.includes(id)) return; // Skip if already completed

            const normTitle = normalizeReadingTitle(reading.title);
            segments.push({
                text: normTitle,
                pause: 800,
                readingId: id,
                subtitle: `${normTitle}: ${reading.citation}`
            });

            const spokenText = getSpokenText(reading.text);
            const chunks = chunkText(spokenText);
            chunks.forEach((chunk, chunkIndex) => {
                const isLast = chunkIndex === chunks.length - 1;
                segments.push({
                    text: chunk,
                    pause: isLast ? 1500 : 300,
                    onComplete: isLast ? () => {
                        setCompletedIds(prev => {
                            if (prev.includes(id)) return prev;
                            const updated = [...prev, id];
                            localStorage.setItem(`dailyReadings_completed_${dateString}`, JSON.stringify(updated));
                            return updated;
                        });
                        // Notify DailyReadingsScreen to show checkmark
                        window.dispatchEvent(new CustomEvent('dailyReading:readingComplete', { detail: { id } }));
                    } : undefined
                });
            });
        });

        // Add reflection (skip if completed unless we are replaying all)
        if (reflection) {
            const id = 'reflection';
            if (allComplete || !completedIds.includes(id)) {
                const spokenText = getSpokenText(reflection.content);
                // Tag the title segment with readingId so DailyReadingsScreen can highlight
                segments.push({
                    text: reflection.title,
                    pause: 800,
                    readingId: id,
                    subtitle: reflection.title
                });

                const chunks = chunkText(spokenText);
                chunks.forEach((chunk, index) => {
                    const isLast = index === chunks.length - 1;
                    segments.push({
                        text: chunk,
                        pause: 300,
                        onComplete: isLast ? () => {
                            setCompletedIds(prev => {
                                if (prev.includes(id)) return prev;
                                const updated = [...prev, id];
                                localStorage.setItem(`dailyReadings_completed_${dateString}`, JSON.stringify(updated));
                                return updated;
                            });
                            // Notify DailyReadingsScreen to show checkmark
                            window.dispatchEvent(new CustomEvent('dailyReading:readingComplete', { detail: { id } }));
                        } : undefined
                    });
                });
            }
        }

        // Add blessing
        segments.push({ text: blessingText, pause: 1000, subtitle: blessingText });

        // Play sequence
        const playNext = (index: number) => {
            if (playbackIdRef.current !== currentPlaybackId) return;
            if (!isPlayingRef.current) return;
            if (_playVersion !== capturedVersion) return; // Killed externally (e.g. Play All took over)

            if (index >= segments.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                _isPlaying = false;
                setCurrentSubtitle(null);
                window.dispatchEvent(new CustomEvent('dailyReading:playState', { detail: { playing: false } }));
                window.dispatchEvent(new CustomEvent('dailyReading:readingActive', { detail: { id: null } }));
                onComplete?.();
                return;
            }

            const segment = segments[index];
            if (segment.subtitle) {
                setCurrentSubtitle(segment.subtitle);
            }
            // Fire readingActive event so DailyReadingsScreen can highlight current reading
            if (segment.readingId) {
                window.dispatchEvent(new CustomEvent('dailyReading:readingActive', { detail: { id: segment.readingId } }));
            }
            playAudio(segment.text, () => {
                if (playbackIdRef.current !== currentPlaybackId) return;
                if (!isPlayingRef.current) return;
                if (segment.onComplete) segment.onComplete();
                setTimeout(() => playNext(index + 1), segment.pause || 500);
            });
        };

        playNext(0);
    }, [readings, reflection, title, blessingText, language, playAudio, onComplete]);

    const stop = useCallback(() => {
        _playVersion++;          // Invalidate all in-flight closures
        _isPlaying = false;
        playbackIdRef.current++;
        isPlayingRef.current = false;
        setCurrentSubtitle(null);
        setIsPlaying(false);
        stopAudio();
        window.dispatchEvent(new CustomEvent('dailyReading:playState', { detail: { playing: false } }));
        window.dispatchEvent(new CustomEvent('dailyReading:readingActive', { detail: { id: null } }));
    }, [stopAudio]);

    // Check if all readings are complete
    // Only consider complete if we have data loaded (not during initial load)
    const allReadingIds = readings.map((_, i) => `usccb-${i}`);
    const allIds = reflection ? [...allReadingIds, 'reflection'] : allReadingIds;
    const hasData = readings.length > 0;
    const isComplete = hasData && allIds.every(id => completedIds.includes(id));

    return {
        isPlaying,
        currentSubtitle,
        play,
        stop,
        loading,
        hasReadings: readings.length > 0,
        liturgicalColor,
        isComplete
    };
}
