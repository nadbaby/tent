const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install sharp locally if not present (using npm install sharp --no-save)
try {
    require.resolve('sharp');
} catch (e) {
    console.log('sharp not found, installing locally temporarily...');
    execSync('npm install sharp --no-save', { stdio: 'inherit' });
}
const sharp = require('sharp');

function getDirSizeSync(dirPath) {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            size += getDirSizeSync(fullPath);
        } else {
            size += stats.size;
        }
    }
    return size;
}

const assetsDir = path.join(__dirname, 'src', 'assets');
const targetTypes = ['.png', '.jpg', '.jpeg'];

async function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            await processDirectory(fullPath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (targetTypes.includes(ext)) {
                console.log(`Processing: ${file}`);

                try {
                    const image = sharp(fullPath);
                    const metadata = await image.metadata();

                    let targetWidth = null;

                    // Downscale massive logos
                    if (dirPath.includes('Logo') && metadata.width > 400) {
                        targetWidth = 400;
                    }
                    // Downscale absurdly large hero images/backgrounds
                    else if (metadata.width > 1200) {
                        targetWidth = 1200;
                    }

                    const outputPath = fullPath.replace(new RegExp(`\\${ext}$`, 'i'), '.webp');

                    let pipeline = image;
                    if (targetWidth) {
                        pipeline = pipeline.resize({ width: targetWidth });
                    }

                    await pipeline
                        .webp({ quality: 80, effort: 4 })
                        .toFile(outputPath);

                    // Delete old file
                    fs.unlinkSync(fullPath);
                    console.log(`✅ Converted and replaced ${file} -> .webp`);
                } catch (err) {
                    console.error(`❌ Failed to process ${file}:`, err.message);
                }
            }
        }
    }
}

async function run() {
    console.log(`Original Assets Size: ${(getDirSizeSync(assetsDir) / (1024 * 1024)).toFixed(2)} MB`);

    // Cleanup duplicates from previous broken conversions (e.g. .webp sitting next to .png)
    console.log('Purging existing .webp files to forcefully rebuild cleanly...');
    function cleanExistingWebp(dirPath) {
        const fList = fs.readdirSync(dirPath);
        for (const f of fList) {
            const fPath = path.join(dirPath, f);
            if (fs.statSync(fPath).isDirectory()) cleanExistingWebp(fPath);
            else if (path.extname(f).toLowerCase() === '.webp') fs.unlinkSync(fPath);
        }
    }
    try { cleanExistingWebp(assetsDir); } catch (e) { }

    await processDirectory(assetsDir);
    console.log(`Final Assets Size: ${(getDirSizeSync(assetsDir) / (1024 * 1024)).toFixed(2)} MB`);
}

run();
