const fs = require('fs');

const src = fs.readFileSync('scripts/bookmarklet.js', 'utf8');

function minifyJs(code) {
    let result = '';
    let i = 0;
    const len = code.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
        const ch = code[i];
        const next = code[i + 1] || '';

        // Handle Escape in strings
        if ((inSingleQuote || inDoubleQuote || inBacktick) && ch === '\\') {
            result += ch + next;
            i += 2;
            continue;
        }

        // Handle Quotes
        if (!inDoubleQuote && !inBacktick && ch === "'") {
            inSingleQuote = !inSingleQuote;
            result += ch;
            i++;
            continue;
        }
        if (!inSingleQuote && !inBacktick && ch === '"') {
            inDoubleQuote = !inDoubleQuote;
            result += ch;
            i++;
            continue;
        }
        if (!inSingleQuote && !inDoubleQuote && ch === '`') {
            inBacktick = !inBacktick;
            result += ch;
            i++;
            continue;
        }

        // Inside Backticks (HTML / CSS templates): collapse newlines & indentation between tags
        if (inBacktick) {
            if (ch === '\n' || ch === '\r') {
                // Peek ahead and skip spaces/tabs
                let j = i + 1;
                while (j < len && (code[j] === ' ' || code[j] === '\t' || code[j] === '\n' || code[j] === '\r')) {
                    j++;
                }
                // If it's between HTML tags, omit newline completely, else single space
                const prevChar = result[result.length - 1];
                const nextChar = code[j];
                if (prevChar === '>' || nextChar === '<' || prevChar === ';' || prevChar === '{' || prevChar === '}') {
                    i = j;
                    continue;
                }
                result += ' ';
                i = j;
                continue;
            }
            result += ch;
            i++;
            continue;
        }

        // Inside standard single/double quotes: keep exact
        if (inSingleQuote || inDoubleQuote) {
            result += ch;
            i++;
            continue;
        }

        // Handle Single-line Comments
        if (ch === '/' && next === '/') {
            while (i < len && code[i] !== '\n') {
                i++;
            }
            continue;
        }

        // Handle Multi-line Comments
        if (ch === '/' && next === '*') {
            i += 2;
            while (i < len && !(code[i] === '*' && code[i + 1] === '/')) {
                i++;
            }
            i += 2;
            continue;
        }

        // Whitespace outside strings: collapse consecutive whitespaces
        if (/\s/.test(ch)) {
            const last = result[result.length - 1];
            // Only add space if preceding char is an identifier or keyword
            if (last && /[a-zA-Z0-9_$]/.test(last)) {
                let j = i;
                while (j < len && /\s/.test(code[j])) j++;
                const nextNonWs = code[j];
                if (nextNonWs && /[a-zA-Z0-9_$]/.test(nextNonWs)) {
                    result += ' ';
                }
            }
            i++;
            continue;
        }

        result += ch;
        i++;
    }

    return result.trim();
}

let minified = minifyJs(src);

if (!minified.startsWith('javascript:')) {
    minified = 'javascript:' + minified;
}

fs.writeFileSync('scripts/bookmarklet-minified.url.txt', minified, 'utf8');
console.log('Bookmarklet Minified bytes:', minified.length);

// Uji integritas sintaks
try {
    const codeOnly = minified.replace(/^javascript:/, '');
    new Function(codeOnly);
    console.log('Verifikasi sintaks: BERHASIL dan VALID!');
} catch (e) {
    console.error('Verifikasi sintaks: GAGAL!', e);
    process.exit(1);
}
