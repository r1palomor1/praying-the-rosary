import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGES_DIR = join(__dirname, '../public/images/mysteries');

// Responsive image sizes
const SIZES = {
    sm: { width: 640, suffix: '-sm' },   // Mobile
    md: { width: 1024, suffix: '-md' },  // Tablet
    lg: { width: 1920, suffix: '-lg' }   // Desktop
};

async function generateResponsiveImages() {
    console.log('🖼️  Generating responsive images...\n');

    try {
        const files = await readdir(IMAGES_DIR);
        const webpFiles = files.filter(f => f.endsWith('.webp') && !f.includes('-sm') && !f.includes('-md') && !f.includes('-lg'));

        console.log(`Found ${webpFiles.length} original WebP images\n`);

        let totalGenerated = 0;
        let totalSkipped = 0;

        for (const file of webpFiles) {
            const filePath = join(IMAGES_DIR, file);
            const { name } = parse(file);

            console.log(`Processing: ${file}`);

            // Generate each size
            for (const [sizeName, config] of Object.entries(SIZES)) {
                const outputFileName = `${name}${config.suffix}.webp`;
                const outputPath = join(IMAGES_DIR, outputFileName);

                // Check if already exists
                try {
                    await stat(outputPath);
                    console.log(`  ⏭️  ${sizeName} (${config.width}px) - Already exists, skipping`);
                    totalSkipped++;
                    continue;
                } catch {
                    // File doesn't exist, generate it
                }

                // Generate resized image
                const image = sharp(filePath);
                const metadata = await image.metadata();

                await image
                    .resize(config.width, null, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: 90 })
                    .toFile(outputPath);

                const stats = await stat(outputPath);
                const sizeKB = Math.round(stats.size / 1024);

                console.log(`  ✅ ${sizeName} (${config.width}px) - ${sizeKB} KB`);
                totalGenerated++;
            }

            console.log('');
        }

        console.log('━'.repeat(50));
        console.log(`\n✅ Generation complete!`);
        console.log(`   Generated: ${totalGenerated} images`);
        console.log(`   Skipped: ${totalSkipped} images (already exist)`);
        console.log(`\n💡 Next step: Update mysteries.ts to use responsive images\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

generateResponsiveImages();
