// Script to extract header information from all main screens
import { readFileSync } from 'fs';
import { join } from 'path';

const screens = [
    { name: 'Rosary Home', file: 'HomeScreen.tsx', cssFile: 'HomeScreen.css' },
    { name: 'Progress', file: 'ProgressScreen.tsx', cssFile: 'ProgressScreen.css' },
    { name: 'Mysteries', file: 'MysteriesScreen.tsx', cssFile: 'MysteriesScreen.css' },
    { name: 'Prayers', file: 'PrayersScreen.tsx', cssFile: 'PrayersScreen.css' },
    { name: 'Daily Readings', file: 'DailyReadingsScreen.tsx', cssFile: 'DailyReadingsScreen.css' }
];

const results = [];

for (const screen of screens) {
    const tsxPath = join('src/components', screen.file);
    const cssPath = join('src/components', screen.cssFile);

    try {
        const tsxContent = readFileSync(tsxPath, 'utf-8');
        const cssContent = readFileSync(cssPath, 'utf-8');

        // Find h1 or h2 elements
        const h1Match = tsxContent.match(/<h1 className="([^"]+)">([^<]+)</);
        const h2Match = tsxContent.match(/<h2 className="([^"]+)">([^<]+)</);

        const headerMatch = h1Match || h2Match;
        const tag = h1Match ? 'h1' : 'h2';

        if (headerMatch) {
            const className = headerMatch[1];

            // Find CSS for this class
            const cssRegex = new RegExp(`\\.${className}\\s*{([^}]+)}`, 's');
            const cssMatch = cssContent.match(cssRegex);

            let fontSize = 'Not found';
            let fontFamily = 'Not found';
            let fontWeight = 'Not found';
            let color = 'Not found';

            if (cssMatch) {
                const cssBlock = cssMatch[1];
                const fontSizeMatch = cssBlock.match(/font-size:\s*([^;]+)/);
                const fontFamilyMatch = cssBlock.match(/font-family:\s*([^;]+)/);
                const fontWeightMatch = cssBlock.match(/font-weight:\s*([^;]+)/);
                const colorMatch = cssBlock.match(/color:\s*([^;]+)/);

                if (fontSizeMatch) fontSize = fontSizeMatch[1].trim();
                if (fontFamilyMatch) fontFamily = fontFamilyMatch[1].trim();
                if (fontWeightMatch) fontWeight = fontWeightMatch[1].trim();
                if (colorMatch) color = colorMatch[1].trim();
            }

            results.push({
                page: screen.name,
                tag,
                className,
                fontSize,
                fontFamily,
                fontWeight,
                color
            });
        }
    } catch (error) {
        console.error(`Error processing ${screen.name}:`, error.message);
    }
}

// Output as table
console.log('\n| Page | Tag | Class Name | Font Size | Font Family | Font Weight | Color |');
console.log('|------|-----|------------|-----------|-------------|-------------|-------|');
for (const r of results) {
    console.log(`| ${r.page} | ${r.tag} | ${r.className} | ${r.fontSize} | ${r.fontFamily} | ${r.fontWeight} | ${r.color} |`);
}
