const fs = require('fs');
const { execSync } = require('child_process');

const src = fs.readFileSync('scripts/bookmarklet.js', 'utf8');

// 1. Sinkronisasi otomatis ke userscript agar kode inti 100% identik
const iife = src.substring(src.indexOf('(function () {'));
const userscriptHeader = `// ==UserScript==
// @name         MBG - Local Photo Helper (Multi-Foto & Multi-Sekolah)
// @namespace    https://pop-sipgn.bgn.go.id/
// @version      2.2.2
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

// 2. Minifikasi agresif menggunakan Terser untuk bookmarklet URL
console.log('Menjalankan minifikasi agresif via Terser...');
const terserCmd = 'npx terser scripts/bookmarklet.js --compress passes=3,pure_getters,unsafe,unsafe_comps,unsafe_math,unsafe_proto --mangle toplevel=true';
let minifiedCode = execSync(terserCmd).toString().trim();

if (!minifiedCode.startsWith('javascript:')) {
    minifiedCode = 'javascript:' + minifiedCode;
}

// Pastikan tidak ada karakter newline yang merusak URL bookmarklet
minifiedCode = minifiedCode.replace(/[\r\n]+/g, '');

fs.writeFileSync('scripts/bookmarklet-minified.url.txt', minifiedCode, 'utf8');
console.log('Bookmarklet Minified bytes:', minifiedCode.length);
console.log('Contains newline?', minifiedCode.includes('\n'));

// 3. Uji integritas sintaks
try {
    const codeOnly = minifiedCode.replace(/^javascript:/, '');
    new Function(codeOnly);
    console.log('Verifikasi sintaks: BERHASIL dan VALID!');
} catch (e) {
    console.error('Verifikasi sintaks: GAGAL!', e);
    process.exit(1);
}
