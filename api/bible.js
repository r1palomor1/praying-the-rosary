import * as cheerio from 'cheerio';

export const config = {
    runtime: 'edge',
};

// Map book names to eBible.org 3-letter codes
// Codes based on standard USFM/eBible filenames: GEN01.htm, 1MA01.htm, etc.
const BOOK_MAPPINGS = {
    // Pentateuch
    'genesis': 'GEN',
    'exodus': 'EXO',
    'leviticus': 'LEV',
    'numbers': 'NUM',
    'deuteronomy': 'DEU',
    // History
    'joshua': 'JOS',
    'judges': 'JDG',
    'ruth': 'RUT',
    '1 samuel': '1SA',
    '2 samuel': '2SA',
    '1 kings': '1KI',
    '2 kings': '2KI',
    '1 chronicles': '1CH',
    '2 chronicles': '2CH',
    'ezra': 'EZR',
    'nehemiah': 'NEH',
    'tobit': 'TOB',
    'judith': 'JDT',
    'esther': 'EST',
    '1 maccabees': '1MA',
    '2 maccabees': '2MA',
    // Wisdom
    'job': 'JOB',
    'psalms': 'PSA',
    'psalm': 'PSA',
    'proverbs': 'PRO',
    'ecclesiastes': 'ECC',
    'song of solomon': 'SNG',
    'song of songs': 'SNG',
    'wisdom': 'WIS',
    'sirach': 'SIR',
    'ecclesiasticus': 'SIR',
    // Prophecy
    'isaiah': 'ISA',
    'jeremiah': 'JER',
    'lamentations': 'LAM',
    'baruch': 'BAR',
    'ezekiel': 'EZK',
    'daniel': 'DAN',
    'hosea': 'HOS',
    'joel': 'JOL',
    'amos': 'AMO',
    'obadiah': 'OBA',
    'jonah': 'JON',
    'micah': 'MIC',
    'nahum': 'NAM',
    'habakkuk': 'HAB',
    'zephaniah': 'ZEP',
    'haggai': 'HAG',
    'zechariah': 'ZEC',
    'malachi': 'MAL',
    // New Testament
    'matthew': 'MAT',
    'mark': 'MRK',
    'luke': 'LUK',
    'john': 'JHN',
    'acts': 'ACT',
    'romans': 'ROM',
    '1 corinthians': '1CO',
    '2 corinthians': '2CO',
    'galatians': 'GAL',
    'ephesians': 'EPH',
    'philippians': 'PHP',
    'colossians': 'COL',
    '1 thessalonians': '1TH',
    '2 thessalonians': '2TH',
    '1 timothy': '1TI',
    '2 timothy': '2TI',
    'titus': 'TIT',
    'philemon': 'PHM',
    'hebrews': 'HEB',
    'james': 'JAS',
    '1 peter': '1PE',
    '2 peter': '2PE',
    '1 john': '1JN',
    '2 john': '2JN',
    '3 john': '3JN',
    'jude': 'JUD',
    'revelation': 'REV'
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

        // Parse citation: "Genesis 1-2" -> Book: Genesis, Start: 1, End: 2
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

        // 1. Map Book Name to 3-Letter Code
        const bookCode = BOOK_MAPPINGS[rawBook];
        if (!bookCode) {
            return new Response(JSON.stringify({ error: `Book not found: ${rawBook}` }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. Select Version (eBible.org project code)
        // en -> eng-web (World English Bible)
        // es -> spablm (Santa Biblia libre para el mundo)
        const version = lang === 'es' ? 'spablm' : 'eng-web';

        const chapters = [];
        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
            // 3. Construct URL
            // Format: https://ebible.org/{version}/{BOOK}{CHAPTER}.htm
            // Important: Chapters are usually 2 digits (01, 10). Psalms are 3 digits (001, 119).
            let chapterStr;
            if (bookCode === 'PSA') {
                chapterStr = chapter.toString().padStart(3, '0');
            } else {
                chapterStr = chapter.toString().padStart(2, '0');
            }

            const targetUrl = `https://ebible.org/${version}/${bookCode}${chapterStr}.htm`;
            console.log(`Fetching: ${targetUrl}`);

            try {
                const response = await fetch(targetUrl);
                if (!response.ok) {
                    console.error(`Failed to fetch ${targetUrl}: ${response.status}`);
                    continue;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                // 4. Extract Text

                // Remove navigation links (often "Next", "Previous" at top/bottom)
                $('.nav').remove();
                $('.chapnav').remove();

                // Remove header/footer nonsense
                $('div.toc').remove();
                $('div.footer').remove();

                // Remove verse numbers (often in <span class="v">)
                $('.v').remove();

                // Remove footnotes (often <span class="note"> or similar)
                $('.note').remove();
                $('.notemark').remove();

                // Get textual content
                let text = $('body').text();

                // Text often has excessive whitespace/newlines from HTML formatting
                text = text.replace(/\s+/g, ' ').trim();

                chapters.push({
                    chapter,
                    text
                });

            } catch (err) {
                console.error(`Error processing ${targetUrl}:`, err);
            }
        }

        if (chapters.length === 0) {
            return new Response(JSON.stringify({
                error: 'No content found',
                citation,
                book: rawBook,
                version
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const combinedText = chapters.map(c => c.text).join('\n\n');

        return new Response(JSON.stringify({
            citation,
            book: rawBook,
            chapters: chapters.map(c => c.chapter),
            text: combinedText,
            source: 'ebible.org',
            version: version
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
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
