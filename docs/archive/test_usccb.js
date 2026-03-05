const cheerio = require('cheerio');

fetch('https://bible.usccb.org/bible/readings/030126.cfm')
    .then(r => r.text())
    .then(html => {
        const $ = cheerio.load(html);
        $('h3').each((i, el) => {
            console.log('h3 text:', $(el).text().trim());
        });
        console.log('--- matches ---');
        const matches = $('h3:contains("Alleluia"), h3:contains("alleluia"), h3:contains("Verse Before the"), h3:contains("Verse before the")');
        matches.each((i, el) => {
            console.log('matched:', $(el).text().trim());
        });
    });
