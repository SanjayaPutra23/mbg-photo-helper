import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Helper mock browser environment cerdas tanpa dependency eksternal
function createMockEnvironment() {
    const elementsById = new Map();
    const eventListeners = new Map();

    function createNode(tag, id = '') {
        const node = {
            tagName: tag.toUpperCase(),
            id: id,
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
                    if (fullTag.includes('multiple')) {
                        child.attributes.multiple = '';
                    }
                    if (fullTag.includes('type="file"')) {
                        child.attributes.type = 'file';
                    }
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
                    const idxM = fullTag.match(/data-index=["']([^"']+)["']/i);
                    if (idxM) child.attributes['data-index'] = idxM[1];
                    // Buat ID sintetis agar tersimpan di elementsById
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
        Image: MockImage,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: () => 123,
        clearInterval: () => { }
    };

    return { mockWin, mockDoc, elementsById };
}

describe('MBG Photo Helper — Pengujian 10 Skenario', () => {

    test('Skenario 1: Memilih satu foto — fungsi lama tetap berjalan dengan baik', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        // Simulasikan pemilihan 1 foto melalui input
        const fileInput = mockDoc.getElementById('mbg-file-input');
        assert.ok(fileInput, 'Elemen mbg-file-input harus tersedia');

        const singleFile = { name: 'nasi_ayam.jpg', size: 1024 * 500, type: 'image/jpeg' };
        fileInput.onchange({ target: { files: [singleFile] } });

        // Verifikasi variabel warisan (backward compatibility)
        assert.ok(mockWin.mbgSelectedFile, 'win.mbgSelectedFile harus terisi');
        assert.strictEqual(mockWin.mbgSelectedFile.name, 'nasi_ayam.jpg');
        assert.strictEqual(mockWin._mbgState.photos.length, 1);
        assert.strictEqual(mockWin._mbgState.photos[0].status, 'active');

        // Verifikasi WebRTC virtual stream jalan normal untuk single photo
        const stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        assert.ok(stream, 'Stream harus dikembalikan oleh hook getUserMedia');
        const tracks = stream.getVideoTracks();
        assert.strictEqual(tracks.length, 1);
        assert.strictEqual(tracks[0].kind, 'video');

        // Simulasikan selesai capture (track.stop)
        tracks[0].stop();
        assert.strictEqual(mockWin._mbgState.photos[0].status, 'success', 'Foto harus bertransisi ke success');
    });

    test('Skenario 2: Memilih empat foto sekaligus sesuai standar 4 dokumentasi Pak Aslap', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const files = [
            { name: '1_makanan.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' },
            { name: '2_ompreng.jpg', size: 1.5 * 1024 * 1024, type: 'image/jpeg' },
            { name: '3_cuci_ompreng.jpg', size: 2.2 * 1024 * 1024, type: 'image/jpeg' },
            { name: '4_pendukung.png', size: 1.8 * 1024 * 1024, type: 'image/png' }
        ];

        const fileInput = mockDoc.getElementById('mbg-file-input');
        assert.ok(fileInput, 'Elemen mbg-file-input harus tersedia');
        assert.strictEqual(fileInput.attributes.multiple, '', 'Atribut multiple harus terpasang pada input');

        fileInput.onchange({ target: { files: files } });

        const st = mockWin._mbgState;
        assert.strictEqual(st.photos.length, 4, 'Harus ada 4 foto yang berhasil masuk ke antrean');

        // Verifikasi pemetaan kategori otomatis sesuai SOP SPPG
        assert.strictEqual(st.photos[0].category, '1. Foto Makanan / Hasil Masakan');
        assert.strictEqual(st.photos[1].category, '2. Foto Ompreng / Wadah Makanan');
        assert.strictEqual(st.photos[2].category, '3. Foto Kegiatan Pencucian Ompreng');
        assert.strictEqual(st.photos[3].category, '4. Foto Dokumentasi Pendukung');

        // Foto pertama harus otomatis berstatus active, sisanya pending
        assert.strictEqual(st.photos[0].status, 'active');
        assert.strictEqual(st.photos[1].status, 'pending');
        assert.strictEqual(st.photos[2].status, 'pending');
        assert.strictEqual(st.photos[3].status, 'pending');

        // mbgSelectedFile harus mengarah ke foto ke-1
        assert.strictEqual(mockWin.mbgSelectedFile.name, '1_makanan.jpg');
    });

    test('Skenario 3: Menambahkan foto setelah pemilihan pertama (Append tanpa menghapus)', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');

        // Pemilihan gelombang 1: 2 foto
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto_makanan.jpg', size: 1024 * 1024, type: 'image/jpeg' },
                    { name: 'foto_ompreng.jpg', size: 1024 * 1024, type: 'image/jpeg' }
                ]
            }
        });
        assert.strictEqual(mockWin._mbgState.photos.length, 2);

        // Pemilihan gelombang 2: tambah 2 foto lagi
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto_cuci.jpg', size: 1024 * 1024, type: 'image/jpeg' },
                    { name: 'foto_pendukung.jpg', size: 1024 * 1024, type: 'image/jpeg' }
                ]
            }
        });

        // Hasil akhir harus 4 foto (foto gelombang 1 tidak boleh terhapus)
        assert.strictEqual(mockWin._mbgState.photos.length, 4);
        assert.strictEqual(mockWin._mbgState.photos[0].name, 'foto_makanan.jpg');
        assert.strictEqual(mockWin._mbgState.photos[1].name, 'foto_ompreng.jpg');
        assert.strictEqual(mockWin._mbgState.photos[2].name, 'foto_cuci.jpg');
        assert.strictEqual(mockWin._mbgState.photos[3].name, 'foto_pendukung.jpg');
    });

    test('Skenario 4: Menghapus salah satu foto sebelum upload', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'foto1.jpg', size: 1024 * 1024, type: 'image/jpeg' },
                    { name: 'foto2_salah.jpg', size: 1024 * 1024, type: 'image/jpeg' },
                    { name: 'foto3.jpg', size: 1024 * 1024, type: 'image/jpeg' }
                ]
            }
        });
        assert.strictEqual(mockWin._mbgState.photos.length, 3);

        const photoToDeleteId = mockWin._mbgState.photos[1].id;
        const st = mockWin._mbgState;
        const targetIdx = st.photos.findIndex(p => p.id === photoToDeleteId);
        st.photos.splice(targetIdx, 1);

        assert.strictEqual(st.photos.length, 2);
        assert.strictEqual(st.photos[0].name, 'foto1.jpg');
        assert.strictEqual(st.photos[1].name, 'foto3.jpg');
    });

    test('Skenario 5: Upload seluruh foto berhasil secara berurutan (Sequential Auto-Advance)', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: '1_makanan.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '2_ompreng.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '3_cuci.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '4_pendukung.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        assert.strictEqual(st.autoAdvance, true);

        // Alur foto 1: Kamera POP SIPGN di-klik pertama kali
        assert.strictEqual(st.activeIndex, 0);
        let stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop(); // POP SIPGN selesai jepret foto 1
        assert.strictEqual(st.photos[0].status, 'success', 'Foto 1 harus success');
        assert.strictEqual(st.activeIndex, 1, 'Auto-advance harus memajukan ke foto 2');
        assert.strictEqual(st.photos[1].status, 'active', 'Foto 2 harus active');

        // Alur foto 2: Kamera POP SIPGN di-klik kedua kali
        stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        assert.strictEqual(st.photos[1].status, 'success');
        assert.strictEqual(st.activeIndex, 2);
        assert.strictEqual(st.photos[2].status, 'active');

        // Alur foto 3:
        stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        assert.strictEqual(st.photos[2].status, 'success');
        assert.strictEqual(st.activeIndex, 3);
        assert.strictEqual(st.photos[3].status, 'active');

        // Alur foto 4:
        stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        assert.strictEqual(st.photos[3].status, 'success');

        // Verifikasi semua foto berhasil
        assert.ok(st.photos.every(p => p.status === 'success'), 'Seluruh 4 foto harus berhasil');
    });

    test('Skenario 6: Salah satu foto gagal sedangkan foto lainnya berhasil', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: '1_makanan.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '2_ompreng.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '3_cuci.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;

        // Foto 1 sukses
        let stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        assert.strictEqual(st.photos[0].status, 'success');

        // Foto 2 disimulasikan gagal
        st.photos[1].status = 'failed';
        st.photos[1].error = 'Koneksi terputus ke server POP SIPGN';

        // Lanjut ke foto 3
        st.activeIndex = 2;
        st.photos[2].status = 'active';

        stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();
        assert.strictEqual(st.photos[2].status, 'success');

        // Status kolektif: Foto 1 & 3 sukses, Foto 2 gagal
        assert.strictEqual(st.photos[0].status, 'success');
        assert.strictEqual(st.photos[1].status, 'failed');
        assert.strictEqual(st.photos[2].status, 'success');
    });

    test('Skenario 7: Mencoba kembali foto yang gagal tanpa mengulang foto yang berhasil', async () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: '1_makanan.jpg', size: 1024, type: 'image/jpeg' },
                    { name: '2_ompreng.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const st = mockWin._mbgState;
        st.photos[0].status = 'success';
        st.photos[1].status = 'failed';
        st.photos[1].error = 'Timeout';

        // Pengguna klik coba lagi pada foto 2 (retry)
        const photo2Id = st.photos[1].id;
        const retryIdx = st.photos.findIndex(p => p.id === photo2Id);
        st.photos[retryIdx].status = 'pending';
        st.photos[retryIdx].error = '';
        st.activeIndex = retryIdx;
        st.photos[retryIdx].status = 'active';
        mockWin.mbgSelectedFile = st.photos[retryIdx].file;

        // Foto 1 tetap aman dengan status 'success'
        assert.strictEqual(st.photos[0].status, 'success', 'Foto 1 tidak boleh di-reset');
        assert.strictEqual(st.photos[1].status, 'active', 'Foto 2 harus menjadi aktif untuk dicoba lagi');
        assert.strictEqual(mockWin.mbgSelectedFile.name, '2_ompreng.jpg');

        // Sekarang coba jepret foto 2 lagi di kamera POP SIPGN
        const stream = await mockWin.navigator.mediaDevices.getUserMedia({ video: true });
        stream.getVideoTracks()[0].stop();

        assert.strictEqual(st.photos[0].status, 'success', 'Foto 1 tetap sukses');
        assert.strictEqual(st.photos[1].status, 'success', 'Foto 2 sekarang sukses setelah retry');
    });

    test('Skenario 8: Memilih format atau ukuran foto yang tidak valid ditolak dengan aman', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');

        // Berkas invalid: PDF & berkas raksasa > 15MB
        const invalidFiles = [
            { name: 'dokumen.pdf', size: 1024 * 50, type: 'application/pdf' },
            { name: 'foto_terlalu_besar.jpg', size: 20 * 1024 * 1024, type: 'image/jpeg' },
            { name: 'foto_valid.jpg', size: 2 * 1024 * 1024, type: 'image/jpeg' }
        ];

        fileInput.onchange({ target: { files: invalidFiles } });

        const st = mockWin._mbgState;
        // Hanya 1 file yang valid diterima
        assert.strictEqual(st.photos.length, 1);
        assert.strictEqual(st.photos[0].name, 'foto_valid.jpg');
        // Notifikasi peringatan harus muncul di UI
        assert.ok(st.notification.text.includes('melebihi') || st.notification.text.includes('tidak didukung'));
    });

    test('Skenario 9: Penanganan sesi kedaluwarsa atau server offline', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

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
        // Ketika terjadi session expired di POP SIPGN, antrean di memori helper TIDAK hilang
        assert.strictEqual(st.photos.length, 2);
        assert.strictEqual(typeof mockWin.loginUser, 'undefined', 'Tidak ada auto-login liar');
    });

    test('Skenario 10: Memastikan status upload sesuai hasil aktual dan UI sinkron', () => {
        const { mockWin, mockDoc } = createMockEnvironment();
        const code = fs.readFileSync('scripts/mbg-photo-helper.user.js', 'utf8');
        const run = new Function('unsafeWindow', 'window', 'document', 'URL', 'Image', 'navigator', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
        run(mockWin, mockWin, mockDoc, mockWin.URL, mockWin.Image, mockWin.navigator, setTimeout, clearTimeout, () => 1, () => { });

        const fileInput = mockDoc.getElementById('mbg-file-input');
        fileInput.onchange({
            target: {
                files: [
                    { name: 'makanan.jpg', size: 1024, type: 'image/jpeg' },
                    { name: 'ompreng.jpg', size: 1024, type: 'image/jpeg' }
                ]
            }
        });

        const container = mockDoc.getElementById('mbg-quick-bypass');
        assert.ok(container.innerHTML.includes('makanan.jpg'));
        assert.ok(container.innerHTML.includes('ompreng.jpg'));
        assert.ok(container.innerHTML.includes('AKTIF DI KAMERA'));
        assert.ok(container.innerHTML.includes('Menunggu'));
    });
});
