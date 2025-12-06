import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../public/images/mysteries');
const outputDir = inputDir; // Same directory

// Quality setting for WebP conversion
const WEBP_QUALITY = 90;

async function convertImagesToWebP() {
    console.log('🖼️  Starting image conversion to WebP...\n');

    // Get all PNG and JPG files
    const files = fs.readdirSync(inputDir).filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
    );

    console.log(`Found ${files.length} images to process\n`);

    const results = {
        converted: [],
        skipped: [],
        errors: []
    };

    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputFile = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const outputPath = path.join(outputDir, outputFile);

        // Skip if WebP already exists
        if (fs.existsSync(outputPath)) {
            console.log(`⏭️  Skipping ${file} (WebP already exists)`);
            results.skipped.push(file);
            continue;
        }

        try {
            const inputStats = fs.statSync(inputPath);
            const inputSizeKB = (inputStats.size / 1024).toFixed(2);

            await sharp(inputPath)
                .webp({ quality: WEBP_QUALITY })
                .toFile(outputPath);

            const outputStats = fs.statSync(outputPath);
            const outputSizeKB = (outputStats.size / 1024).toFixed(2);
            const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

            console.log(`✅ ${file}`);
            console.log(`   ${inputSizeKB} KB → ${outputSizeKB} KB (${savings}% smaller)\n`);

            results.converted.push({
                original: file,
                webp: outputFile,
                originalSize: inputSizeKB,
                webpSize: outputSizeKB,
                savings: savings
            });
        } catch (error) {
            console.error(`❌ Error converting ${file}:`, error.message);
            results.errors.push({ file, error: error.message });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONVERSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Converted: ${results.converted.length} images`);
    console.log(`⏭️  Skipped: ${results.skipped.length} images`);
    console.log(`❌ Errors: ${results.errors.length} images`);

    if (results.converted.length > 0) {
        const totalOriginal = results.converted.reduce((sum, r) => sum + parseFloat(r.originalSize), 0);
        const totalWebP = results.converted.reduce((sum, r) => sum + parseFloat(r.webpSize), 0);
        const totalSavings = ((1 - totalWebP / totalOriginal) * 100).toFixed(1);

        console.log(`\n💾 Total savings: ${totalOriginal.toFixed(2)} KB → ${totalWebP.toFixed(2)} KB`);
        console.log(`📉 Overall reduction: ${totalSavings}%`);
    }

    console.log('\n✨ Image conversion complete!\n');

    return results;
}

// Run the conversion
convertImagesToWebP()
    .then(() => {
        console.log('🎉 All done! WebP images are ready to use.');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
