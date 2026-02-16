
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

        // Handle cases like "Psalm/Proverbs 19" - take only the first book
        if (rawBook.includes('/')) {
            rawBook = rawBook.split('/')[0].trim();
        }

        // Normalize singular to plural for API folder names
        if (rawBook === 'psalm') {
            rawBook = 'psalms';
        }

        const chaptersText = [];
        let sourceInfo = lang === 'es' ? 'github/wldeh/bible-api (Layout: KJV)' : 'github/wldeh/bible-api';
        let versionInfo = lang === 'es' ? 'Biblia en Español Sencillo' : 'King James Version';

        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
            // 1. ALWAYS Fetch English (Reference for Layout)
            // We use English KJV to determine paragraph breaks ("¶") and unique verses
            const enUrl = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/${encodeURIComponent(rawBook.toLowerCase())}/chapters/${chapter}.json`;
            console.log(`[Reference] Fetching English: ${enUrl}`);

            let enData = null;
            let paragraphStarts = new Set(); // Verse numbers that start a new paragraph

            try {
                const res = await fetch(enUrl);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && Array.isArray(json.data)) {
                        // Deduplicate English Data first
                        enData = deduplicateVerses(json.data);

                        // Extract Blueprint
                        enData.forEach((v, index) => {
                            // If verse text has '¶' OR it's the first verse, it marks a paragraph start
                            if ((v.text && v.text.includes('¶')) || index === 0) {
                                const verseNum = getVerseNumber(v);
                                if (verseNum) paragraphStarts.add(verseNum);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching English reference:", e);
            }

            // 2. Process Content based on Language
            let text = "Text unavailable.";
            let displayBook = "";

            if (lang === 'es') {
                // --- SPANISH MODE ---
                const spanishBook = ENGLISH_TO_SPANISH_REPO[rawBook] || rawBook;
                displayBook = formatBookTitle(spanishBook);

                const esUrl = `https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/es-bes/books/${encodeURIComponent(spanishBook)}/chapters/${chapter}.json`;
                console.log(`Fetching Spanish Content: ${esUrl}`);

                try {
                    const res = await fetch(esUrl);
                    if (res.ok) {
                        const json = await res.json();
                        if (json.data && Array.isArray(json.data)) {
                            const esVerses = deduplicateVerses(json.data);

                            // Safety Guard: Verse Count Mismatch
                            // If verse counts differ, paragraph alignment might be wrong. Fallback to list.
                            if (enData && esVerses.length !== enData.length) {
                                console.warn(`[Bible API] Verse mismatch for ${spanishBook} ${chapter} (ES: ${esVerses.length}, EN: ${enData.length}). Disabling blueprint.`);
                                paragraphStarts.clear();
                            }

                            // Apply English Blueprint to Spanish Verses
                            const paragraphs = [];
                            let currentParagraph = "";

                            esVerses.forEach((v, index) => {
                                const verseNum = getVerseNumber(v);
                                const textContent = cleanVerseText(v.text, false); // Don't strip symbols, Spanish doesn't have them
                                const formattedVerse = `[${verseNum}] ${textContent}`;

                                // Check if this verse should start a paragraph based on English Blueprint
                                // Fallback: If no blueprint (English failed), default to first verse only
                                const shouldStart = (paragraphStarts.size > 0 && paragraphStarts.has(verseNum)) || index === 0;

                                if (shouldStart) {
                                    if (currentParagraph) paragraphs.push(currentParagraph);
                                    currentParagraph = formattedVerse;
                                } else {
                                    currentParagraph += " " + formattedVerse;
                                }
                            });
                            if (currentParagraph) paragraphs.push(currentParagraph);

                            text = paragraphs.join('\n\n');
                        }
                    } else {
                        console.error(`Failed to fetch Spanish: ${res.status}`);
                    }
                } catch (e) {
                    console.error("Error fetching Spanish content:", e);
                }

            } else {
                // --- ENGLISH MODE ---
                displayBook = formatBookTitle(rawBook);

                if (enData) {
                    const paragraphs = [];
                    let currentParagraph = "";

                    enData.forEach((v, index) => {
                        const verseNum = getVerseNumber(v);
                        const textContent = cleanVerseText(v.text, true); // Strip '¶' for display
                        const formattedVerse = `[${verseNum}] ${textContent}`;

                        // Logic: Does this verse HAVE a marker in raw text?
                        const shouldStart = (v.text && v.text.includes('¶')) || index === 0;

                        if (shouldStart) {
                            if (currentParagraph) paragraphs.push(currentParagraph);
                            currentParagraph = formattedVerse;
                        } else {
                            currentParagraph += " " + formattedVerse;
                        }
                    });
                    if (currentParagraph) paragraphs.push(currentParagraph);

                    text = paragraphs.join('\n\n');
                }
            }

            // Header Construction
            const isPsalmOrProverb = displayBook.toLowerCase().includes('salmos') ||
                displayBook.toLowerCase().includes('proverbios') ||
                rawBook === 'psalms' || rawBook === 'proverbs';

            // Note: Spanish BES uses "Salmos 1" not "Salmos Capítulo 1" usually, logic preserved
            const header = isPsalmOrProverb
                ? `### ${displayBook} ${chapter}\n\n${text}`
                : `### ${displayBook} ${lang === 'es' ? 'Capítulo' : 'Chapter'} ${chapter}\n\n${text}`;

            chaptersText.push(header);
        }

        if (chaptersText.length === 0) {
            return new Response(JSON.stringify({
                error: 'Content not found',
            }), { status: 404, headers: corsHeaders });
        }

        let finalText = chaptersText.join('\n\n');
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
                'Cache-Control': 'public, max-age=0, s-maxage=86400, must-revalidate'
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

// --- HELPER FUNCTIONS ---

function getVerseNumber(v) {
    if (!v.verse) return "1";
    // Handle "1.5" -> "5" or just "5"
    return v.verse.split('.').pop();
}

function deduplicateVerses(data) {
    const seen = new Set();
    return data.filter(v => {
        const num = getVerseNumber(v);
        if (seen.has(num)) return false;
        seen.add(num);
        return true;
    });
}

function cleanVerseText(text, isEnglish) {
    if (!text) return "";
    let clean = text;
    // Remove KJV footnotes
    clean = clean.replace(/\d+\.\d+\s+.*$/g, '');
    // Remove paragraph symbols if present (we used them for logic already)
    if (isEnglish) {
        clean = clean.replace(/¶/g, '');
    }
    // Clean whitespace
    return clean.replace(/\s+/g, ' ').trim();
}
