const fs = require('fs');

const src = fs.readFileSync('scripts/bookmarklet.js', 'utf8');

// Strip comments safely
let clean = src.replace(/\/\*[\s\S]*?\*\//g, '');
clean = clean.split('\n').map(line => {
    // If line has single-line comment not in string/url
    const idx = line.indexOf('//');
    if (idx !== -1 && !line.includes('http://') && !line.includes('https://')) {
        return line.substring(0, idx);
    }
    return line;
}).map(l => l.trim()).filter(Boolean).join(' ');

// Collapse multi-spaces
clean = clean.replace(/\s+/g, ' ');
clean = clean.replace(/\s*([\{\}\(\);,:\=\+\-\*\/><&\|\?])\s*/g, '$1');
clean = clean.replace(/;\}/g, '}');

const url = 'javascript:' + clean;
fs.writeFileSync('scripts/bookmarklet-minified.url.txt', url, 'utf8');
console.log('Bookmarklet Minified bytes:', url.length);
