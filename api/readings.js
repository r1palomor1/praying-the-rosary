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
                { title: 'Primera Lectura', selector: 'h3:contains("Primera Lectura"), h3:contains("Lectura I"), h3:contains("Lectura 1")' },
                { title: 'Segunda Lectura', selector: 'h3:contains("Segunda Lectura"), h3:contains("Lectura II"), h3:contains("Lectura 2")' },
                { title: 'Salmo Responsorial', selector: 'h3:contains("Salmo Responsorial"), h3:contains("Salmo")' },
                { title: 'Aclamación antes del Evangelio', selector: 'h3:contains("Aclamación"), h3:contains("Aleluya")' },
                { title: 'Evangelio', selector: 'h3:contains("Evangelio")' },
            ];
        } else {
            targetUrl = `https://bible.usccb.org/bible/readings/${dateParam}.cfm`;
            sectionsConfig = [
                { title: 'Reading I', selector: 'h3:contains("Reading I"), h3:contains("Reading 1")' },
                { title: 'Reading II', selector: 'h3:contains("Reading II"), h3:contains("Reading 2")' },
                { title: 'Responsorial Psalm', selector: 'h3:contains("Responsorial Psalm")' },
                { title: 'Alleluia', selector: 'h3:contains("Alleluia")' },
                { title: 'Gospel', selector: 'h3:contains("Gospel")' },
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

        // Extract Liturgical Day Title
        let dayTitle = '';
        $('h2').each((i, el) => {
            const t = $(el).text().trim();
            // Simple filter to skip menu items
            if (!t.includes('Menu') && !t.includes('Navigation') && !t.includes('Get the Daily') && !t.includes('Dive into') && !dayTitle) {
                dayTitle = t;
            }
        });

        // Extract Lectionary
        let lectionary = '';
        const lectionaryNode = $('*:contains("Lectionary:")').last();
        if (lectionaryNode.length > 0) {
            lectionary = lectionaryNode.text().trim();
        }

        sectionsConfig.forEach(section => {
            const header = $(section.selector).first();
            if (header.length > 0) {
                let citation = '';
                let text = '';
                const parent = header.parent();

                // Check for modern USCCB structure: .content-header + .content-body siblings
                if (parent.hasClass('content-header')) {
                    const link = parent.find('a').first();
                    if (link.length > 0) {
                        citation = link.text().trim();
                    } else {
                        // Fallback: Try to remove the title from the header text to find citation
                        const fullHeaderText = parent.text().trim();
                        citation = fullHeaderText.replace(header.text().trim(), '').trim();
                    }

                    const contentBody = parent.next('.content-body');
                    if (contentBody.length > 0) {
                        text = contentBody.text().trim();
                    }
                }
                else {
                    // Fallback for older/flat structure
                    const nextElement = header.next();
                    if (nextElement.find('a').length > 0) {
                        citation = nextElement.find('a').first().text().trim();
                    } else if (header.find('a').length > 0) {
                        citation = header.find('a').first().text().trim();
                    }

                    let content = [];
                    let current = header.next();

                    if (current.text().trim() === citation) current = current.next();

                    while (current.length > 0 && current.prop('tagName') !== 'H3' && !current.hasClass('content-header')) {
                        const t = current.text().trim();
                        if (t) content.push(t);
                        current = current.next();
                    }
                    text = content.join('\n\n');
                }

                if (text) {
                    readings.push({
                        title: section.title,
                        citation: citation,
                        text: text
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
            title: dayTitle,
            lectionary: lectionary,
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
