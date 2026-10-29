// ==UserScript==
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

(function () {
    'use strict';
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const doc = document;

    const DEFAULT_CATEGORIES = [
        '1. Foto Makanan / Hasil Masakan',
        '2. Foto Ompreng / Wadah Makanan',
        '3. Foto Kegiatan Pencucian Ompreng',
        '4. Foto Dokumentasi Pendukung'
    ];
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    const VALID_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

    if (!win._mbgState) {
        win._mbgState = {
            collection: [],
            activePhotoId: null,
            replaceTargetId: null,
            currentSchool: { id: 'sch_default', name: 'Sekolah #1' },
            schoolDeliveries: { sch_default: {} },
            autoAdvance: true,
            minimized: false,
            notification: { text: '', type: 'info', timer: null },
            storageReady: false
        };
    }
    const state = win._mbgState;
    if (!state.schoolDeliveries) state.schoolDeliveries = {};
    if (state.currentSchool && !state.schoolDeliveries[state.currentSchool.id]) {
        state.schoolDeliveries[state.currentSchool.id] = {};
    }

    // 1. IndexedDB Helper Ringkas
    const DB_NAME = 'MBG_PhotoHelper_DB';
    const STORE_NAME = 'photo_collection';
    function withDB(mode, fn) {
        return new Promise((resolve) => {
            if (!win.indexedDB) return resolve(null);
            const req = win.indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            };
            req.onsuccess = () => {
                try {
                    const tx = req.result.transaction(STORE_NAME, mode);
                    const store = tx.objectStore(STORE_NAME);
                    const res = fn(store);
                    tx.oncomplete = () => resolve(res && 'result' in res ? res.result : true);
                    tx.onerror = () => resolve(null);
                } catch (e) { resolve(null); }
            };
            req.onerror = () => resolve(null);
        });
    }

    const dbSavePhoto = (item) => withDB('readwrite', s => s.put({ id: item.id, file: item.file, name: item.name, size: item.size, category: item.category, addedAt: item.addedAt || Date.now() }));
    const dbDeletePhoto = (id) => withDB('readwrite', s => s.delete(id));
    const dbClearPhotos = () => withDB('readwrite', s => s.clear());
    const dbLoadAllPhotos = () => withDB('readonly', s => s.getAll()).then(r => r || []);

    async function restoreCollectionFromStorage() {
        if (state.storageReady || state.collection.length > 0) return;
        state.storageReady = true;
        try {
            const items = await dbLoadAllPhotos();
            if (items && items.length > 0 && state.collection.length === 0) {
                items.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
                items.forEach(it => {
                    if (it.file && !state.collection.some(p => p.id === it.id)) {
                        state.collection.push({
                            id: it.id, file: it.file, name: it.name, size: it.size,
                            url: URL.createObjectURL(it.file), category: it.category, addedAt: it.addedAt
                        });
                    }
                });
                if (!state.activePhotoId && state.collection.length > 0) state.activePhotoId = state.collection[0].id;
                syncLegacy();
                showNotification(`${items.length} foto dipulihkan dari penyimpanan lokal. Siap digunakan!`, 'info', 3000);
                renderWidget();
            }
        } catch (e) { }
    }

    // 2. Sekolah & Status Pengiriman
    const getActiveSchoolId = () => (state.currentSchool && state.currentSchool.id) || 'sch_default';
    function getPhotoDeliveryStatus(photoId, sId) {
        const id = sId || getActiveSchoolId();
        if (!state.schoolDeliveries[id]) state.schoolDeliveries[id] = {};
        return state.schoolDeliveries[id][photoId] || 'pending';
    }
    function setPhotoDeliveryStatus(photoId, status, sId) {
        const id = sId || getActiveSchoolId();
        if (!state.schoolDeliveries[id]) state.schoolDeliveries[id] = {};
        state.schoolDeliveries[id][photoId] = status;
    }

    function startNewSchoolSession(customName = '') {
        const count = Object.keys(state.schoolDeliveries).length + 1;
        const name = customName || `Sekolah #${count}`;
        const newId = 'sch_' + Date.now() + '_' + count;
        state.currentSchool = { id: newId, name };
        state.schoolDeliveries[newId] = {};
        state.activePhotoId = state.collection.length > 0 ? state.collection[0].id : null;
        syncLegacy();
        showNotification(`Sesi baru dimulai untuk [${name}]. Koleksi foto Anda tetap utuh dan siap digunakan.`, 'success', 4000);
        renderWidget();
    }

    function detectSchoolContext() {
        try {
            const els = doc.querySelectorAll('h1, h2, h3, h4, .school-name, .text-primary, [data-school]');
            for (let el of els) {
                const txt = el.innerText ? el.innerText.trim() : '';
                if (txt && /SD|SMP|SMA|SPPG|Sekolah/.test(txt)) {
                    if (state.currentSchool.name !== txt && !state.currentSchool.name.startsWith(txt)) {
                        state.currentSchool.name = txt;
                        renderWidget();
                    }
                    break;
                }
            }
        } catch (e) { }
    }

    // 3. Validasi & Pengelolaan Foto
    function validatePhoto(file) {
        if (!file) return { valid: false, error: 'Berkas tidak ditemukan.' };
        const name = (file.name || '').toLowerCase();
        const validExt = VALID_EXTS.some(x => name.endsWith(x));
        const isImg = file.type ? file.type.startsWith('image/') : false;
        if (!validExt && !isImg) return { valid: false, error: `Format "${file.name}" tidak didukung. Harap pilih berkas JPG, PNG, atau WEBP.` };
        if (file.size > MAX_FILE_SIZE) return { valid: false, error: `Ukuran "${file.name}" (${(file.size / 1048576).toFixed(1)} MB) melebihi batas 15 MB.` };
        return { valid: true };
    }

    function formatSize(b) {
        if (!b) return '0 B';
        return b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
    }

    function showNotification(text, type = 'info', timeoutMs = 4000) {
        if (state.notification.timer) clearTimeout(state.notification.timer);
        state.notification.text = text;
        state.notification.type = type;
        if (timeoutMs > 0) {
            state.notification.timer = setTimeout(() => {
                state.notification.text = '';
                state.notification.timer = null;
                renderWidget();
            }, timeoutMs);
        }
        renderWidget();
    }

    const getActivePhoto = () => state.collection.find(p => p.id === state.activePhotoId) || state.collection[0] || null;
    function syncLegacy() {
        const a = getActivePhoto();
        win.mbgSelectedFile = (a && a.file) ? a.file : null;
        win.mbgPhotoList = state.collection;
    }

    function addPhotos(fileList) {
        if (!fileList || !fileList.length) return;
        if (state.replaceTargetId) {
            const target = state.collection.find(p => p.id === state.replaceTargetId);
            state.replaceTargetId = null;
            if (target && fileList[0]) {
                const val = validatePhoto(fileList[0]);
                if (!val.valid) return showNotification(val.error, 'warn', 4000);
                try { URL.revokeObjectURL(target.url); } catch (e) { }
                target.file = fileList[0];
                target.name = fileList[0].name;
                target.size = fileList[0].size;
                target.url = URL.createObjectURL(fileList[0]);
                setPhotoDeliveryStatus(target.id, 'pending');
                state.activePhotoId = target.id;
                dbSavePhoto(target);
                syncLegacy();
                showNotification(`Foto [${target.category}] berhasil diganti.`, 'success', 3500);
                renderWidget();
                return;
            }
        }

        let added = 0;
        let lastErr = null;
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            const v = validatePhoto(f);
            if (!v.valid) { lastErr = v.error; continue; }
            const len = state.collection.length;
            const item = {
                id: 'mbg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                file: f, name: f.name, size: f.size, url: URL.createObjectURL(f),
                category: len < DEFAULT_CATEGORIES.length ? DEFAULT_CATEGORIES[len] : `Dokumentasi Tambahan #${len + 1}`,
                addedAt: Date.now()
            };
            state.collection.push(item);
            dbSavePhoto(item);
            added++;
        }
        if (!state.activePhotoId && state.collection.length > 0) state.activePhotoId = state.collection[0].id;
        syncLegacy();
        if (lastErr) showNotification(lastErr, 'warn', 5000);
        else if (added > 0) showNotification(`${added} foto ditambahkan ke koleksi sumber.`, 'success', 3500);
        renderWidget();
    }

    function removePhoto(id) {
        const idx = state.collection.findIndex(p => p.id === id);
        if (idx === -1) return;
        try { URL.revokeObjectURL(state.collection[idx].url); } catch (e) { }
        state.collection.splice(idx, 1);
        dbDeletePhoto(id);
        if (state.activePhotoId === id) state.activePhotoId = state.collection.length > 0 ? state.collection[0].id : null;
        syncLegacy();
        showNotification('Foto dihapus dari koleksi.', 'info', 2500);
        renderWidget();
    }

    function clearAllPhotos() {
        state.collection.forEach(p => { try { URL.revokeObjectURL(p.url); } catch (e) { } });
        state.collection = [];
        state.activePhotoId = null;
        state.replaceTargetId = null;
        state.schoolDeliveries = {};
        dbClearPhotos();
        syncLegacy();
        showNotification('Koleksi foto telah dikosongkan.', 'info', 2500);
        renderWidget();
    }

    function selectPhotoForCamera(id) {
        const p = state.collection.find(x => x.id === id);
        if (!p) return;
        state.activePhotoId = id;
        syncLegacy();
        showNotification(`Foto siap di kamera: ${p.category}`, 'info', 3000);
        renderWidget();
    }

    function retryPhotoForSchool(id) {
        setPhotoDeliveryStatus(id, 'pending');
        selectPhotoForCamera(id);
        showNotification('Foto disiapkan ulang untuk pengiriman sekolah ini.', 'info', 3000);
    }

    function triggerReplacePhoto(id) {
        state.replaceTargetId = id;
        const fi = doc.getElementById('mbg-file-input');
        if (fi) { fi.value = ''; fi.removeAttribute('multiple'); fi.click(); }
    }

    function advanceQueue() {
        const sId = getActiveSchoolId();
        const next = state.collection.find(p => getPhotoDeliveryStatus(p.id, sId) === 'pending');
        if (next) {
            state.activePhotoId = next.id;
            syncLegacy();
            showNotification(`Kamera siap untuk: ${next.category}`, 'info', 3000);
        } else {
            if (state.collection.length > 0 && state.collection.every(p => getPhotoDeliveryStatus(p.id, sId) === 'sent')) {
                showNotification(`Semua ${state.collection.length} foto untuk [${state.currentSchool.name}] selesai terisi! 🎉 Anda dapat berganti ke sekolah berikutnya.`, 'success', 6000);
            }
            syncLegacy();
        }
        renderWidget();
    }

    // 4. Intersepsi Input File POP SIPGN
    function isFileInput(el) {
        if (!el || el.id === 'mbg-file-input') return false;
        return (el.tagName || '').toUpperCase() === 'INPUT' && (el.type || (el.getAttribute && el.getAttribute('type')) || '').toLowerCase() === 'file';
    }

    let lastInjectedInput = null;
    let lastInjectedTime = 0;

    function injectPhotoIntoInput(inputEl, activePhoto) {
        if (!inputEl || !activePhoto || !activePhoto.file) return false;
        const now = Date.now();
        if (inputEl._mbgLastInject && (now - inputEl._mbgLastInject < 800)) {
            return true;
        }
        inputEl._mbgLastInject = now;

        try {
            const DT = win.DataTransfer || (typeof DataTransfer !== 'undefined' ? DataTransfer : null);
            if (DT) {
                try {
                    const dt = new DT();
                    if (dt.items && dt.items.add) dt.items.add(activePhoto.file);
                    if (dt.files) inputEl.files = dt.files;
                } catch (e) {
                    try { inputEl.files = [activePhoto.file]; } catch (e2) { }
                }
            } else {
                try { inputEl.files = [activePhoto.file]; } catch (e3) { }
            }

            win.mbgSelectedFile = activePhoto.file;
            const Evt = win.Event || (typeof Event !== 'undefined' ? Event : null);
            if (Evt && inputEl.dispatchEvent) {
                try { inputEl.dispatchEvent(new Evt('change', { bubbles: true })); } catch (e) { }
                try { inputEl.dispatchEvent(new Evt('input', { bubbles: true })); } catch (e) { }
            }
            if (typeof inputEl.onchange === 'function') try { inputEl.onchange({ target: inputEl }); } catch (e) { }
            if (typeof inputEl.oninput === 'function') try { inputEl.oninput({ target: inputEl }); } catch (e) { }

            try {
                // Perbarui thumbnail hanya pada card wadah input ini (hindari parent global doc/body)
                const card = inputEl.closest ? inputEl.closest('.photo-card, .preview-box, [data-photo-slot], .form-group') : null;
                if (card) {
                    const img = card.querySelector('img');
                    if (img) img.src = activePhoto.url;
                }
            } catch (e) { }

            setPhotoDeliveryStatus(activePhoto.id, 'sent');
            if (state.autoAdvance) advanceQueue();
            else { syncLegacy(); renderWidget(); }
            showNotification(`✓ [${activePhoto.category}] berhasil dimasukkan!`, 'success', 3500);
            return true;
        } catch (err) {
            return false;
        }
    }

    function handleInputInjection(inputEl) {
        if (!isFileInput(inputEl)) return false;
        const now = Date.now();
        if (lastInjectedInput === inputEl && (now - lastInjectedTime < 800)) {
            return true;
        }
        const a = getActivePhoto();
        if (!a || !a.file) return false;
        lastInjectedInput = inputEl;
        lastInjectedTime = now;
        return injectPhotoIntoInput(inputEl, a);
    }

    function setupInputInterception() {
        if (win._mbgInputHooked) return;
        win._mbgInputHooked = true;
        const HtmlInput = win.HTMLInputElement || (typeof HTMLInputElement !== 'undefined' ? HTMLInputElement : null);
        if (HtmlInput && HtmlInput.prototype) {
            const orig = HtmlInput.prototype.click;
            HtmlInput.prototype.click = function () {
                if (isFileInput(this)) {
                    if (handleInputInjection(this)) return;
                }
                return orig ? orig.apply(this, arguments) : undefined;
            };
        }
        if (typeof doc !== 'undefined' && doc.addEventListener) {
            doc.addEventListener('click', function (e) {
                let target = null;
                if (e.target && isFileInput(e.target)) target = e.target;
                else if (e.target && e.target.closest) {
                    const lbl = e.target.closest('label');
                    if (lbl) {
                        const forId = lbl.getAttribute ? lbl.getAttribute('for') : null;
                        const el = forId ? doc.getElementById(forId) : lbl.querySelector('input[type="file"]');
                        if (isFileInput(el)) target = el;
                    }
                }
                if (target) {
                    if (handleInputInjection(target)) {
                        if (e.preventDefault) e.preventDefault();
                        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                        else if (e.stopPropagation) e.stopPropagation();
                    }
                }
            }, true);
        }
    }

    // 5. WebRTC Virtual Camera
    let activeStreamPhoto = null;

    function hookWebRTC() {
        if (win._mbgGUMHooked) return;
        if (!win.navigator || !win.navigator.mediaDevices || !win.navigator.mediaDevices.getUserMedia) return;
        win._mbgGUMHooked = true;
        const oldGUM = win.navigator.mediaDevices.getUserMedia.bind(win.navigator.mediaDevices);

        // Hook Canvas drawImage agar jepretan POP SIPGN otomatis memajukan antrean
        if (win.CanvasRenderingContext2D && win.CanvasRenderingContext2D.prototype && !win._mbgDrawImageHooked) {
            win._mbgDrawImageHooked = true;
            const origDraw = win.CanvasRenderingContext2D.prototype.drawImage;
            win.CanvasRenderingContext2D.prototype.drawImage = function (image) {
                try {
                    if (image && (image.tagName === 'VIDEO' || (typeof HTMLVideoElement !== 'undefined' && image instanceof HTMLVideoElement))) {
                        const cur = getActivePhoto();
                        if (cur && getPhotoDeliveryStatus(cur.id) === 'pending') {
                            setPhotoDeliveryStatus(cur.id, 'sent');
                            if (state.autoAdvance) advanceQueue();
                            else { syncLegacy(); renderWidget(); }
                        }
                    }
                } catch (e) { }
                return origDraw.apply(this, arguments);
            };
        }

        const virtualGUM = async function (constraints) {
            if (activeStreamPhoto && getPhotoDeliveryStatus(activeStreamPhoto.id) === 'pending') {
                setPhotoDeliveryStatus(activeStreamPhoto.id, 'sent');
                if (state.autoAdvance) advanceQueue();
            }

            let a = getActivePhoto();
            if (state.autoAdvance && a && getPhotoDeliveryStatus(a.id) === 'sent') {
                advanceQueue();
                a = getActivePhoto();
            }
            activeStreamPhoto = a;

            if (constraints && constraints.video && a && a.file) {
                try {
                    const canvas = doc.createElement('canvas');
                    const img = new win.Image();
                    img.src = a.url;
                    await new Promise(r => {
                        if (img.complete && img.naturalWidth) return r();
                        img.onload = () => r();
                        img.onerror = () => r();
                        setTimeout(r, 2000);
                    });

                    let w = img.naturalWidth || 1280;
                    let h = img.naturalHeight || 720;
                    const maxDim = 1280;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                        else { w = Math.round((w * maxDim) / h); h = maxDim; }
                    }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);

                    const stream = canvas.captureStream ? canvas.captureStream(20) : (canvas.mozCaptureStream ? canvas.mozCaptureStream(20) : null);
                    if (!stream) throw new Error('captureStream tidak didukung');

                    const interval = setInterval(() => {
                        try { ctx.drawImage(img, 0, 0, w, h); } catch (e) { clearInterval(interval); }
                    }, 50);

                    const track = stream.getVideoTracks()[0];
                    if (track) {
                        let fin = false;
                        const onEnd = () => {
                            if (fin) return;
                            fin = true;
                            clearInterval(interval);
                            activeStreamPhoto = null;
                            setPhotoDeliveryStatus(a.id, 'sent');
                            if (state.autoAdvance) advanceQueue();
                            else { syncLegacy(); renderWidget(); }
                        };
                        const origStop = track.stop.bind(track);
                        track.stop = function () { origStop(); onEnd(); };
                        track.addEventListener('ended', onEnd);
                    }
                    showNotification(`Mengalirkan [${a.category}] ke kamera...`, 'info', 3000);
                    renderWidget();
                    return stream;
                } catch (err) {
                    setPhotoDeliveryStatus(a.id, 'failed');
                    showNotification('Gagal mengalirkan foto: ' + (err.message || 'Error'), 'error', 5000);
                    renderWidget();
                    throw err;
                }
            }
            return oldGUM(constraints);
        };

        win.navigator.mediaDevices.getUserMedia = virtualGUM;
        if (typeof MediaDevices !== 'undefined' && MediaDevices.prototype && MediaDevices.prototype.getUserMedia) {
            MediaDevices.prototype.getUserMedia = virtualGUM;
        }
        if (win.navigator.getUserMedia) win.navigator.getUserMedia = (c, s, e) => virtualGUM(c).then(s).catch(e);
        if (win.navigator.webkitGetUserMedia) win.navigator.webkitGetUserMedia = (c, s, e) => virtualGUM(c).then(s).catch(e);
    }

    // 6. Capture Attribute Stripper
    function cleanCaptureAttributes() {
        doc.querySelectorAll('input[type="file"]').forEach(i => {
            if (i.id !== 'mbg-file-input' && i.hasAttribute('capture')) i.removeAttribute('capture');
        });
    }
    function setupCaptureObserver() {
        if (win._mbgObserverHooked) return;
        win._mbgObserverHooked = true;
        cleanCaptureAttributes();
        const Obs = win.MutationObserver || (typeof MutationObserver !== 'undefined' ? MutationObserver : null);
        if (Obs && doc.body) new Obs(cleanCaptureAttributes).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['capture'] });
    }

    // 7. Render UI
    function ensureStyles() {
        if (doc.getElementById('mbg-styles')) return;
        const s = doc.createElement('style');
        s.id = 'mbg-styles';
        s.textContent = `
#mbg-quick-bypass{position:fixed;bottom:16px;right:16px;z-index:999999999;background:#0f172a;color:#f8fafc;border:2px solid #3b82f6;border-radius:14px;padding:12px 14px;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.6);width:340px;max-width:calc(100vw - 28px);box-sizing:border-box;font-size:13px;line-height:1.4}
#mbg-quick-bypass.min{border-radius:24px;padding:8px 14px;width:auto;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
.mbg-flex{display:flex;align-items:center}
.mbg-sb{display:flex;align-items:center;justify-content:space-between}
.mbg-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;display:inline-block}
.mbg-btn{background:#2563eb;color:#fff;border:none;border-radius:6px;padding:8px 10px;font-size:12px;font-weight:bold;cursor:pointer}
.mbg-btn-s{border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;font-weight:bold}
.mbg-badge{font-size:9px;font-weight:bold;padding:1px 6px;border-radius:10px}
.mbg-card{display:flex;align-items:center;gap:8px;border-radius:8px;padding:6px 8px;margin-bottom:6px;border:1px solid #334155;background:#0f172a}
.mbg-card.act{border:2px solid #38bdf8;background:#1e293b}
.mbg-ell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
        (doc.head || doc.body || doc.documentElement).appendChild(s);
    }

    function renderDeliveryBadge(st, act) {
        if (act) return `<span class="mbg-badge" style="background:#0284c7;color:#fff;">📷 SIAP DI KAMERA</span>`;
        if (st === 'sent') return `<span class="mbg-badge" style="background:#166534;color:#86efac;">✓ Terkirim</span>`;
        if (st === 'failed') return `<span class="mbg-badge" style="background:#991b1b;color:#fca5a5;">✕ Gagal</span>`;
        return `<span class="mbg-badge" style="background:#334155;color:#cbd5e1;">Menunggu</span>`;
    }

    function renderCardActions(p, act, st) {
        let h = `<button class="mbg-btn-s" data-action="replace" data-id="${p.id}" title="Ganti foto ini" style="background:#334155;color:#cbd5e1;">Ganti</button>`;
        if (!act) h += `<button class="mbg-btn-s" data-action="select" data-id="${p.id}" title="Pilih ke kamera" style="background:#1e293b;color:#38bdf8;border:1px solid #3b82f6;">Pilih ke Kamera</button>`;
        if (st === 'failed') h += `<button class="mbg-btn-s" data-action="retry" data-id="${p.id}" title="Coba lagi" style="background:#991b1b;color:#fecaca;">Ulangi</button>`;
        h += `<button data-action="remove" data-id="${p.id}" title="Hapus" style="background:transparent;color:#94a3b8;border:none;font-size:12px;cursor:pointer;padding:2px 4px;">✕</button>`;
        return h;
    }

    function renderWidget() {
        let el = doc.getElementById('mbg-quick-bypass');
        if (!el) {
            el = doc.createElement('div');
            el.id = 'mbg-quick-bypass';
            if (doc.body) doc.body.appendChild(el);
            else return;
        }
        ensureStyles();

        const total = state.collection.length;
        const sId = getActiveSchoolId();
        const sent = state.collection.filter(p => getPhotoDeliveryStatus(p.id, sId) === 'sent').length;
        const failed = state.collection.filter(p => getPhotoDeliveryStatus(p.id, sId) === 'failed').length;

        if (state.minimized) {
            el.className = 'min';
            el.innerHTML = `
                <span class="mbg-dot"></span>
                <span style="font-weight:bold;">MBG (${sent}/${total} Terisi)</span>
                <button id="mbg-btn-expand" class="mbg-btn" style="padding:2px 8px;border-radius:12px;font-size:11px;">Buka</button>
            `;
            el.onclick = () => { state.minimized = false; renderWidget(); };
            return;
        }

        el.className = '';
        el.onclick = null;

        let h = `
            <div class="mbg-sb" style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #334155;">
                <div class="mbg-flex" style="gap:8px;">
                    <span class="mbg-dot"></span>
                    <strong style="font-size:13px;color:#f8fafc;">MBG Photo Helper</strong>
                    <span style="background:#1e293b;color:#38bdf8;border:1px solid #3b82f6;border-radius:6px;font-size:10px;padding:1px 5px;font-weight:bold;">v2.2</span>
                </div>
                <button id="mbg-btn-minimize" title="Kecilkan" style="background:#334155;color:#cbd5e1;border:none;border-radius:6px;width:24px;height:24px;font-size:13px;cursor:pointer;">−</button>
            </div>
            <div style="background:#1e293b;border-radius:8px;padding:8px 10px;margin-bottom:8px;border:1px solid #334155;">
                <div class="mbg-sb" style="margin-bottom:4px;">
                    <span class="mbg-ell" style="font-size:11px;font-weight:bold;color:#38bdf8;" title="${esc(state.currentSchool.name)}">🏫 ${esc(state.currentSchool.name)}</span>
                    <button id="mbg-btn-new-school" class="mbg-btn-s" style="background:#2563eb;color:#fff;">🔄 Sesi Baru</button>
                </div>
                <div class="mbg-sb" style="font-size:10px;color:#94a3b8;margin-bottom:4px;">
                    <span>Koleksi: ${total} Foto</span>
                    <span style="font-weight:bold;color:${sent === total && total > 0 ? '#4ade80' : '#38bdf8'};">${sent}/${total} Terisi ${failed > 0 ? `(${failed} Gagal)` : ''}</span>
                </div>
                <div style="width:100%;height:5px;background:#334155;border-radius:3px;overflow:hidden;">
                    <div style="width:${total > 0 ? Math.round((sent / total) * 100) : 0}%;height:100%;background:#22c55e;transition:width .3s;"></div>
                </div>
            </div>
        `;

        if (state.notification.text) {
            const bg = { info: 'background:#1e3a8a;color:#bfdbfe;border:1px solid #3b82f6;', success: 'background:#14532d;color:#bbf7d0;border:1px solid #22c55e;', warn: 'background:#713f12;color:#fef08a;border:1px solid #eab308;', error: 'background:#7f1d1d;color:#fecaca;border:1px solid #ef4444;' };
            h += `<div style="padding:6px 10px;border-radius:6px;font-size:11px;margin-bottom:8px;${bg[state.notification.type] || bg.info}">${esc(state.notification.text)}</div>`;
        }

        h += `
            <div style="display:flex;gap:6px;margin-bottom:8px;">
                <button id="mbg-btn-add" class="mbg-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;"><span>📁</span> + Pilih / Tambah Foto</button>
                <input type="file" id="mbg-file-input" accept="image/jpeg,image/png,image/webp,image/jpg" multiple style="position:fixed;top:-9999px;opacity:0;width:1px;height:1px;" />
                ${total > 0 ? `<button id="mbg-btn-clear" class="mbg-btn" style="background:#334155;color:#f87171;">✕ Reset</button>` : ''}
            </div>
        `;

        if (total > 0) {
            h += `
                <div class="mbg-sb" style="font-size:11px;color:#cbd5e1;margin-bottom:8px;padding:0 2px;">
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="mbg-chk-autonext" ${state.autoAdvance ? 'checked' : ''} /> Otomatis lanjut foto berikutnya</label>
                    <button id="mbg-btn-next" class="mbg-btn-s" style="background:#1e293b;color:#38bdf8;border:1px solid #3b82f6;">Lewati >></button>
                </div>
            `;
        }

        if (total === 0) {
            h += `<div style="border:2px dashed #334155;border-radius:8px;padding:16px 12px;text-align:center;color:#94a3b8;font-size:11px;margin-bottom:8px;">Belum ada foto dalam koleksi.<br/>Klik <strong>"+ Pilih / Tambah Foto"</strong> untuk memilih foto dokumentasi.<br/><span style="color:#38bdf8;font-size:10px;margin-top:4px;display:inline-block;">💡 Foto tersimpan dan dapat dipakai berulang.</span></div>`;
        } else {
            h += `<div style="max-height:210px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding-right:2px;margin-bottom:8px;">`;
            state.collection.forEach(p => {
                const act = p.id === state.activePhotoId;
                const st = getPhotoDeliveryStatus(p.id, sId);
                h += `
                    <div class="mbg-card ${act ? 'act' : ''}">
                        <img src="${p.url}" style="width:46px;height:46px;object-fit:cover;border-radius:6px;border:1px solid #475569;flex-shrink:0;" alt="thumb" />
                        <div style="flex:1;min-width:0;">
                            <div class="mbg-ell" style="font-size:11px;font-weight:bold;color:#f8fafc;">${esc(p.category)}</div>
                            <div class="mbg-ell" style="font-size:10px;color:#94a3b8;">${esc(p.name)} (${formatSize(p.size)})</div>
                            <div style="margin-top:2px;display:flex;align-items:center;gap:4px;">${renderDeliveryBadge(st, act)}</div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">${renderCardActions(p, act, st)}</div>
                    </div>
                `;
            });
            h += `</div>`;
        }

        h += `
            <div class="mbg-sb" style="font-size:10px;color:#64748b;border-top:1px solid #1e293b;padding-top:6px;">
                <span>💾 Koleksi Tersimpan (Pakai Berulang)</span>
                <span>${total} foto</span>
            </div>
        `;
        el.innerHTML = h;

        const fi = el.querySelector('#mbg-file-input');
        const add = el.querySelector('#mbg-btn-add');
        if (add && fi) {
            add.onclick = () => { state.replaceTargetId = null; fi.value = ''; fi.setAttribute('multiple', ''); fi.click(); };
            fi.onchange = (e) => { const fl = (e && e.target && e.target.files) ? e.target.files : fi.files; if (fl && fl.length) addPhotos(fl); };
        }
        const bns = el.querySelector('#mbg-btn-new-school');
        if (bns) {
            bns.onclick = () => {
                const p = win.prompt ? win.prompt.bind(win) : (typeof prompt !== 'undefined' ? prompt : null);
                const d = `Sekolah #${Object.keys(state.schoolDeliveries).length + 1}`;
                const n = p ? p('Masukkan nama sekolah atau label sesi baru:', d) : d;
                if (n !== null) startNewSchoolSession(String(n).trim());
            };
        }
        const clr = el.querySelector('#mbg-btn-clear');
        if (clr) {
            clr.onclick = () => {
                const c = win.confirm ? win.confirm.bind(win) : (typeof confirm !== 'undefined' ? confirm : null);
                if (!c || c('Kosongkan seluruh koleksi foto sumber dari penyimpanan?')) clearAllPhotos();
            };
        }
        const min = el.querySelector('#mbg-btn-minimize');
        if (min) min.onclick = (e) => { e.stopPropagation(); state.minimized = true; renderWidget(); };
        const chk = el.querySelector('#mbg-chk-autonext');
        if (chk) chk.onchange = (e) => { state.autoAdvance = e.target.checked; };
        const nxt = el.querySelector('#mbg-btn-next');
        if (nxt) nxt.onclick = () => advanceQueue();

        el.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const a = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                if (a === 'select') selectPhotoForCamera(id);
                else if (a === 'replace') triggerReplacePhoto(id);
                else if (a === 'retry') retryPhotoForSchool(id);
                else if (a === 'remove') removePhoto(id);
            };
        });
    }

    function esc(s) {
        if (!s) return '';
        return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
    }

    // 8. Inisialisasi
    function init() {
        cleanCaptureAttributes();
        setupCaptureObserver();
        setupInputInterception();
        detectSchoolContext();
        hookWebRTC();
        if (!doc.getElementById('mbg-quick-bypass')) renderWidget();
        restoreCollectionFromStorage();
    }

    setInterval(init, 1500);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
    else init();
})();
