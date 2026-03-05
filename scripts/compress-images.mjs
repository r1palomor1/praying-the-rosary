import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '..', 'public', 'images');

async function processImages(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            await processImages(fullPath);
        } else if (fullPath.endsWith('.webp')) {
            const originalSize = fs.statSync(fullPath).size;
            
            // Read into buffer to allow in-place overwrite
            const buffer = fs.readFileSync(fullPath);
            let sharpInstance = sharp(buffer);
            
            // Optional resizing based on naming convention
            if (file.includes('-sm')) {
                sharpInstance = sharpInstance.resize(480, 480, { fit: 'inside' });
            } else if (file.includes('-md')) {
                sharpInstance = sharpInstance.resize(800, 800, { fit: 'inside' });
            } else if (file.includes('-lg')) {
                // Keep 1024
                sharpInstance = sharpInstance.resize(1024, 1024, { fit: 'inside' });
            }

            const outputBuffer = await sharpInstance
                .webp({ quality: 80, effort: 6 }) // effort 6 gives better compression
                .toBuffer();
                
            fs.writeFileSync(fullPath, outputBuffer);
            
            const newSize = outputBuffer.length;
            const savings = originalSize - newSize;
            if (savings > 0) {
                console.log(`Compressed ${file}: ${Math.round(originalSize/1024)}KB -> ${Math.round(newSize/1024)}KB (-${Math.round(savings/1024)}KB)`);
            }
        }
    }
}

console.log('Starting image compression...');
await processImages(imagesDir);
console.log('Compression complete!');
