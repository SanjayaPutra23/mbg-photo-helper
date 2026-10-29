const fs = require('fs');

const src = fs.readFileSync('scripts/bookmarklet.js', 'utf8');

// Sinkronisasi otomatis ke userscript agar kode inti 100% identik
const iife = src.substring(src.indexOf('(function () {'));
const userscriptHeader = `// ==UserScript==
// @name         MBG - Local Photo Helper (Multi-Foto & Multi-Sekolah)
// @namespace    https://pop-sipgn.bgn.go.id/
// @version      2.2.1
// @description  Bypass Kamera POP SIPGN Otomatis & Koleksi Foto Multi-Sekolah untuk Dokumentasi SPPG MBG
// @author       Antigravity 2.0
// @match        *://pop-sipgn.bgn.go.id/*
// @include      *pop-sipgn.bgn.go.id*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

`;
fs.writeFileSync('scripts/mbg-photo-helper.user.js', userscriptHeader + iife, 'utf8');
console.log('Sinkronisasi userscript: SELESAI');

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
                // Peek ahead and skip spaces/tabs/newlines
                let j = i + 1;
                while (j < len && (code[j] === ' ' || code[j] === '\t' || code[j] === '\n' || code[j] === '\r')) {
                    j++;
                }
                const prevChar = result[result.length - 1];
                const nextChar = code[j];
                if (prevChar === '>' || nextChar === '<' || prevChar === ';' || prevChar === '{' || prevChar === '}' || prevChar === '`' || nextChar === '`') {
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

        // Inside standard single/double quotes: keep exact (escape any literal newline)
        if (inSingleQuote || inDoubleQuote) {
            if (ch === '\n') {
                result += '\\n';
                i++;
                continue;
            }
            if (ch === '\r') {
                i++;
                continue;
            }
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

        // Handle RegExp literals (starts with / after operator or punctuation)
        if (ch === '/' && next !== '/' && next !== '*') {
            const trimmedPrev = result.trimEnd();
            const lastChar = trimmedPrev[trimmedPrev.length - 1];
            if (!lastChar || /[=([{:;!&|,?~*+\-\/]/.test(lastChar)) {
                result += ch;
                i++;
                let inCharClass = false;
                while (i < len) {
                    const rch = code[i];
                    result += rch;
                    if (rch === '\\') {
                        i++;
                        if (i < len) result += code[i];
                    } else if (rch === '[') {
                        inCharClass = true;
                    } else if (rch === ']') {
                        inCharClass = false;
                    } else if (rch === '/' && !inCharClass) {
                        i++;
                        while (i < len && /[gimsuy]/.test(code[i])) {
                            result += code[i];
                            i++;
                        }
                        break;
                    }
                    i++;
                }
                continue;
            }
        }

        // Whitespace outside strings: collapse consecutive whitespaces
        if (/\s/.test(ch)) {
            const last = result[result.length - 1];
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
console.log('Contains newline?', minified.includes('\n'));

// Uji integritas sintaks
try {
    const codeOnly = minified.replace(/^javascript:/, '');
    new Function(codeOnly);
    console.log('Verifikasi sintaks: BERHASIL dan VALID!');
} catch (e) {
    console.error('Verifikasi sintaks: GAGAL!', e);
    process.exit(1);
}
