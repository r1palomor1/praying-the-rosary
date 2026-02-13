import { geolocation } from '@vercel/edge';

export const config = {
    runtime: 'edge',
};

// Map book names to wldeh/bible-api IDs (English)
const BOOK_MAPPINGS = {
    // Law
    'genesis': 'genesis',
    'exodus': 'exodus',
    'leviticus': 'leviticus',
    'numbers': 'numbers',
    'deuteronomy': 'deuteronomy',
    // History
    'joshua': 'joshua',
    'judges': 'judges',
    'ruth': 'ruth',
    '1 samuel': '1samuel',
    '2 samuel': '2samuel',
    '1 kings': '1kings',
    '2 kings': '2kings',
    '1 chronicles': '1chronicles',
    '2 chronicles': '2chronicles',
    'ezra': 'ezra',
    'nehemiah': 'nehemiah',
    'tobit': 'tobit',
    'judith': 'judith',
    'esther': 'esther',
    '1 maccabees': '1maccabees',
    '2 maccabees': '2maccabees',
    // Wisdom
    'job': 'job',
    'psalms': 'psalms',
    'psalm': 'psalms',
    'proverbs': 'proverbs',
    'ecclesiastes': 'ecclesiastes',
    'song of solomon': 'songofsolomon',
    'song of songs': 'songofsolomon',
    'wisdom': 'wisdom',
    'sirach': 'sirach',
    'ecclesiasticus': 'sirach',
    // Prophecy
    'isaiah': 'isaiah',
    'jeremiah': 'jeremiah',
    'lamentations': 'lamentations',
    'baruch': 'baruch',
    'ezekiel': 'ezekiel',
    'daniel': 'daniel',
    'hosea': 'hosea',
    'joel': 'joel',
    'amos': 'amos',
    'obadiah': 'obadiah',
    'jonah': 'jonah',
    'micah': 'micah',
    'nahum': 'nahum',
    'habakkuk': 'habakkuk',
    'zephaniah': 'zephaniah',
    'haggai': 'haggai',
    'zechariah': 'zechariah',
    'malachi': 'malachi',
    // New Testament
    'matthew': 'matthew',
    'mark': 'mark',
    'luke': 'luke',
    'john': 'john',
    'acts': 'acts',
    'romans': 'romans',
    '1 corinthians': '1corinthians',
    '2 corinthians': '2corinthians',
    'galatians': 'galatians',
    'ephesians': 'ephesians',
    'philippians': 'philippians',
    'colossians': 'colossians',
    '1 thessalonians': '1thessalonians',
    '2 thessalonians': '2thessalonians',
    '1 timothy': '1timothy',
    '2 timothy': '2timothy',
    'titus': 'titus',
    'philemon': 'philemon',
    'hebrews': 'hebrews',
    'james': 'james',
    '1 peter': '1peter',
    '2 peter': '2peter',
    '1 john': '1john',
    '2 john': '2john',
    '3 john': '3john',
    'jude': 'jude',
    'revelation': 'revelation'
};

export default async function handler(request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const url = new URL(request.url);
        const citation = url.searchParams.get('citation');
        const lang = url.searchParams.get('lang') || 'en';

        // Spanish is currently unavailable via this API source
        if (lang === 'es') {
            return new Response(JSON.stringify({
                error: 'Spanish content source currently unavailable',
                available: false
            }), {
                status: 404, // Use 404 to trigger "Content not available" UI
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!citation) {
            return new Response(JSON.stringify({ error: 'Citation required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse citation: "Genesis 1-2"
        const match = citation.match(/^(.+?)\s+(\d+)(?:-(\d+))?/);
        if (!match) {
            return new Response(JSON.stringify({ error: 'Invalid citation format' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const rawBook = match[1].trim().toLowerCase();
        const startChapter = parseInt(match[2]);
        const endChapter = match[3] ? parseInt(match[3]) : startChapter;

        // Map to API ID
        let bookId = BOOK_MAPPINGS[rawBook] || rawBook.replace(/\s+/g, '');

        // Always use English Douay-Rheims (en-dra) as it is 100% complete
        const version = 'en-dra';

        const chaptersData = [];
        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
            const apiUrl = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${version}/books/${bookId}/chapters/${chapter}.json`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    console.error(`Failed to fetch ${bookId} ${chapter}: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                // wldeh returns { data: [ {verse: "1", text: "..."}, ... ] }
                const chapterText = data.data.map(v => `${v.verse} ${v.text}`).join(' ');

                chaptersData.push({
                    chapter,
                    text: chapterText
                });

            } catch (err) {
                console.error(`Error processing ${bookId} ${chapter}:`, err);
            }
        }

        if (chaptersData.length === 0) {
            return new Response(JSON.stringify({ error: 'Content not found', citation }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const combinedText = chaptersData.map(c =>
            `Chapter ${c.chapter}\n\n${c.text}`
        ).join('\n\n');

        return new Response(JSON.stringify({
            citation,
            book: match[1].trim(),
            chapters: chaptersData.map(c => c.chapter),
            text: combinedText
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400'
            }
        });

    } catch (error) {
        console.error('Bible API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
