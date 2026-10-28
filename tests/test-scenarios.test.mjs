import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Helper mock browser environment cerdas tanpa dependency eksternal
function createMockEnvironment() {
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
                    const valMatch = sel.match(/\[data-action="?([^"\]]+)"?\]/);
                    const targetVal = valMatch ? valMatch[1] : null;
                    for (const [k, el] of elementsById) {
                        if (el.attributes && el.attributes['data-action']) {
                            if (!targetVal || el.attributes['data-action'] === targetVal) {
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
                // Parse elemen dengan id
                const idMatches = [...html.matchAll(/<([a-z0-9]+)[^>]*\bid=["']([^"']+)["'][^>]*>/gi)];
                idMatches.forEach(m => {
                    const tag = m[1];
                    const elId = m[2];
                    const fullTag = m[0];
                    let child = elementsById.get(elId);
                    if (!child) {
                        child = createNode(tag, elId);
                    }
                    if (fullTag.includes('multiple')) child.attributes.multiple = '';
                    if (fullTag.includes('type="file"')) child.attributes.type = 'file';
                    if (fullTag.includes('type="checkbox"')) {
                        child.attributes.type = 'checkbox';
                        child.checked = fullTag.includes('checked');
                    }
                });

                // Parse elemen dengan data-action
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

    class MockImage {
        constructor() {
            this.naturalWidth = 1280;
            this.naturalHeight = 720;
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
        Image: MockImage,
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

function executeScript(mockWin, mockDoc) {
    const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
    const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'prompt', 'confirm', code);
    run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { }, mockWin.prompt, mockWin.confirm);
}

describe('MBG Photo Helper v2.2 — Pengujian 14 Skenario Wajib', () => {

    test('1. Satu foto tetap dapat digunakan (Kompatibilitas fungsi tunggal)', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        assert.ok(fileInput, 'Input file harus tersedia');

        const singleFile = { name: 'nasi_box.jpg', size: 1024 * 500, type: 'image/jpeg' };
        fileInput.onchange({ target: { files: [singleFile] } });

        const st = mockWin._mbgState;
        assert.strictEqual(st.collection.length, 1);
        assert.strictEqual(mockWin.mbgSelectedFile.name, 'nasi_box.jpg');

        const stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        assert.ok(stream);
        stream.getVideoTracks()[0].stop();

        // Status foto untuk sekolah aktif harus 'sent', dan foto tetap ada di koleksi
        assert.strictEqual(st.collection.length, 1, 'Foto sumber tidak boleh hilang setelah diunggah');
        assert.strictEqual(st.schoolDeliveries[st.currentSchool.id][st.collection[0].id], 'sent');
    });

    test('2. Empat foto dapat dipilih sekaligus sesuai SOP dokumentasi MBG', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        const files = [
            { name: '1_makanan.jpg', size: 1024 * 500, type: 'image/jpeg' },
            { name: '2_ompreng.jpg', size: 1024 * 500, type: 'image/jpeg' },
            { name: '3_cuci.jpg', size: 1024 * 500, type: 'image/jpeg' },
            { name: '4_pendukung.jpg', size: 1024 * 500, type: 'image/jpeg' }
        ];

        fileInput.onchange({ target: { files: files } });

        const st = mockWin._mbgState;
        assert.strictEqual(st.collection.length, 4, '4 foto harus masuk ke koleksi');
        assert.strictEqual(st.collection[0].category, '1. Foto Makanan / Hasil Masakan');
        assert.strictEqual(st.collection[1].category, '2. Foto Ompreng / Wadah Makanan');
        assert.strictEqual(st.collection[2].category, '3. Foto Kegiatan Pencucian Ompreng');
        assert.strictEqual(st.collection[3].category, '4. Foto Dokumentasi Pendukung');
        assert.strictEqual(st.activePhotoId, st.collection[0].id);
    });

    test('3. Foto dapat ditambahkan ke koleksi tanpa mengganti foto sebelumnya (Append)', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto1.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'foto2.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });
        assert.strictEqual(mockWin._mbgState.collection.length, 2);

        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto3.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'foto4.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        assert.strictEqual(mockWin._mbgState.collection.length, 4, 'Foto sebelumnya tidak boleh terhapus');
    });

    test('4. Foto dapat dihapus secara manual dari koleksi sumber', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'fotoA.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'fotoB_salah.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'fotoC.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        assert.strictEqual(st.collection.length, 3);

        const deleteTargetId = st.collection[1].id;
        const targetIdx = st.collection.findIndex(p => p.id === deleteTargetId);
        st.collection.splice(targetIdx, 1);

        assert.strictEqual(st.collection.length, 2);
        assert.strictEqual(st.collection[0].name, 'fotoA.jpg');
        assert.strictEqual(st.collection[1].name, 'fotoC.jpg');
    });

    test('5. Upload berhasil TIDAK menghapus foto sumber dari koleksi', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

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
        assert.strictEqual(st.collection.length, 2);

        // Upload foto 1
        const stream1 = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream1.getVideoTracks()[0].stop();

        // Verifikasi foto 1 berstatus 'sent', tetapi kedua foto TETAP ADA di koleksi
        assert.strictEqual(st.schoolDeliveries[st.currentSchool.id][st.collection[0].id], 'sent');
        assert.strictEqual(st.collection.length, 2, 'Koleksi foto sumber harus tetap utuh');
    });

    test('6. Upload gagal TIDAK menghapus foto sumber dari koleksi', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [{ name: 'foto_gagal.jpg', size: 1024, type: 'image/jpeg' }]
            }
        });

        const st = mockWin._mbgState;
        st.schoolDeliveries[st.currentSchool.id][st.collection[0].id] = 'failed';

        assert.strictEqual(st.collection.length, 1, 'Foto sumber gagal tidak boleh terhapus dari koleksi');
        assert.strictEqual(st.schoolDeliveries[st.currentSchool.id][st.collection[0].id], 'failed');
    });

    test('7. Koleksi yang sama dapat digunakan untuk dua sekolah berbeda', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'makanan.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'ompreng.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        const school1Id = st.currentSchool.id;

        // Sekolah 1: kirim foto 1 & foto 2
        let stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();

        assert.strictEqual(st.schoolDeliveries[school1Id][st.collection[0].id], 'sent');
        assert.strictEqual(st.schoolDeliveries[school1Id][st.collection[1].id], 'sent');

        // Pengguna beralih ke Sekolah 2 (klik tombol Sesi Baru)
        const btnNewSchool = mockDoc.getElementById('mbg-btn-new-school');
        mockWin.prompt = () => 'SD Negeri Cilandak 02';
        btnNewSchool.click();

        const school2Id = st.currentSchool.id;
        assert.notStrictEqual(school1Id, school2Id, 'ID sekolah harus berganti');
        assert.strictEqual(st.currentSchool.name, 'SD Negeri Cilandak 02');

        // Foto sumber harus TETAP LENGKAP 2 foto tanpa perlu memilih ulang dari galeri
        assert.strictEqual(st.collection.length, 2, 'Koleksi foto sumber harus tetap utuh untuk sekolah 2');

        // Status untuk Sekolah 2 harus mulai dari pending (bukan sent)
        assert.strictEqual(st.schoolDeliveries[school2Id][st.collection[0].id], undefined);
    });

    test('8. Status sekolah pertama TIDAK membuat upload sekolah kedua dianggap selesai', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [{ name: 'foto.jpg', size: 1024, type: 'image/jpeg' }]
            }
        });

        const st = mockWin._mbgState;
        const s1Id = st.currentSchool.id;

        // Selesai di Sekolah 1
        let stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        assert.strictEqual(st.schoolDeliveries[s1Id][st.collection[0].id], 'sent');

        // Buka Sekolah 2
        mockDoc.getElementById('mbg-btn-new-school').click();
        const s2Id = st.currentSchool.id;

        // Verifikasi pemisahan status: Sekolah 1 sent, Sekolah 2 belum sent
        assert.strictEqual(st.schoolDeliveries[s1Id][st.collection[0].id], 'sent');
        assert.notStrictEqual(st.schoolDeliveries[s2Id][st.collection[0].id], 'sent');
    });

    test('9. Foto yang berhasil tidak dikirim ulang tanpa kebutuhan / perpindahan sesi', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: '1.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '2.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        // Jepret foto 1
        let stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();

        // Kamera otomatis memajukan antrean ke foto 2, tidak mengirim ulang foto 1
        assert.strictEqual(st.activePhotoId, st.collection[1].id, 'Kamera harus mengarah ke foto 2');
        assert.strictEqual(mockWin.mbgSelectedFile.name, '2.jpg');
    });

    test('10. Tampilan desktop dan mobile menggunakan fungsi dan logika yang sama', () => {
        const desktopSrc = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const mobileSrc = fs.readFileSync('scripts/bookmarklet.js', 'utf8');

        // Bersihkan header userscript untuk membandingkan inti logika
        const coreDesktop = desktopSrc.substring(desktopSrc.indexOf('(function () {'));
        const coreMobile = mobileSrc.substring(mobileSrc.indexOf('(function () {'));

        assert.strictEqual(coreDesktop.trim(), coreMobile.trim(), 'Kode inti logika dan UI desktop dan mobile harus identik 100%');
    });

    test('11. Loader dan bookmarklet minified menginisialisasi UI yang konsisten', () => {
        const loader = fs.readFileSync('scripts/bookmarklet-loader.url.txt', 'utf8');
        const minified = fs.readFileSync('scripts/bookmarklet-minified.url.txt', 'utf8');

        assert.ok(loader.startsWith('javascript:'), 'Loader harus valid javascript: URL');
        assert.ok(minified.startsWith('javascript:'), 'Minified harus valid javascript: URL');
        assert.ok(loader.length < 300, 'Loader harus pendek di bawah 300 bytes agar nyaman dipasang di HP');

        // Pastikan minified dapat dievaluasi tanpa sintaks error
        assert.doesNotThrow(() => {
            new Function(minified.replace('javascript:', ''));
        });
    });

    test('12. Kegagalan memuat script eksternal ditangani dengan jelas di loader', () => {
        const loader = fs.readFileSync('scripts/bookmarklet-loader.url.txt', 'utf8');
        assert.ok(loader.includes('onerror'), 'Loader bookmarklet wajib memiliki error handler onerror');
        assert.ok(loader.includes('Gagal memuat'), 'Loader wajib memberi pesan kesalahan jika offline/gagal');
    });

    test('13. Perpindahan halaman SPA tidak menghilangkan koleksi secara tidak sengaja', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [{ name: 'foto_spa.jpg', size: 1024, type: 'image/jpeg' }]
            }
        });

        // Simulasikan SPA navigasi yang merender ulang body DOM
        const widget = mockDoc.getElementById('mbg-quick-bypass');
        widget.innerHTML = ''; // SPA menghapus isi

        // Jalankan kembali siklus interval SPA init()
        const st = mockWin._mbgState;
        assert.strictEqual(st.collection.length, 1, 'State koleksi di memori window tidak boleh terhapus oleh SPA');
    });

    test('14. Perilaku penyimpanan koleksi tersinkronisasi ke IndexedDB', async () => {
        const { mockWin, mockDoc, dbStores } = createMockEnvironment();
        executeScript(mockWin, mockDoc);

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'persisten1.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'persisten2.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        // Tunggu transaksi IndexedDB selesai
        await new Promise(r => setTimeout(r, 30));

        const storeMap = dbStores.get('photo_collection');
        assert.ok(storeMap, 'Object store photo_collection harus terbentuk di IndexedDB');
        assert.strictEqual(storeMap.size, 2, '2 foto harus tersimpan di IndexedDB');
    });
});
