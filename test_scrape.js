const cheerio = require('cheerio');

fetch('https://www.vaticannews.va/en/word-of-the-day/2026/02/22.html')
    .then(r => r.text())
    .then(html => {
        const $ = cheerio.load(html);
        $('h2').each((i, el) => {
            const txt = $(el).text();
            if (txt.includes('Reading') || txt.includes('Gospel') || txt.includes('Psalm')) {
                console.log('===', txt.trim());
                console.log('$(el).next().html() :', $(el).next().html()?.substring(0, 300));
                console.log('$(el).parent().next().html() :', $(el).parent().next().html()?.substring(0, 300));
            }
        });
    });
