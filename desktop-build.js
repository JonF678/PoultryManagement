const fs = require('fs');
const path = require('path');

// Simple build script for desktop packaging
console.log('Building Poultry Manager Desktop App...');

// Create build configuration
const buildConfig = {
    productName: 'Poultry Manager',
    appId: 'com.poultrymanager.app',
    directories: {
        output: 'dist'
    },
    files: [
        'electron/**/*',
        'index.html',
        'css/**/*',
        'js/**/*',
        'icons/**/*',
        'manifest.json',
        'sw.js'
    ],
    win: {
        icon: 'icons/icon-512.png'
    },
    mac: {
        icon: 'icons/icon-512.png'
    },
    linux: {
        icon: 'icons/icon-512.png'
    }
};

// Write the configuration
fs.writeFileSync('build-config.json', JSON.stringify(buildConfig, null, 2));

console.log('Build configuration created successfully!');
console.log('\nTo build the desktop app:');
console.log('1. Install electron globally: npm install -g electron');
console.log('2. Run electron: electron electron/main.js');
console.log('3. For packaging: npx electron-builder --config build-config.json');