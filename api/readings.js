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
                { title: 'Primera Lectura', selector: 'h3:contains("Primera lectura"), h3:contains("Primera Lectura"), h3:contains("Lectura I"), h3:contains("Lectura 1")' },
                { title: 'Segunda Lectura', selector: 'h3:contains("Segunda lectura"), h3:contains("Segunda Lectura"), h3:contains("Lectura II"), h3:contains("Lectura 2")' },
                { title: 'Salmo Responsorial', selector: 'h3:contains("Salmo responsorial"), h3:contains("Salmo Responsorial"), h3:contains("Salmo")' },
                { title: 'Aclamación antes del Evangelio', selector: 'h3:contains("Aclamación antes del Evangelio"), h3:contains("Aclamación antes del evangelio"), h3:contains("Aclamación"), h3:contains("Aleluya")' },
                { title: 'Evangelio', selector: 'h3:contains("Evangelio"):not(:contains("Aclamación")), h3:contains("evangelio"):not(:contains("Aclamación"))' },
            ];
        } else {
            targetUrl = `https://bible.usccb.org/bible/readings/${dateParam}.cfm`;
            sectionsConfig = [
                { title: 'Reading I', selector: 'h3:contains("Reading I"), h3:contains("Reading 1"), h3:contains("reading I"), h3:contains("reading 1")' },
                { title: 'Reading II', selector: 'h3:contains("Reading II"), h3:contains("Reading 2"), h3:contains("reading II"), h3:contains("reading 2")' },
                { title: 'Responsorial Psalm', selector: 'h3:contains("Responsorial Psalm"), h3:contains("responsorial psalm"), h3:contains("Responsorial psalm")' },
                { title: 'Alleluia', selector: 'h3:contains("Alleluia"), h3:contains("alleluia")' },
                { title: 'Gospel', selector: 'h3:contains("Gospel"), h3:contains("gospel")' },
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
        // Usually the first substantial h2 in the content area
        let dayTitle = '';
        $('h2').each((i, el) => {
            const t = $(el).text().trim();
            const lower = t.toLowerCase();
            // Stricter filtering
            if (!lower.includes('menu') &&
                !lower.includes('navigation') &&
                !lower.includes('daily readings') &&
                !lower.includes('dive into') &&
                !lower.includes('search') &&
                !dayTitle) {
                dayTitle = t;
            }
        });

        // Helper to clean text and preserve formatting
        const cleanText = ($element) => {
            const clone = $element.clone();

            // Replace breaks with newlines
            clone.find('br').replaceWith('\n');
            clone.find('p').each((i, el) => {
                $(el).replaceWith($(el).text() + '\n\n');
            });

            // Get text and normalize whitespace
            // 1. Replace multiple spaces/tabs with single space (but keep newlines)
            // 2. Fix weird spacing around punctuation if needed
            let text = clone.text().trim();

            // Normalize non-newline whitespace
            text = text.replace(/[ \t\u00A0]+/g, ' ');

            // Ensure proper line breaks
            return text.split('\n')
                .map(line => line.trim())
                .filter(line => line) // Remove completely empty lines? Maybe leave one for spacing
                .join('\n');
        };

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
                    // Try to find citation in .address div first
                    const addressDiv = parent.find('.address').first();
                    if (addressDiv.length > 0) {
                        citation = addressDiv.text().trim();
                    } else {
                        // Fallback: Try to find link
                        const link = parent.find('a').first();
                        if (link.length > 0) {
                            citation = link.text().trim();
                        } else {
                            // Last fallback: Try to remove the title from the header text to find citation
                            const fullHeaderText = parent.text().trim();
                            citation = fullHeaderText.replace(header.text().trim(), '').trim();
                        }
                    }

                    const contentBody = parent.next('.content-body');
                    if (contentBody.length > 0) {
                        text = cleanText(contentBody);
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
                        // Use cleanText on individual chunks if they are blocks, or just text()
                        // Since we are iterating siblings, they are likely p or div
                        const t = cleanText(current);
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
