import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Found these looking at the root of `public/`
const filesToCompress = [
    'bible_year_icon.png',
    'daily_readings_icon.png',
    'sacred_prayers_icon.png',
    'rosary_icon.png',
    'stained_glass_hero_1764033304587.png',
    'glorious_gradient_1764033317128.png',
    'joyful_gradient_1764034316288.png',
    'sorrowful_gradient_1764034329652.png',
    'luminous_gradient_1764034342389.png'
];

async function processIcons() {
    for (const file of filesToCompress) {
        const fullPath = path.join(publicDir, file);
        if (fs.existsSync(fullPath)) {
            const originalSize = fs.statSync(fullPath).size;
            
            const buffer = fs.readFileSync(fullPath);
            const metadata = await sharp(buffer).metadata();
            let sharpInstance = sharp(buffer);
            
            // For the big hero images used as fuzzy backgrounds, width 1024 is plenty.
            // For the simple prayer selection transparent icons, width 512 is plenty.
            if (file.includes('icon') && metadata.width > 512) {
                 sharpInstance = sharpInstance.resize(512, 512, { fit: 'inside' });
            } else if (file.includes('gradient') || file.includes('hero')) {
                 if (metadata.width > 1024) {
                     sharpInstance = sharpInstance.resize(1024, 1024, { fit: 'inside' });
                 }
            }

            // High compression preset for PNGs
            const outputBuffer = await sharpInstance
                .png({ quality: 80, compressionLevel: 9, palette: true }) 
                .toBuffer();
                
            fs.writeFileSync(fullPath, outputBuffer);
            
            const newSize = outputBuffer.length;
            const savings = originalSize - newSize;
            if (savings > 0) {
                console.log(`Compressed ${file}: ${Math.round(originalSize/1024)}KB -> ${Math.round(newSize/1024)}KB (-${Math.round(savings/1024)}KB)`);
            } else {
                console.log(`Checked ${file}, size unchanged.`);
            }
        }
    }
}
await processIcons();
