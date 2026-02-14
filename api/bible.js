
export const config = {
    runtime: 'edge', // Using Edge runtime for optimal performance
};

// Map English Book Names (from our App) to:
// 1. bible-api.com (Standard English) - Standard English names work fine.
// 2. wldeh/bible-api Spanish Folders (es-bes) - Needs "génesis", "1samuel" (lowercase, no spaces, Spanish names)

const ENGLISH_TO_SPANISH_REPO = {
    // Pentateuch
    'genesis': 'génesis',
    'exodus': 'éxodo',
    'leviticus': 'levítico',
    'numbers': 'números',
    'deuteronomy': 'deuteronomio',
    // History
    'joshua': 'josué',
    'judges': 'jueces',
    'ruth': 'rut',
    '1 samuel': '1samuel',
    '2 samuel': '2samuel',
    '1 kings': '1reyes',
    '2 kings': '2reyes',
    '1 chronicles': '1crónicas',
    '2 chronicles': '2crónicas',
    'ezra': 'esdras',
    'nehemiah': 'nehemías',
    'tobit': 'tobías',
    'judith': 'judit',
    'esther': 'ester',
    '1 maccabees': '1macabeos',
    '2 maccabees': '2macabeos',
    // Wisdom
    'job': 'job',
    'psalms': 'salmos',
    'psalm': 'salmos',
    'proverbs': 'proverbios',
    'ecclesiastes': 'eclesiastés',
    'song of solomon': 'cantares',
    'song of songs': 'cantares',
    'wisdom': 'sabiduría',
    'sirach': 'eclesiástico',
    'ecclesiasticus': 'eclesiástico',
    // Prophecy
    'isaiah': 'isaías',
    'jeremiah': 'jeremías',
    'lamentations': 'lamentaciones',
    'baruch': 'baruc',
    'ezekiel': 'ezequiel',
    'daniel': 'daniel',
    'hosea': 'oseas',
    'joel': 'joel',
    'amos': 'amós',
    'obadiah': 'abdías',
    'jonah': 'jonás',
    'micah': 'miqueas',
    'nahum': 'nahúm',
    'habakkuk': 'habacuc',
    'zephaniah': 'sofonías',
    'haggai': 'hageo',
    'zechariah': 'zacarías',
    'malachi': 'malaquías',
    // New Testament
    'matthew': 'mateo',
    'mark': 'marcos',
    'luke': 'lucas',
    'john': 'juan',
    'acts': 'hechos',
    'romans': 'romanos',
    '1 corinthians': '1corintios',
    '2 corinthians': '2corintios',
    'galatians': 'gálatas',
    'ephesians': 'efesios',
    'philippians': 'filipenses',
    'colossians': 'colosenses',
    '1 thessalonians': '1tesalonicenses',
    '2 thessalonians': '2tesalonicenses',
    '1 timothy': '1timoteo',
    '2 timothy': '2timoteo',
    'titus': 'tito',
    'philemon': 'filemón',
    'hebrews': 'hebreos',
    'james': 'santiago',
    '1 peter': '1pedro',
    '2 peter': '2pedro',
    '1 john': '1juan',
    '2 john': '2juan',
    '3 john': '3juan',
    'jude': 'judas',
    'revelation': 'apocalipsis'
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

        if (!citation) {
            return new Response(JSON.stringify({ error: 'Citation required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse citation: "Genesis 1" or "Genesis 1-2"
        const match = citation.match(/^(.+?)\s+(\d+)(?:-(\d+))?/);
        let rawBook, startChapter, endChapter;

        if (match) {
            rawBook = match[1].trim().toLowerCase();
            startChapter = parseInt(match[2]);
            endChapter = match[3] ? parseInt(match[3]) : startChapter;
        } else {
            rawBook = citation.split(' ')[0].toLowerCase();
            startChapter = 1;
            endChapter = 1;
        }

        const chaptersText = [];
        let sourceInfo = "";
        let versionInfo = "";

        // --- STRATEGY SELECTION ---

        if (lang === 'es') {
            // SPANISH STRATEGY: wldeh/bible-api (Static JSON, es-bes)
            // Verified clean text: Bible in Basic Spanish (Biblia en Español Sencillo)

            const spanishBook = ENGLISH_TO_SPANISH_REPO[rawBook] || rawBook;
            sourceInfo = 'github/wldeh/bible-api';
            versionInfo = 'Biblia en Español Sencillo';

            for (let chapter = startChapter; chapter <= endChapter; chapter++) {
                // Fetch JSON from raw.githubusercontent.com
                // URL: https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/es-bes/books/{BOOK}/chapters/{CHAPTER}.json
                const targetUrl = `https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/es-bes/books/${encodeURIComponent(spanishBook)}/chapters/${chapter}.json`;
                console.log(`Fetching Spanish: ${targetUrl}`);

                try {
                    const res = await fetch(targetUrl);
                    if (!res.ok) {
                        console.error(`Failed to fetch Spanish chapter: ${res.status}`);
                        continue;
                    }

                    const data = await res.json();

                    // Strict Parsing based on verified schema: { data: [ { text: "..." } ... ] }
                    let text = "Text unavailable.";

                    if (data.data && Array.isArray(data.data)) {
                        // Use newline to separate verses for better readability (user preference)
                        text = data.data.map(v => v.text || "").join('\n\n');
                    } else {
                        console.error("Spanish JSON schema mismatch:", JSON.stringify(data).substring(0, 100));
                        text = "Error: Invalid content format.";
                    }

                    // Add header
                    chaptersText.push(`### Capítulo ${chapter}\n\n${text}`);

                } catch (e) {
                    console.error("Error parsing Spanish JSON:", e);
                }
            }

        } else {
            // ENGLISH STRATEGY: bible-api.com (WEB)
            // Iterating chapters individually to avoid rate limits or range errors.

            sourceInfo = 'bible-api.com';
            versionInfo = 'World English Bible';

            for (let chapter = startChapter; chapter <= endChapter; chapter++) {
                // Format: https://bible-api.com/Genesis+1?translation=web
                // Note: book + chapter encoding
                const query = `${rawBook} ${chapter}`;
                const apiUrl = `https://bible-api.com/${encodeURIComponent(query)}?translation=web`;
                console.log(`Fetching English: ${apiUrl}`);

                try {
                    const response = await fetch(apiUrl);

                    if (!response.ok) {
                        console.error(`Failed English API: ${response.status}`);
                        continue;
                    }

                    const data = await response.json();

                    let text = "";
                    if (data.text) {
                        text = data.text;
                    } else if (data.verses) {
                        // Fallback just in case text is missing but verses exist
                        text = data.verses.map(v => v.text).join('\n\n');
                    }

                    // Add header
                    chaptersText.push(`### Chapter ${chapter}\n\n${text}`);

                } catch (e) {
                    console.error("Error fetching English API:", e);
                }
            }
        }

        if (chaptersText.length === 0) {
            return new Response(JSON.stringify({
                error: 'Content not found',
                details: 'Failed to retrieve text from source.'
            }), { status: 404, headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            citation: citation,
            text: chaptersText.join('\n\n'),
            source: sourceInfo,
            version: versionInfo
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400'
            }
        });

    } catch (error) {
        console.error('Bible Proxy Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
