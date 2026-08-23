const fs = require('fs');
const path = require('path');

function replaceExtensions(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceExtensions(fullPath);
        } else if (['.jsx', '.js'].includes(path.extname(file))) {
            let content = fs.readFileSync(fullPath, 'utf8');

            const before = content;
            // Match explicit image imports from assets dir
            content = content.replace(/\.(png|jpg|jpeg)['"]/gi, (match) => {
                return match.toLowerCase().replace('.png', '.webp').replace('.jpg', '.webp').replace('.jpeg', '.webp');
            });
            content = content.replace(/\.(png|jpg|jpeg)`/gi, (match) => {
                return match.toLowerCase().replace('.png', '.webp').replace('.jpg', '.webp').replace('.jpeg', '.webp');
            });

            // Also catch explicit instances
            content = content.replace(/wwwe26\.png/gi, 'wwwe26.webp');
            content = content.replace(/Bearings\.png/gi, 'Bearings.webp');

            if (before !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated imports in:', fullPath);
            }
        }
    }
}

replaceExtensions(path.join(__dirname, 'src'));
