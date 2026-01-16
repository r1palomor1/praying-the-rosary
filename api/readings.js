import * as cheerio from 'cheerio';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);
        const dateParam = url.searchParams.get('date');
        const lang = url.searchParams.get('lang') || 'en';

        if (!dateParam) {
            return new Response(JSON.stringify({ error: 'Date parameter required (MMDDYY)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Determine URL and headers based on language
        let targetUrl;
        let sectionsConfig;

        if (lang === 'es') {
            targetUrl = `https://bible.usccb.org/es/bible/lecturas/${dateParam}.cfm`;
            sectionsConfig = [
                { title: 'Primera Lectura', selector: 'h3:contains("Primera Lectura"), h3:contains("Lectura I")' },
                { title: 'Segunda Lectura', selector: 'h3:contains("Segunda Lectura"), h3:contains("Lectura II")' },
                { title: 'Salmo Responsorial', selector: 'h3:contains("Salmo Responsorial"), h3:contains("Salmo")' },
                { title: 'Evangelio', selector: 'h3:contains("Evangelio")' },
                { title: 'Aclamación antes del Evangelio', selector: 'h3:contains("Aclamación"), h3:contains("Aleluya")' }
            ];
        } else {
            targetUrl = `https://bible.usccb.org/bible/readings/${dateParam}.cfm`;
            sectionsConfig = [
                { title: 'Reading I', selector: 'h3:contains("Reading I")' },
                { title: 'Reading II', selector: 'h3:contains("Reading II")' },
                { title: 'Responsorial Psalm', selector: 'h3:contains("Responsorial Psalm")' },
                { title: 'Gospel', selector: 'h3:contains("Gospel")' },
                { title: 'Alleluia', selector: 'h3:contains("Alleluia")' }
            ];
        }

        const response = await fetch(targetUrl);

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch readings from USCCB' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const readings = [];

        sectionsConfig.forEach(section => {
            const header = $(section.selector).first();
            if (header.length > 0) {
                // Get the scripture reference
                let citation = '';
                // Check immediate next, or inside header
                const nextElement = header.next();
                if (nextElement.find('a').length > 0) {
                    citation = nextElement.find('a').first().text().trim();
                } else if (header.find('a').length > 0) {
                    citation = header.find('a').first().text().trim();
                } else {
                    // Sometimes in Spanish it might be formatted differently, check standard locations
                    const potentialCitation = header.next().text().trim();
                    if (potentialCitation.length < 50 && /\d/.test(potentialCitation)) {
                        citation = potentialCitation;
                    }
                }

                // Collect text until the next h3 or end of container
                let content = [];
                let current = header.next();

                // Skip the citation line if we just grabbed it/it seems to be the citation block
                if ((current.find('a').length > 0 && current.text().trim() === citation) ||
                    current.text().trim() === citation) {
                    current = current.next();
                }

                while (current.length > 0 && current.prop('tagName') !== 'H3' && !current.hasClass('content-header')) {
                    const text = current.text().trim();
                    if (text) {
                        content.push(text);
                    }
                    current = current.next();
                }

                // If content is empty but header exists, might be different structure. 
                // But for now, we push what we found.
                if (content.length > 0) {
                    readings.push({
                        title: section.title,
                        citation: citation,
                        text: content.join('\n\n')
                    });
                }
            }
        });

        // Fallback: Generic scrape if specific parsing fails entirely
        if (readings.length === 0) {
            const mainText = $('.content-body').text().trim();
            if (mainText) {
                readings.push({ title: lang === 'es' ? 'Lecturas del Día' : 'Daily Readings', text: mainText });
            }
        }

        return new Response(JSON.stringify({
            date: dateParam,
            source: targetUrl,
            readings
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
