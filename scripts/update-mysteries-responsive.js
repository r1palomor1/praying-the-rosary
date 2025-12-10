import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MYSTERIES_FILE = join(__dirname, '../src/data/mysteries.ts');

async function updateMysteriesData() {
    console.log('📝 Updating mysteries.ts with responsive image URLs...\n');

    try {
        let content = await readFile(MYSTERIES_FILE, 'utf-8');

        // Replace all imageUrl: '/images/mysteries/FILENAME.webp' with responsive object
        content = content.replace(
            /imageUrl: '\/images\/mysteries\/([^']+)\.webp'/g,
            (match, filename) => {
                return `imageUrl: {\n                sm: '/images/mysteries/${filename}-sm.webp',\n                md: '/images/mysteries/${filename}-md.webp',\n                lg: '/images/mysteries/${filename}-lg.webp'\n            }`;
            }
        );

        await writeFile(MYSTERIES_FILE, content, 'utf-8');

        console.log('✅ Successfully updated mysteries.ts!');
        console.log('   All 20 mysteries now use responsive images\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateMysteriesData();
