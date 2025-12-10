import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MYSTERY_SCREEN_FILE = join(__dirname, '../src/components/MysteryScreen.tsx');

async function updateMysteryScreen() {
    console.log('📝 Updating MysteryScreen.tsx to use ResponsiveImage component...\n');

    try {
        let content = await readFile(MYSTERY_SCREEN_FILE, 'utf-8');

        // Replace all <img src={...imageUrl...} patterns with <ResponsiveImage imageUrl={...} />
        // Pattern 1: src={decadeInfo?.imageUrl || step.imageUrl}
        content = content.replace(
            /<img\s+src=\{(decadeInfo\?\.imageUrl \|\| step\.imageUrl)\}\s+alt=\{([^}]+)\}\s+className="([^"]+)"\s+loading="lazy"\s+decoding="async"\s*\/>/g,
            '<ResponsiveImage imageUrl={$1} alt={$2} className="$3" loading="lazy" />'
        );

        // Pattern 2: src={step.imageUrl}
        content = content.replace(
            /<img\s+src=\{step\.imageUrl\}\s+alt=\{([^}]+)\}\s+className="([^"]+)"\s+loading="lazy"\s+decoding="async"\s*\/>/g,
            '<ResponsiveImage imageUrl={step.imageUrl} alt={$1} className="$2" loading="lazy" />'
        );

        // Pattern 3: src={decadeInfo?.imageUrl || (step as any).imageUrl}
        content = content.replace(
            /<img\s+src=\{(decadeInfo\?\.imageUrl \|\| \(step as any\)\.imageUrl)\}\s+alt=\{([^}]+)\}\s+className="([^"]+)"\s+loading="lazy"\s+decoding="async"\s*\/>/g,
            '<ResponsiveImage imageUrl={$1} alt={$2} className="$3" loading="lazy" />'
        );

        // Pattern 4: src={currentStep.imageUrl}
        content = content.replace(
            /<img\s+src=\{currentStep\.imageUrl\}\s+alt=\{([^}]+)\}\s+className="([^"]+)"\s+loading="lazy"\s+decoding="async"\s*\/>/g,
            '<ResponsiveImage imageUrl={currentStep.imageUrl} alt={$1} className="$2" loading="lazy" />'
        );

        // Pattern 5: src={decadeInfo.imageUrl}
        content = content.replace(
            /<img\s+src=\{decadeInfo\.imageUrl\}\s+alt=\{([^}]+)\}\s+className="([^"]+)"\s+loading="lazy"\s+decoding="async"\s*\/>/g,
            '<ResponsiveImage imageUrl={decadeInfo.imageUrl} alt={$1} className="$2" loading="lazy" />'
        );

        await writeFile(MYSTERY_SCREEN_FILE, content, 'utf-8');

        console.log('✅ Successfully updated MysteryScreen.tsx!');
        console.log('   All <img> tags replaced with <ResponsiveImage> component\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateMysteryScreen();
