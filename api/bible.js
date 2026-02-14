
export const config = {
    runtime: 'edge',
};

// Map English Book Names (from our App) to:
// 1. bible-api.com (Standard English) - No mapping needed usually, English names work fine.
// 2. wldeh/bible-api Spanish Folders (es-rv09) - Needs "génesis", "1samuel" (lowercase, no spaces, Spanish names)

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
            // Fallback for unexpected formats
            rawBook = citation.split(' ')[0].toLowerCase();
            startChapter = 1;
            endChapter = 1;
        }

        // --- STRATEGY SELECTION ---

        if (lang === 'es') {
            // SPANISH STRATEGY: wldeh/bible-api (Static JSON, Reina Valera 1909)
            // Verified Scheme: { data: [ { text: "..." }, ... ] }

            const spanishBook = ENGLISH_TO_SPANISH_REPO[rawBook] || rawBook;
            const chaptersText = [];

            for (let chapter = startChapter; chapter <= endChapter; chapter++) {
                // Fetch JSON from raw.githubusercontent.com
                // URL: https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/es-rv09/books/{BOOK}/chapters/{CHAPTER}.json
                const targetUrl = `https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/es-rv09/books/${encodeURIComponent(spanishBook)}/chapters/${chapter}.json`;
                console.log(`Fetching Spanish: ${targetUrl}`);

                try {
                    const res = await fetch(targetUrl);
                    if (!res.ok) {
                        console.error(`Failed to fetch Spanish chapter: ${res.status}`);
                        continue;
                    }

                    const data = await res.json();

                    // Strict Parsing based on verified schema
                    let text = "Text unavailable.";

                    if (data.data && Array.isArray(data.data)) {
                        // Join all verse texts
                        text = data.data.map(v => v.text || "").join(' ');
                    } else {
                        // Verification failed or schema changed unexpectedly
                        console.error("Spanish JSON schema mismatch:", JSON.stringify(data).substring(0, 100));
                        text = "Error: Invalid content format.";
                    }

                    chaptersText.push(text);

                } catch (e) {
                    console.error("Error parsing Spanish JSON:", e);
                }
            }

            if (chaptersText.length === 0) {
                return new Response(JSON.stringify({
                    error: 'Content not found (Spanish)',
                    details: 'Failed to retrieve text from repository.'
                }), { status: 404, headers: corsHeaders });
            }

            return new Response(JSON.stringify({
                citation: citation,
                text: chaptersText.join('\n\n'),
                source: 'github/wldeh/bible-api',
                version: 'Reina Valera 1909'
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        } else {
            // ENGLISH STRATEGY: bible-api.com (WEB)

            const apiUrl = `https://bible-api.com/${encodeURIComponent(citation)}?translation=web`;
            console.log(`Fetching English: ${apiUrl}`);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                return new Response(JSON.stringify({ error: 'Failed to fetch English scripture' }), {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const data = await response.json();

            return new Response(JSON.stringify({
                citation: data.reference,
                text: data.text,
                source: 'bible-api.com',
                version: 'World English Bible'
            }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=86400'
                }
            });
        }

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
