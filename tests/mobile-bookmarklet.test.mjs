import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Helper mock browser environment untuk testing Bookmarklet Mobile
function createMockMobileEnv() {
    const elementsById = new Map();
    const eventListeners = new Map();

    function createNode(tag, id = '') {
        const node = {
            tagName: tag.toUpperCase(),
            style: {},
            children: [],
            attributes: {},
            value: '',
            files: [],
            _rawHtml: '',
            onclick: null,
            onchange: null,
            hasAttribute(attr) { return attr in this.attributes; },
            removeAttribute(attr) { delete this.attributes[attr]; },
            setAttribute(attr, val) { this.attributes[attr] = val; },
            getAttribute(attr) { return this.attributes[attr] || null; },
            appendChild(child) {
                this.children.push(child);
                if (child.id) elementsById.set(child.id, child);
                return child;
            },
            querySelector(sel) {
                if (sel.startsWith('#')) {
                    const tid = sel.substring(1);
                    return elementsById.get(tid) || null;
                }
                if (sel.includes('[data-act')) {
                    const valMatch = sel.match(/\[data-act="?([^"\]]+)"?\]/);
                    const targetVal = valMatch ? valMatch[1] : null;
                    for (const [k, el] of elementsById) {
                        if (el.attributes && el.attributes['data-act']) {
                            if (!targetVal || el.attributes['data-act'] === targetVal) {
                                return el;
                            }
                        }
                    }
                }
                return null;
            },
            querySelectorAll(sel) {
                const results = [];
                elementsById.forEach(el => {
                    if (sel.includes('input[type="file"]') && el.tagName === 'INPUT') {
                        results.push(el);
                    }
                    if (sel.includes('[data-act]') && el.attributes['data-act']) {
                        results.push(el);
                    }
                });
                return results;
            },
            click() {
                if (typeof this.onclick === 'function') this.onclick({ stopPropagation() { } });
            }
        };

        Object.defineProperty(node, 'id', {
            get() { return this._id || ''; },
            set(v) {
                this._id = v;
                if (v) elementsById.set(v, this);
            }
        });
        node.id = id;

        Object.defineProperty(node, 'innerHTML', {
            get() { return this._rawHtml || ''; },
            set(html) {
                this._rawHtml = html;
                // Parse IDs
                const idMatches = [...html.matchAll(/<([a-z0-9]+)[^>]*\bid=["']([^"']+)["'][^>]*>/gi)];
                idMatches.forEach(m => {
                    const tag = m[1];
                    const elId = m[2];
                    const fullTag = m[0];
                    let child = elementsById.get(elId);
                    if (!child) child = createNode(tag, elId);
                    if (fullTag.includes('multiple')) child.attributes.multiple = '';
                    if (fullTag.includes('type="file"')) child.attributes.type = 'file';
                    if (fullTag.includes('type="checkbox"')) {
                        child.attributes.type = 'checkbox';
                        child.checked = fullTag.includes('checked');
                    }
                });

                // Parse data-act
                const actMatches = [...html.matchAll(/<([a-z0-9]+)[^>]*\bdata-act=["']([^"']+)["'][^>]*>/gi)];
                actMatches.forEach(m => {
                    const tag = m[1];
                    const act = m[2];
                    const fullTag = m[0];
                    const child = createNode(tag);
                    child.attributes['data-act'] = act;
                    const iM = fullTag.match(/data-i=["']([^"']+)["']/i);
                    if (iM) child.attributes['data-i'] = iM[1];
                    elementsById.set('dyn_act_' + Math.random(), child);
                });
            }
        });

        return node;
    }

    const mockBody = createNode('BODY');
    const mockHead = createNode('HEAD');

    const mockDoc = {
        readyState: 'complete',
        body: mockBody,
        head: mockHead,
        documentElement: mockBody,
        getElementById(id) {
            return elementsById.get(id) || null;
        },
        createElement(tag) {
            if (tag.toLowerCase() === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext() {
                        return { drawImage() { } };
                    },
                    captureStream() {
                        const listeners = new Map();
                        const mockTrack = {
                            kind: 'video',
                            stopCalled: false,
                            stop() {
                                this.stopCalled = true;
                                const handlers = listeners.get('ended') || [];
                                handlers.forEach(h => h());
                            },
                            addEventListener(evt, fn) {
                                if (!listeners.has(evt)) listeners.set(evt, []);
                                listeners.get(evt).push(fn);
                            }
                        };
                        return {
                            getVideoTracks() { return [mockTrack]; }
                        };
                    }
                };
            }
            return createNode(tag);
        },
        querySelectorAll(sel) {
            const results = [];
            elementsById.forEach(el => {
                if (sel.includes('input[type="file"]') && el.tagName === 'INPUT') {
                    results.push(el);
                }
            });
            return results;
        },
        addEventListener(evt, fn) {
            if (!eventListeners.has(evt)) eventListeners.set(evt, []);
            eventListeners.get(evt).push(fn);
        }
    };

    class MockMobileImage {
        constructor() {
            this.naturalWidth = 4000;
            this.naturalHeight = 3000;
            setTimeout(() => {
                if (typeof this.onload === 'function') this.onload();
            }, 5);
        }
    }

    const mockWin = {
        document: mockDoc,
        navigator: {
            mediaDevices: {
                getUserMedia: async (constraints) => ({ mockNativeStream: true })
            }
        },
        URL: {
            createObjectURL(file) { return 'blob://mock/' + file.name; },
            revokeObjectURL(url) { }
        },
        Image: MockMobileImage,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: () => 123,
        clearInterval: () => { }
    };

    return { mockWin, mockDoc, elementsById };
}

describe('MBG Photo Helper — Debugging & Verifikasi Mobile Bookmarklet', () => {

    test('1. Validasi Sintaks & Format Bookmarklet Minified', () => {
        const minifiedUrl = fs.readFileSync('scripts/bookmarklet-minified.url.txt', 'utf8');
        assert.ok(minifiedUrl.startsWith('javascript:'), 'URL bookmarklet wajib memiliki awalan javascript:');
        assert.ok(!minifiedUrl.includes('\n'), 'Bookmarklet minified tidak boleh mengandung karakter newline');

        const codeOnly = minifiedUrl.replace('javascript:', '');
        assert.doesNotThrow(() => {
            new Function(codeOnly);
        }, 'Kode bookmarklet minified harus lolos kompilasi fungsi JavaScript');
    });

    test('2. Eksekusi Bookmarklet di Lingkungan Mobile & Intervensi Form Capture', () => {
        const { mockWin, mockDoc, elementsById } = createMockMobileEnv();

        const popSipgnInput = mockDoc.createElement('input');
        popSipgnInput.attributes.type = 'file';
        popSipgnInput.setAttribute('capture', 'camera');
        elementsById.set('pop-capture-input', popSipgnInput);

        const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
        const run = new Function('window', 'document', 'navigator', 'URL', 'Image', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', bookmarkletCode);
        run(mockWin, mockDoc, mockWin.navigator, mockWin.URL, mockWin.Image, setTimeout, clearTimeout, () => 1, () => { });

        assert.strictEqual(popSipgnInput.hasAttribute('capture'), false, 'Atribut capture="camera" pada form harus dihapus');

        const widget = mockDoc.getElementById('mbg-quick-bypass');
        assert.ok(widget, 'Widget mbg-quick-bypass harus terpasang di DOM mobile');

        const fileInput = mockDoc.getElementById('mbg-bm-file');
        assert.ok(fileInput, 'Input mbg-bm-file harus ada');
        assert.ok(fileInput.style.position === 'absolute' || fileInput.attributes.multiple !== undefined);
    });

    test('3. Pemilihan 4 Foto di HP dan Pembaruan Tahap / Debugging', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
        const run = new Function('window', 'document', 'navigator', 'URL', 'Image', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', bookmarkletCode);
        run(mockWin, mockDoc, mockWin.navigator, mockWin.URL, mockWin.Image, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-bm-file');
        const samplePhotos = [
            { name: 'makanan_hp.jpg', size: 3 * 1024 * 1024 },
            { name: 'ompreng_hp.jpg', size: 2.5 * 1024 * 1024 },
            { name: 'cuci_hp.jpg', size: 4 * 1024 * 1024 },
            { name: 'pendukung_hp.jpg', size: 2 * 1024 * 1024 }
        ];

        fileInput.onchange({ target: { files: samplePhotos } });

        const st = mockWin._mbgBmState;
        assert.strictEqual(st.photos.length, 4, '4 foto harus masuk antrean mobile');
        assert.strictEqual(st.photos[0].status, 'active');
        assert.strictEqual(st.photos[1].status, 'pending');

        const stageEl = mockDoc.getElementById('mbg-bm-stage');
        assert.ok(stageEl, 'Elemen indikator tahap harus ada');
        assert.ok(st.stage.includes('ditambahkan') || st.stage.includes('Kamera siap'));
    });

    test('4. WebRTC Canvas Scaling Aman untuk Mencegah Crash Memori HP', async () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
        const run = new Function('window', 'document', 'navigator', 'URL', 'Image', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', bookmarkletCode);
        run(mockWin, mockDoc, mockWin.navigator, mockWin.URL, mockWin.Image, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-bm-file');
        fileInput.onchange({
            target: {
                files: [{ name: 'kamera_12mp.jpg', size: 4 * 1024 * 1024 }]
            }
        });

        const stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        assert.ok(stream, 'Stream harus berhasil dibentuk');
        assert.strictEqual(stream.getVideoTracks().length, 1);

        stream.getVideoTracks()[0].stop();
        assert.strictEqual(mockWin._mbgBmState.photos[0].status, 'success');
    });

    test('5. Tombol Manual "✓ Selesai" Berfungsi Memajukan Antrean jika Track Tidak Berhenti', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
        const run = new Function('window', 'document', 'navigator', 'URL', 'Image', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', bookmarkletCode);
        run(mockWin, mockDoc, mockWin.navigator, mockWin.URL, mockWin.Image, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-bm-file');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto1.jpg', size: 1024 },
                    { name: 'foto2.jpg', size: 1024 }
                ]
            }
        });

        const st = mockWin._mbgBmState;
        assert.strictEqual(st.idx, 0);
        assert.strictEqual(st.photos[0].status, 'active');

        // Pengguna mengetuk tombol "✓ Selesai" pada kartu foto aktif
        const btnDone = mockDoc.getElementById('mbg-quick-bypass').querySelector('[data-act="done"]');
        assert.ok(btnDone, 'Tombol ✓ Selesai harus ada pada foto yang sedang aktif');

        btnDone.click();

        // Foto 1 harus berubah menjadi success, dan antrean otomatis maju ke foto 2
        assert.strictEqual(st.photos[0].status, 'success', 'Foto 1 harus menjadi success');
        assert.strictEqual(st.idx, 1, 'Indeks harus maju ke foto 2');
        assert.strictEqual(st.photos[1].status, 'active', 'Foto 2 harus menjadi active');
    });

    test('6. Coba Lagi (Retry) Foto Gagal di Mobile Tanpa Mengulang Foto Berhasil', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
        const run = new Function('window', 'document', 'navigator', 'URL', 'Image', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', bookmarkletCode);
        run(mockWin, mockDoc, mockWin.navigator, mockWin.URL, mockWin.Image, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-bm-file');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto1.jpg', size: 1024 },
                    { name: 'foto2.jpg', size: 1024 }
                ]
            }
        });

        const st = mockWin._mbgBmState;
        st.photos[0].status = 'success';
        st.photos[1].status = 'failed';
        st.idx = 1;

        // Panggil render dengan toggle minimize lalu expand
        const widget = mockDoc.getElementById('mbg-quick-bypass');
        widget.querySelector('#mbg-bm-min').click();
        widget.click();

        // Cari tombol "Ulang" pada foto 2
        const btnRetry = widget.querySelector('[data-act="ret"]');
        assert.ok(btnRetry, 'Tombol Ulang harus tersedia untuk foto berstatus failed');

        btnRetry.click();

        // Foto 1 tetap success, foto 2 kembali aktif
        assert.strictEqual(st.photos[0].status, 'success');
        assert.strictEqual(st.photos[1].status, 'active');
        assert.strictEqual(st.idx, 1);
    });

    test('7. Mode Perkecil (Minimize) dan Buka Kembali di Mobile', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
        const run = new Function('window', 'document', 'navigator', 'URL', 'Image', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', bookmarkletCode);
        run(mockWin, mockDoc, mockWin.navigator, mockWin.URL, mockWin.Image, setTimeout, clearTimeout, () => 1, () => { });

        const widget = mockDoc.getElementById('mbg-quick-bypass');
        const btnMin = widget.querySelector('#mbg-bm-min');
        assert.ok(btnMin, 'Tombol minimize harus tersedia');

        btnMin.click();
        assert.strictEqual(mockWin._mbgBmState.min, true);
        assert.ok(widget.innerHTML.includes('[Buka]'));

        widget.click();
        assert.strictEqual(mockWin._mbgBmState.min, false);
        assert.ok(widget.innerHTML.includes('+ Pilih / Tambah Foto'));
    });
});
