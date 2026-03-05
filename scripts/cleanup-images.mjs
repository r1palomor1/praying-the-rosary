import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const imagesDir = path.join(projectRoot, 'public', 'images');
const srcDir = path.join(projectRoot, 'src');

function getAllFiles(dir, matchFiles = []) {
    if (!fs.existsSync(dir)) return matchFiles;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, matchFiles);
        } else {
            matchFiles.push(fullPath);
        }
    }
    return matchFiles;
}

const allImages = getAllFiles(imagesDir);
const sourceCodeFiles = [
    ...getAllFiles(srcDir).filter(f => f.match(/\.(ts|tsx|js|json|css)$/)),
    path.join(projectRoot, 'index.html')
];

const sourceContents = sourceCodeFiles.map(f => {
    return {
        path: f,
        content: fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''
    };
});

const unusedImages = [];
const usedImages = [];
let bytesToSave = 0;

for (const imgPath of allImages) {
    const fileName = path.basename(imgPath);
    
    let isUsed = false;
    for (const srcFile of sourceContents) {
        // Just checking if the literal filename string is anywhere in the code.
        // Extremely safe fallback for unused files.
        if (srcFile.content.includes(fileName)) {
            isUsed = true;
            break;
        }
    }
    
    // Safety exceptions: 
    // Sometimes images are constructed dynamically or are root fallback names.
    // E.g., if there's code like `favicon.ico` or `apple-touch-icon.png` (though we are focused on images dir here).
    
    if (isUsed) {
        usedImages.push(imgPath);
    } else {
        unusedImages.push(imgPath);
        bytesToSave += fs.statSync(imgPath).size;
    }
}

console.log(`Found ${usedImages.length} USED images.`);
console.log(`Found ${unusedImages.length} UNUSED images.`);
console.log(`Approximate space savings: ${(bytesToSave / 1024 / 1024).toFixed(2)} MB`);
console.log('\nUnused images:');
unusedImages.forEach(p => console.log(' - ' + path.basename(p)));

// Only delete if we run with 'delete' argument
if (process.argv.includes('--delete')) {
    unusedImages.forEach(p => fs.unlinkSync(p));
    console.log('Unused images successfully deleted.');
}
