#!/usr/bin/env node

/**
 * Generate version.json with Git commit information
 * This runs during the build process (Vercel deployment)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
const outputPath = path.join(__dirname, '../public/version.json');

// Ensure public directory exists
const publicDir = path.dirname(outputPath);
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('✅ Version info generated:', versionInfo);
