const https = require('https');
const fs = require('fs');

https.get('https://www.vaticannews.va/en/word-of-the-day/2026/02/22.html', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('vatican.html', data);
        console.log('HTML saved to vatican.html');
    });
}).on('error', err => {
    console.error("Error: ", err.message);
});
