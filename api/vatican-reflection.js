import * as cheerio from 'cheerio';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);
        const dateParam = url.searchParams.get('date'); // YYYY-MM-DD format
        const lang = url.searchParams.get('lang') || 'en';

        if (!dateParam) {
            return new Response(JSON.stringify({ error: 'Date parameter required (YYYY-MM-DD)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse date
        const [year, month, day] = dateParam.split('-');

        // Build Vatican News URL
        const baseUrl = lang === 'es'
            ? 'https://www.vaticannews.va/es/evangelio-de-hoy'
            : 'https://www.vaticannews.va/en/word-of-the-day';

        const targetUrl = `${baseUrl}/${year}/${month}/${day}.html`;

        const response = await fetch(targetUrl);

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch from Vatican News' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const result = {
            readings: [],
            reflection: null
        };

        // Find all h2 headers in the page
        $('h2').each((i, h2) => {
            const $h2 = $(h2);
            const title = $h2.text().trim();

            // Check if this is a reading header
            if (title.includes('Reading of the day') || title.includes('Lectura del Día') ||
                title.includes('Gospel of the day') || title.includes('Evangelio del Día') ||
                title.includes('Psalm') || title.includes('Salmo')) {

                // Get content after this h2
                let content = '';
                let $next = $h2.next();

                while ($next.length && !$next.is('h2')) {
                    if ($next.is('p')) {
                        content += $next.html() + '\n\n';
                    }
                    $next = $next.next();
                }

                if (content.trim()) {
                    result.readings.push({
                        title: title,
                        text: content.trim()
                    });
                }
            }

            // Check for papal reflection
            if (title.includes('words of the Popes') || title.includes('palabras de los Papas')) {
                let content = '';
                let $next = $h2.next();

                while ($next.length && !$next.is('h2')) {
                    if ($next.is('p')) {
                        const text = $next.text().trim();
                        if (text && text !== '\u00a0') {
                            content += text + '\n\n';
                        }
                    }
                    $next = $next.next();
                }

                if (content.trim()) {
                    result.reflection = {
                        title: lang === 'es' ? 'Las Palabras de los Papas' : 'The Words of the Popes',
                        content: content.trim()
                    };
                }
            }
        });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
