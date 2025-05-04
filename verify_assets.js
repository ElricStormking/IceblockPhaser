// This is a Node.js script that verifies all assets follow the correct naming pattern
const fs = require('fs');
const path = require('path');

console.log('Starting script - Verifying game assets for consistent naming...');

const IMAGE_BASE_DIR = 'assets/images';
const MAX_LEVELS = 5;

// A list of expected files for each level
const EXPECTED_FILES = [
    `background{level}.png`,
    `chibi_girl{level}.png`,
    `victory_background{level}.png`,
    'level_config.json',
    'block_layout.json',
    'available_bombs.json'
];

// Check all level directories
for (let level = 1; level <= MAX_LEVELS; level++) {
    const levelDir = path.join(IMAGE_BASE_DIR, `level${level}`);
    
    console.log(`\nChecking level ${level}:`);
    
    try {
        // Check if the directory exists
        if (!fs.existsSync(levelDir)) {
            console.log(`  - Level directory ${levelDir} not found`);
            continue;
        }
        
        // Get all files in the directory
        const files = fs.readdirSync(levelDir);
        console.log(`  Found ${files.length} files`);
        
        // Check for each expected file
        for (const filePattern of EXPECTED_FILES) {
            const fileName = filePattern.replace('{level}', level);
            const exists = files.includes(fileName);
            console.log(`  - ${fileName}: ${exists ? '✓ FOUND' : '✗ MISSING'}`);
            
            if (exists) {
                const filePath = path.join(levelDir, fileName);
                const stats = fs.statSync(filePath);
                console.log(`    Size: ${(stats.size / 1024).toFixed(1)} KB`);
            }
        }
        
        // Check for any unexpected files
        const unexpectedFiles = files.filter(file => 
            !EXPECTED_FILES.some(pattern => 
                pattern.replace('{level}', level) === file
            )
        );
        
        if (unexpectedFiles.length > 0) {
            console.log('  - Unexpected files:');
            unexpectedFiles.forEach(file => {
                console.log(`    * ${file}`);
            });
        }
        
    } catch (error) {
        console.error(`  Error checking level ${level}:`, error.message);
    }
}

console.log('\nVerification complete!'); 