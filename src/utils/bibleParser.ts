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
