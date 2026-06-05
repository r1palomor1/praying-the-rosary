export interface Chapter {
    title: string;
    text: string;
}

export interface Reading {
    title: string;
    citation: string;
    text: string;
}

export const parseBibleChapters = (reading: Reading): Chapter[] => {
    const chapters: Chapter[] = [];

    // Check if text has markdown headers
    if (reading.text.includes('###')) {
        const segments = reading.text.split('###');
        segments.forEach(seg => {
            const clean = seg.trim();
            if (!clean) return;
            const lines = clean.split('\n');
            let title = lines[0].trim();
            // Strip "Chapter" or "Capítulo"
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

export const chunkBibleText = (text: string, maxLength: number = 200): string[] => {
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

export const getChapterChunks = (text: string): string[] => {
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    const chunks: string[] = [];
    paragraphs.forEach(p => {
        const cleanP = p.replace(/###\s*/g, '').trim();
        if (!cleanP) return;
        if (p.startsWith('###')) return; // Headers are not part of body chunks

        let spokenP = cleanP
            .replace(/\[\s*\d+\s*\]/g, '')
            .replace(/\//g, ' ')
            .replace(/(Chapter|Capítulo)\s+(?=\d)/gi, '');
        spokenP = spokenP.replace(/([a-zA-Z])\s+(\d+)/g, '$1, $2');

        chunks.push(...chunkBibleText(spokenP));
    });
    return chunks;
};

export const getDailyReadingChunks = (text: string, language: string): string[] => {
    let cleanText = text.replace(/\u003cbr\s*\/?\u003e/gi, '\n');
    // Strip out citation numbers like (17b) or (2) immediately following R.
    cleanText = cleanText.replace(/(R\.|R\/\.)\s*\(\d+[a-zA-Z]?\)\s*/g, '$1 ');

    const lines = cleanText.split('\n');
    const chunks: string[] = [];
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        let clean = trimmed
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        // Strip bracket verse numbers e.g. [1]
        clean = clean.replace(/\[\s*\d+\s*\]/g, '');
        // Strip parenthesis scripture citations e.g. (40:5a) or (12)
        clean = clean.replace(/\(\d+.*?\)/g, '');
        
        const responseWord = language === 'es' ? 'Respuesta.' : 'Response.';
        clean = clean.replace(/R\.|R\/\./g, responseWord);

        chunks.push(...chunkBibleText(clean));
    });
    return chunks;
};
