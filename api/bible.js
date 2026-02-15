
export const config = {
    runtime: 'edge',
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

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Special casing for books that need spacing or capitalization restoration (basic logic)
function formatBookTitle(str) {
    if (!str) return '';
    // Fix "1samuel" -> "1 Samuel"
    if (str.match(/^\d+[a-z]/)) {
        return str.replace(/(\d+)([a-z])/, '$1 $2').split(' ').map(capitalize).join(' ');
    }
    return str.split(' ').map(capitalize).join(' ');
}

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

            const spanishBook = ENGLISH_TO_SPANISH_REPO[rawBook] || rawBook;
            sourceInfo = 'github/wldeh/bible-api';
            versionInfo = 'Biblia en Español Sencillo';

            for (let chapter = startChapter; chapter <= endChapter; chapter++) {
                const targetUrl = `https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/es-bes/books/${encodeURIComponent(spanishBook)}/chapters/${chapter}.json`;
                console.log(`Fetching Spanish: ${targetUrl}`);

                try {
                    const res = await fetch(targetUrl);
                    if (!res.ok) {
                        console.error(`Failed to fetch Spanish chapter: ${res.status}`);
                        continue;
                    }

                    const data = await res.json();
                    let text = "Text unavailable.";

                    if (data.data && Array.isArray(data.data)) {
                        // Add verse numbers in [1], [2] format
                        // Extract just the verse number from "chapter.verse" format (e.g., "1.5" -> "5")
                        text = data.data.map(v => {
                            const verseNum = v.verse ? v.verse.split('.').pop() : '';
                            return `[${verseNum}] ${v.text || ""}`;
                        }).join('\n\n');
                    }

                    // Header: "### Génesis Capítulo 1"
                    // Use formatting to make "1samuel" -> "1 Samuel"
                    const displayBook = formatBookTitle(spanishBook);
                    chaptersText.push(`### ${displayBook} Capítulo ${chapter}\n\n${text}`);

                } catch (e) {
                    console.error("Error parsing Spanish JSON:", e);
                }
            }

        } else {
            // ENGLISH STRATEGY: wldeh/bible-api (Static JSON, en-kjv)
            // Using same source as Spanish for consistency and verse-by-verse structure

            sourceInfo = 'github/wldeh/bible-api';
            versionInfo = 'King James Version';

            for (let chapter = startChapter; chapter <= endChapter; chapter++) {
                const targetUrl = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/${encodeURIComponent(rawBook.toLowerCase())}/chapters/${chapter}.json`;
                console.log(`Fetching English: ${targetUrl}`);

                try {
                    const res = await fetch(targetUrl);
                    if (!res.ok) {
                        console.error(`Failed to fetch English chapter: ${res.status}`);
                        continue;
                    }

                    const data = await res.json();
                    let text = "Text unavailable.";

                    if (data.data && Array.isArray(data.data)) {
                        // Add verse numbers in [1], [2] format and join with paragraph breaks
                        // Extract just the verse number from "chapter.verse" format (e.g., "1.5" -> "5")
                        text = data.data.map(v => {
                            const verseNum = v.verse ? v.verse.split('.').pop() : '';
                            return `[${verseNum}] ${v.text || ""}`;
                        }).join('\n\n');
                    }

                    // Header: "Genesis Chapter 1"
                    const displayBook = formatBookTitle(rawBook);
                    chaptersText.push(`### ${displayBook} Chapter ${chapter}\n\n${text}`);

                } catch (e) {
                    console.error("Error parsing English JSON:", e);
                }
            }
        }

        if (chaptersText.length === 0) {
            return new Response(JSON.stringify({
                error: 'Content not found',
            }), { status: 404, headers: corsHeaders });
        }

        // Final Clean-up: Remove slashes used in citations citation or text that clutter audio
        // e.g. "Psalm 1 / Psalm 2" -> "Psalm 1  Psalm 2"
        let finalText = chaptersText.join('\n\n');

        // Remove forward slashes globallly (replace with space to prevent 'slash' being read)
        finalText = finalText.replace(/\//g, ' ');

        return new Response(JSON.stringify({
            citation: citation,
            text: finalText,
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
