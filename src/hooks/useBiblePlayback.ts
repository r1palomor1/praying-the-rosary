import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useBibleProgress } from './useBibleProgress';
import biblePlan from '../data/bibleInYearPlan.json';

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

interface Chapter {
    title: string;
    text: string;
}

interface UseBiblePlaybackOptions {
    onComplete?: () => void;
}

export function useBiblePlayback(
    currentDay: number,
    options: UseBiblePlaybackOptions = {}
) {
    const { language, playAudio, stopAudio } = useApp();
    const { onComplete } = options;
    const { markChapterComplete, isChapterComplete } = useBibleProgress();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [dayData, setDayData] = useState<BibleDay | null>(null);
    const [loading, setLoading] = useState(false);
    const [liturgicalColor, setLiturgicalColor] = useState('#a87d3e');
    
    const isPlayingRef = useRef(false);
    const playbackIdRef = useRef(0);
    
    const API_BASE = import.meta.env.DEV ? 'https://praying-the-rosary.vercel.app' : '';
    
    const blessingText = language === 'es'
        ? 'La lectura del día se ha completado. Que Dios te bendiga por tu fiel devoción a su palabra.'
        : 'The reading for the day is now complete. May God bless you for your faithful devotion to his word.';
    
    const t = language === 'es'
        ? { day: 'Día', phase: 'Fase', firstReading: 'Primera Lectura', secondReading: 'Segunda Lectura', psalmProverbs: 'Salmo o Proverbio' }
        : { day: 'Day', phase: 'Phase', firstReading: 'First Reading', secondReading: 'Second Reading', psalmProverbs: 'Psalm or Proverbs' };
    
    const translatePeriod = (period: string): string => {
        if (language === 'es') {
            const periodMap: Record<string, string> = {
                'Creation and Patriarchs': 'Creación y Patriarcas',
                'Exodus and Law': 'Éxodo y Ley',
                'Conquest and Judges': 'Conquista y Jueces',
                'Kingdom United': 'Reino Unido',
                'Kingdom Divided': 'Reino Dividido',
                'Exile and Return': 'Exilio y Retorno',
                'Wisdom': 'Sabiduría',
                'Prophets': 'Profetas',
                'Life of Jesus': 'Vida de Jesús',
                'Early Church': 'Iglesia Primitiva',
                'Epistles': 'Epístolas',
                'Final Letters and Revelation': 'Cartas Finales y Apocalipsis'
            };
            return periodMap[period] || period;
        }
        return period;
    };
    
    // Fetch readings data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch liturgical color
            const { fetchLiturgicalDay, getLiturgicalColorHex } = await import('../utils/liturgicalCalendar');
            const today = new Date();
            const liturgy = await fetchLiturgicalDay(today, language);
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
                    const response = await fetch(`${API_BASE}/api/bible?citation=${encodeURIComponent(citation)}&lang=${language}`);
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
            
            setReadings(readingsToFetch);
        } catch (err) {
            console.error('Error fetching Bible readings:', err);
        } finally {
            setLoading(false);
        }
    }, [currentDay, language, API_BASE, t]);
    
    useEffect(() => {
        fetchData();
    }, [currentDay, language]);
    
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
    
    const parseChapters = (reading: Reading): Chapter[] => {
        const chapters: Chapter[] = [];
        if (reading.text.includes('###')) {
            const segments = reading.text.split('###');
            segments.forEach(seg => {
                const clean = seg.trim();
                if (!clean) return;
                const lines = clean.split('\n');
                let title = lines[0].trim();
                title = title.replace(/(Chapter|Capítulo)\s+/i, '');
                const body = lines.slice(1).join('\n').trim();
                if (title && body) {
                    chapters.push({ title, text: body });
                }
            });
        }
        
        if (chapters.length === 0) {
            chapters.push({ title: reading.citation || reading.title, text: reading.text });
        }
        
        return chapters;
    };
    
    const play = useCallback(() => {
        if (isPlayingRef.current || readings.length === 0) return;
        
        // Parse all chapters to check completion
        const allChapters: Chapter[] = [];
        readings.forEach(reading => {
            const chapters = parseChapters(reading);
            allChapters.push(...chapters);
        });
        
        // Check if all chapters are complete
        const allComplete = allChapters.length > 0 && allChapters.every(ch => 
            isChapterComplete(currentDay, ch.title)
        );
        
        // If everything is complete, just play the blessing
        if (allComplete) {
            playbackIdRef.current++;
            isPlayingRef.current = true;
            setIsPlaying(true);
            
            playAudio(blessingText, () => {
                setIsPlaying(false);
                isPlayingRef.current = false;
                onComplete?.();
            });
            return;
        }
        
        playbackIdRef.current++;
        const currentPlaybackId = playbackIdRef.current;
        isPlayingRef.current = true;
        setIsPlaying(true);
        
        const segments: any[] = [];
        
        // Add intro
        if (dayData) {
            const periodString = translatePeriod(dayData.period);
            const introText = `${t.day} ${currentDay}. ${t.phase}: ${periodString}.`;
            segments.push({ text: introText, pause: 800 });
        }
        
        // Process each reading
        readings.forEach(reading => {
            const chapters = parseChapters(reading);
            
            // Check if all chapters in this reading are complete
            const allChaptersComplete = chapters.every(ch => isChapterComplete(currentDay, ch.title));
            if (allChaptersComplete) return; // Skip entire reading if all chapters done
            
            // Reading title (only if reading has incomplete chapters)
            let cleanTitle = reading.title.replace(/\//g, ' ').replace(/(Chapter|Capítulo)\s*/gi, '').trim();
            cleanTitle = cleanTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');
            segments.push({ text: cleanTitle, pause: 500 });
            
            // Each chapter
            chapters.forEach(chapter => {
                // Skip if already completed
                if (isChapterComplete(currentDay, chapter.title)) return;
                
                // Chapter title (if different from reading title)
                if (chapter.title !== reading.title && chapter.title !== reading.citation) {
                    let chTitle = chapter.title.replace(/(Chapter|Capítulo)\s*/gi, '').trim();
                    chTitle = chTitle.replace(/([a-zA-Z])\s+(\d)/, '$1, $2');
                    
                    if (language === 'en') {
                        chTitle = chTitle.replace(/:(\d+)-(\d+)/, ', verses $1 to $2');
                        chTitle = chTitle.replace(/:(\d+)/, ', verse $1');
                    } else {
                        chTitle = chTitle.replace(/:(\d+)-(\d+)/, ', versículos $1 al $2');
                        chTitle = chTitle.replace(/:(\d+)/, ', versículo $1');
                    }
                    
                    segments.push({ text: chTitle, pause: 400 });
                }
                
                // Chapter text
                let spokenText = chapter.text
                    .replace(/###\s*/g, '')
                    .replace(/\[\s*\d+\s*\]/g, '')
                    .replace(/\//g, ' ')
                    .replace(/(Chapter|Capítulo)\s+(?=\d)/gi, '');
                spokenText = spokenText.replace(/([a-zA-Z])\s+(\d+)/g, '$1, $2');
                
                const chunks = chunkText(spokenText);
                chunks.forEach((chunk, index) => {
                    const isLast = index === chunks.length - 1;
                    segments.push({
                        text: chunk,
                        pause: isLast ? 800 : 300,
                        onComplete: isLast ? () => {
                            markChapterComplete(currentDay, chapter.title);
                        } : undefined
                    });
                });
            });
            
            // Pause between readings
            segments.push({ text: ' ', pause: 1000 });
        });
        
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
    }, [readings, dayData, currentDay, blessingText, language, playAudio, onComplete, t, translatePeriod, isChapterComplete, markChapterComplete]);
    
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
