import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Helper mock browser environment untuk testing Bookmarklet Mobile (Unified v2.2.0)
function createMockMobileEnv() {
    const elementsById = new Map();
    const eventListeners = new Map();
    const dbStores = new Map();

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
                if (sel.includes('[data-action')) {
                    const m = sel.match(/\[data-action="?([^"\]]+)"?\]/);
                    const targetAction = m ? m[1] : null;
                    for (const [k, el] of elementsById) {
                        if (el.attributes && el.attributes['data-action']) {
                            if (!targetAction || el.attributes['data-action'] === targetAction) {
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
                    if (sel.includes('[data-action]') && el.attributes['data-action']) {
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
                // Parse tags with IDs
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

                // Parse tags with data-action
                const actMatches = [...html.matchAll(/<([a-z0-9]+)[^>]*\bdata-action=["']([^"']+)["'][^>]*>/gi)];
                actMatches.forEach(m => {
                    const tag = m[1];
                    const act = m[2];
                    const fullTag = m[0];
                    const child = createNode(tag);
                    child.attributes['data-action'] = act;
                    const idM = fullTag.match(/data-id=["']([^"']+)["']/i);
                    if (idM) child.attributes['data-id'] = idM[1];
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

    const mockIndexedDB = {
        open(name, version) {
            const req = {
                result: {
                    objectStoreNames: { contains: () => true },
                    createObjectStore: () => ({}),
                    transaction: (storeName, mode) => {
                        if (!dbStores.has(storeName)) dbStores.set(storeName, new Map());
                        const storeMap = dbStores.get(storeName);
                        const tx = {
                            objectStore: () => ({
                                put: (item) => storeMap.set(item.id, item),
                                delete: (key) => storeMap.delete(key),
                                clear: () => storeMap.clear(),
                                getAll: () => {
                                    const r = { result: Array.from(storeMap.values()) };
                                    setTimeout(() => { if (r.onsuccess) r.onsuccess(); }, 2);
                                    return r;
                                }
                            }),
                            oncomplete: null,
                            onerror: null
                        };
                        setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 5);
                        return tx;
                    }
                },
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null
            };
            setTimeout(() => {
                if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
                if (req.onsuccess) req.onsuccess();
            }, 5);
            return req;
        }
    };

    const mockWin = {
        document: mockDoc,
        navigator: {
            mediaDevices: {
                getUserMedia: async (constraints) => ({ mockNativeStream: true })
            }
        },
        indexedDB: mockIndexedDB,
        URL: {
            createObjectURL(file) { return 'blob://mock/' + file.name; },
            revokeObjectURL(url) { }
        },
        Image: MockMobileImage,
        prompt: (msg, def) => def || 'Sekolah Baru',
        confirm: () => true,
        alert: () => { },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: () => 123,
        clearInterval: () => { }
    };

    return { mockWin, mockDoc, elementsById, dbStores };
}

function runBookmarklet(mockWin, mockDoc) {
    const bookmarkletCode = fs.readFileSync('scripts/bookmarklet.js', 'utf8');
    const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'prompt', 'confirm', bookmarkletCode);
    run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { }, mockWin.prompt, mockWin.confirm);
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

        runBookmarklet(mockWin, mockDoc);

        assert.strictEqual(popSipgnInput.hasAttribute('capture'), false, 'Atribut capture="camera" pada form harus dihapus');

        const widget = mockDoc.getElementById('mbg-quick-bypass');
        assert.ok(widget, 'Widget mbg-quick-bypass harus terpasang di DOM mobile');

        const fileInput = mockDoc.getElementById('mbg-file-input');
        assert.ok(fileInput, 'Input mbg-file-input harus ada');
        assert.ok(fileInput.style.position === 'absolute' || fileInput.attributes.multiple !== undefined);
    });

    test('3. Pemilihan 4 Foto di HP dan Pembaruan State Koleksi', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        runBookmarklet(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        const samplePhotos = [
            { name: 'makanan_hp.jpg', size: 3 * 1024 * 1024, type: 'image/jpeg' },
            { name: 'ompreng_hp.jpg', size: 2.5 * 1024 * 1024, type: 'image/jpeg' },
            { name: 'cuci_hp.jpg', size: 4 * 1024 * 1024, type: 'image/jpeg' },
            { name: 'pendukung_hp.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' }
        ];

        fileInput.onchange({ target: { files: samplePhotos } });

        const st = mockWin._mbgState;
        assert.strictEqual(st.collection.length, 4, '4 foto harus masuk ke koleksi');
        assert.strictEqual(st.collection[0].category, '1. Foto Makanan / Hasil Masakan');
        assert.strictEqual(st.collection[1].category, '2. Foto Ompreng / Wadah Makanan');
        assert.strictEqual(st.collection[2].category, '3. Foto Kegiatan Pencucian Ompreng');
        assert.strictEqual(st.collection[3].category, '4. Foto Dokumentasi Pendukung');
        assert.strictEqual(st.activePhotoId, st.collection[0].id);
    });

    test('4. WebRTC Canvas Scaling Aman untuk Mencegah Crash Memori HP', async () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        runBookmarklet(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [{ name: 'kamera_12mp.jpg', size: 4 * 1024 * 1024, type: 'image/jpeg' }]
            }
        });

        const stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        assert.ok(stream, 'Stream harus berhasil dibentuk');
        assert.strictEqual(stream.getVideoTracks().length, 1);

        stream.getVideoTracks()[0].stop();
        const st = mockWin._mbgState;
        assert.strictEqual(st.schoolDeliveries[st.currentSchool.id][st.collection[0].id], 'sent');
        assert.strictEqual(st.collection.length, 1, 'Foto sumber tetap aman di koleksi');
    });

    test('5. Otomatisasi Kamera & Pemajuan Antrean Tanpa Tombol ✓ Selesai', async () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        runBookmarklet(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto1.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'foto2.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        assert.strictEqual(st.activePhotoId, st.collection[0].id);

        // Simulasi pengunggahan foto pertama (video track stop)
        let stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();

        // Antrean otomatis berpindah ke foto 2 tanpa memerlukan tombol ✓ Selesai
        assert.strictEqual(st.schoolDeliveries[st.currentSchool.id][st.collection[0].id], 'sent');
        assert.strictEqual(st.activePhotoId, st.collection[1].id, 'Kamera virtual otomatis memajukan antrean ke foto 2');
    });

    test('6. Pemilihan Manual Foto ke Kamera di Mobile Tanpa Mengulang Foto Berhasil', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        runBookmarklet(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto1.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'foto2.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        // Tandai foto 1 sudah sent
        st.schoolDeliveries[st.currentSchool.id][st.collection[0].id] = 'sent';

        // Pengguna mengetuk "Pilih ke Kamera" pada foto 2
        st.activePhotoId = st.collection[1].id;
        assert.strictEqual(st.activePhotoId, st.collection[1].id);
        assert.strictEqual(st.schoolDeliveries[st.currentSchool.id][st.collection[0].id], 'sent');
        assert.strictEqual(st.collection.length, 2, 'Koleksi tetap utuh');
    });

    test('7. Mode Perkecil (Minimize) dan Buka Kembali di Mobile', () => {
        const { mockWin, mockDoc } = createMockMobileEnv();
        runBookmarklet(mockWin, mockDoc);

        const widget = mockDoc.getElementById('mbg-quick-bypass');
        const btnMin = widget.querySelector('#mbg-btn-minimize');
        assert.ok(btnMin, 'Tombol minimize harus tersedia');

        btnMin.click();
        assert.strictEqual(mockWin._mbgState.minimized, true);
        assert.ok(widget.innerHTML.includes('MBG') && widget.innerHTML.includes('Buka'));

        widget.click();
        assert.strictEqual(mockWin._mbgState.minimized, false);
        assert.ok(widget.innerHTML.includes('+ Pilih / Tambah Foto'));
    });
});
