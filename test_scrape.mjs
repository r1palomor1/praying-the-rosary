import * as cheerio from 'cheerio';

fetch('https://www.vaticannews.va/en/word-of-the-day/2026/02/22.html')
    .then(r => r.text())
    .then(html => {
        const $ = cheerio.load(html);
        $('h2').each((i, el) => {
            const txt = $(el).text();
            if (/Reading|Gospel|Psalm/i.test(txt)) {
                let $startNode = $(el);
                if ($(el).parent().hasClass('section__head')) {
                    $startNode = $(el).parent();
                }
                console.log('--- raw html candidate ---');
                console.log($startNode.next().html());
            }
        });
    });
