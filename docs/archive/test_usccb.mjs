import * as cheerio from 'cheerio';

fetch('https://bible.usccb.org/bible/readings/030126.cfm')
    .then(r => r.text())
    .then(html => {
        const $ = cheerio.load(html);
        console.log('--- HTML ---');
        const header = $('h3:contains("Alleluia"), h3:contains("alleluia"), h3:contains("Verse Before the"), h3:contains("Verse before the")').first();
        if (!header.length) return console.log('header not found');

        const parent = header.parent();
        if (parent.hasClass('content-header')) {
            console.log('Has content-header');
            const contentBody = parent.next('.content-body');
            console.log('contentBody length', contentBody.length);
            console.log('contentBody HTML:\n', contentBody.html());

            let cleanText = (element) => {
                const clone = element.clone();
                clone.find('br').replaceWith('\n');
                clone.find('p').each((i, el) => {
                    $(el).replaceWith($(el).text() + '\n\n');
                });
                let text = clone.text().trim();
                text = text.replace(/[ \t\u00A0]+/g, ' ');
                return text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line)
                    .join('\n');
            };
            console.log('RESULT OF CLEAN TEXT:');
            console.log(cleanText(contentBody));
        }
    });
