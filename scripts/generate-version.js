#!/usr/bin/env node

/**
 * Generate version.json with Git commit information
 * This runs during the build process (Vercel deployment)
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getGitInfo() {
    try {
        const hash = execSync('git rev-parse --short HEAD').toString().trim();
        const date = execSync('git log -1 --format=%cd --date=short').toString().trim();
        const message = execSync('git log -1 --format=%s').toString().trim();
        const timestamp = new Date().toISOString();

        return {
            hash,
            date,
            message,
            timestamp,
            environment: 'production'
        };
    } catch (error) {
        console.warn('Git information not available, using fallback');
        return {
            hash: 'dev',
            date: new Date().toISOString().split('T')[0],
            message: 'Local Development',
            timestamp: new Date().toISOString(),
            environment: 'development'
        };
    }
}

const versionInfo = getGitInfo();
const outputPath = join(__dirname, '../public/version.json');

// Ensure public directory exists
const publicDir = dirname(outputPath);
if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
}

writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('✅ Version info generated:', versionInfo);
