import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

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
    
    // Stabilize the date - convert to string for comparison
    const dateString = useMemo(() => currentDate.toISOString().split('T')[0], [currentDate]);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [reflection, setReflection] = useState<DailyReflection | null>(null);
    const [title, setTitle] = useState<string>('');
    const [loading, setLoading] = useState(false);
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
        
        playbackIdRef.current++;
        const currentPlaybackId = playbackIdRef.current;
        isPlayingRef.current = true;
        setIsPlaying(true);
        
        const segments: any[] = [];
        
        // Add title
        if (title) {
            segments.push({ text: title, pause: 1000 });
        }
        
        // Add readings (skip completed)
        readings.forEach((reading, readingIndex) => {
            const id = `usccb-${readingIndex}`;
            if (completedIds.includes(id)) return; // Skip if already completed
            
            const spokenText = getSpokenText(reading.text);
            segments.push({ text: normalizeReadingTitle(reading.title), pause: 800 });
            
            const chunks = chunkText(spokenText);
            chunks.forEach((chunk, chunkIndex) => {
                const isLast = chunkIndex === chunks.length - 1;
                segments.push({
                    text: chunk,
                    pause: isLast ? 1500 : 300,
                    onComplete: isLast ? () => {
                        setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id]);
                        localStorage.setItem(`dailyReadings_completed_${dateString}`, JSON.stringify([...completedIds, id]));
                    } : undefined
                });
            });
        });
        
        // Add reflection (skip if completed)
        if (reflection) {
            const id = 'reflection';
            if (!completedIds.includes(id)) {
                const spokenText = getSpokenText(reflection.content);
                segments.push({ text: reflection.title, pause: 800 });
                
                const chunks = chunkText(spokenText);
                chunks.forEach((chunk, index) => {
                    const isLast = index === chunks.length - 1;
                    segments.push({ 
                        text: chunk, 
                        pause: 300,
                        onComplete: isLast ? () => {
                            setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id]);
                            localStorage.setItem(`dailyReadings_completed_${dateString}`, JSON.stringify([...completedIds, id]));
                        } : undefined
                    });
                });
            }
        }
        
        // Add blessing
        segments.push({ text: blessingText, pause: 1000 });
        
        // Play sequence
        const playNext = (index: number) => {
            if (playbackIdRef.current !== currentPlaybackId) return;
            if (!isPlayingRef.current) return;
            if (index >= segments.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                onComplete?.();
                return;
            }
            
            const segment = segments[index];
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
        playbackIdRef.current++;
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopAudio();
    }, [stopAudio]);
    
    return {
        isPlaying,
        play,
        stop,
        loading,
        hasReadings: readings.length > 0,
        liturgicalColor
    };
}
