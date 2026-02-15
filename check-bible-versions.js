
const fetch = require('node-fetch'); // Assuming node env or standard fetch available in recent node

// Versions to test
const versions = ['web', 'kjv', 'bbe', 'oeb-us', 'oeb-cw', 'webbe'];
const verse = 'Genesis 2:4'; // "Likely context for Yahweh/LORD difference"

(async () => {
    console.log(`Checking verse: ${verse}\n`);

    for (const v of versions) {
        try {
            const url = `https://bible-api.com/${encodeURIComponent(verse)}?translation=${v}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.log(`[${v}]: Failed (${res.status})`);
                continue;
            }
            const data = await res.json();
            const text = data.text.trim().replace(/\n/g, ' ');
            console.log(`[${v}]: ${text}`);
        } catch (e) {
            console.log(`[${v}]: Error ${e.message}`);
        }
    }
})();
