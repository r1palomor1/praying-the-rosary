import * as cheerio from 'cheerio';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    try {
        const url = new URL(request.url);
        const citation = url.searchParams.get('citation');
        const lang = url.searchParams.get('lang') || 'en';

        if (!citation) {
            return new Response(JSON.stringify({ error: 'Citation parameter required (e.g., "Genesis 1-2")' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse citation: "Genesis 1-2" or "Psalm 19"
        const match = citation.match(/^(.+?)\s+(\d+)(?:-(\d+))?/);
        if (!match) {
            return new Response(JSON.stringify({ error: 'Invalid citation format' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const book = match[1].trim();
        const startChapter = parseInt(match[2]);
        const endChapter = match[3] ? parseInt(match[3]) : startChapter;

        // Convert book name to USCCB slug
        const bookSlug = book.toLowerCase().replace(/\s+/g, '-');
        const langPath = lang === 'es' ? '/es' : '';

        // Fetch all chapters
        const chapters = [];
        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
            const targetUrl = `https://bible.usccb.org${langPath}/bible/${bookSlug}/${chapter}`;

            try {
                const response = await fetch(targetUrl);
                if (!response.ok) {
                    console.error(`Failed to fetch ${book} ${chapter}: ${response.status}`);
                    continue;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                // Extract scripture content
                const contentBody = $('.content-body');
                if (contentBody.length === 0) {
                    console.error(`No content found for ${book} ${chapter}`);
                    continue;
                }

                // Clean up the content
                contentBody.find('sup').remove(); // Remove verse numbers
                contentBody.find('.footnote').remove(); // Remove footnotes
                contentBody.find('a').each((i, el) => {
                    $(el).replaceWith($(el).text()); // Remove links but keep text
                });

                const text = contentBody.text()
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .replace(/\[\s*\*\s*\]/g, '') // Remove asterisks
                    .trim();

                chapters.push({
                    chapter,
                    text
                });
            } catch (err) {
                console.error(`Error fetching ${book} ${chapter}:`, err);
            }
        }

        if (chapters.length === 0) {
            return new Response(JSON.stringify({
                error: 'No content found',
                citation,
                book: bookSlug
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Combine all chapters
        const combinedText = chapters.map(c => c.text).join('\n\n');

        return new Response(JSON.stringify({
            citation,
            book,
            chapters: chapters.map(c => c.chapter),
            text: combinedText
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
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
