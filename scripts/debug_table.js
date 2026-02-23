const fetch = require('node-fetch');
const data = require('./src/data/bibleInYearPlan.json');

async function test() {
    console.log('| Date | Plan Day | 1st Reading (Title from Server) | 2nd Reading | Psalm/Proverbs (Citation -> App Label) |');
    console.log('|---|---|---|---|---|');

    // Feb 1 to Feb 23 corresponds to Day 1 to Day 23
    for (let d = 1; d <= 23; d++) {
        const item = data.find(i => i.day === d);
        if (!item) continue;

        // Let's just do Psalm/Proverbs as that's the issue
        const cit = item.psalm_proverbs;

        let apiLabel = "Error";
        try {
            // we simulate exactly what the API does for title:
            // "Proverbs 3:1-4" -> Book: Proverbs, Chapter: 3
            // Header returned by API: "### Proverbs 3"
            // App strips "Chapter " and returns: "Proverbs 3"

            // local basic JS simulation of our API logic for the table:
            const match = cit.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?(?:-(\d+))?$/);
            let displayBook = match ? match[1].trim() : cit.split(' ')[0];
            let chapter = match ? match[2] : "1";
            apiLabel = `${displayBook} ${chapter}`; // Our API's header logic (isPsalmOrProverb branch)

        } catch (e) {
            apiLabel = cit;
        }

        const dateStr = `Feb ${d.toString().padStart(2, '0')}`;
        console.log(`| ${dateStr} | Day ${d} | ${item.first_reading} | ${item.second_reading || 'None'} | ${cit} -> **${apiLabel}** |`);
    }
}
test();
