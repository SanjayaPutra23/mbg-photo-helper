// ==UserScript==
// @name         MBG - Local Photo Helper (Multi-Foto)
// @namespace    https://pop-sipgn.bgn.go.id/
// @version      2.1.0
// @description  Bypass Kamera POP SIPGN Otomatis & Multi-Foto Antrean untuk Upload Dokumentasi SPPG MBG
// @author       Antigravity 2.0
// @match        *://pop-sipgn.bgn.go.id/*
// @include      *pop-sipgn.bgn.go.id*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // Kategori standar rekomendasi alur dokumentasi SPPG MBG
    const DEFAULT_CATEGORIES = [
        '1. Foto Makanan / Hasil Masakan',
        '2. Foto Ompreng / Wadah Makanan',
        '3. Foto Kegiatan Pencucian Ompreng',
        '4. Foto Dokumentasi Pendukung'
    ];

    // Batas validasi berkas
    const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
    const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

    // Inisialisasi state global tunggal
    if (!win._mbgState) {
        win._mbgState = {
            photos: [], // Array: { id, file, name, size, url, category, status, error }
            activeIndex: 0,
            autoAdvance: true,
            minimized: false,
            notification: { text: '', type: 'info', timer: null }
        };
    }
    const state = win._mbgState;

    /**
     * Validasi format dan ukuran file foto
     */
    function validatePhoto(file) {
        if (!file) return { valid: false, error: 'Berkas tidak ditemukan.' };

        const nameLower = file.name.toLowerCase();
        const hasValidExt = VALID_EXTENSIONS.some(ext => nameLower.endsWith(ext));
        const isImageMime = file.type ? file.type.startsWith('image/') : false;

        if (!hasValidExt && !isImageMime) {
            return {
                valid: false,
                error: `Format "${file.name}" tidak didukung. Harap pilih berkas JPG, PNG, atau WEBP.`
            };
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return {
                valid: false,
                error: `Ukuran file "${file.name}" (${sizeMB} MB) melebihi batas maksimal 15 MB.`
            };
        }

        return { valid: true };
    }

    /**
     * Format ukuran berkas ke teks manusiawi (KB/MB)
     */
    function formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Tampilkan notifikasi status di UI widget
     */
    function showNotification(text, type = 'info', timeoutMs = 4000) {
        if (state.notification.timer) {
            clearTimeout(state.notification.timer);
            state.notification.timer = null;
        }
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

    /**
     * Sinkronisasi backward-compatibility variabel lama
     */
    function syncLegacy() {
        const activePhoto = state.photos[state.activeIndex];
        win.mbgSelectedFile = (activePhoto && activePhoto.file) ? activePhoto.file : null;
        win.mbgPhotoList = state.photos;
    }

    /**
     * Tambah beberapa foto ke antrean tanpa menghapus foto sebelumnya
     */
    function addPhotos(fileList) {
        if (!fileList || fileList.length === 0) return;

        let addedCount = 0;
        let rejectedErrors = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const val = validatePhoto(file);
            if (!val.valid) {
                rejectedErrors.push(val.error);
                continue;
            }

            const currentCount = state.photos.length;
            const categoryLabel = currentCount < DEFAULT_CATEGORIES.length
                ? DEFAULT_CATEGORIES[currentCount]
                : `Dokumentasi Tambahan #${currentCount + 1}`;

            state.photos.push({
                id: 'mbg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                file: file,
                name: file.name,
                size: file.size,
                url: URL.createObjectURL(file),
                category: categoryLabel,
                status: 'pending', // 'pending' | 'active' | 'success' | 'failed'
                error: ''
            });
            addedCount++;
        }

        // Jika belum ada foto aktif, aktifkan foto pending pertama
        if (state.photos.length > 0 && !state.photos.some(p => p.status === 'active')) {
            const firstPending = state.photos.findIndex(p => p.status === 'pending');
            state.activeIndex = firstPending !== -1 ? firstPending : 0;
            state.photos[state.activeIndex].status = 'active';
        }

        syncLegacy();

        if (rejectedErrors.length > 0) {
            showNotification(rejectedErrors[0], 'warn', 5000);
        } else if (addedCount > 0) {
            showNotification(`${addedCount} foto berhasil ditambahkan ke antrean.`, 'success', 3500);
        }
        renderWidget();
    }

    /**
     * Hapus foto tertentu dari antrean
     */
    function removePhoto(id) {
        const index = state.photos.findIndex(p => p.id === id);
        if (index === -1) return;

        try {
            URL.revokeObjectURL(state.photos[index].url);
        } catch (e) { }

        const wasActive = state.photos[index].status === 'active';
        state.photos.splice(index, 1);

        if (state.photos.length === 0) {
            state.activeIndex = 0;
        } else {
            if (wasActive || state.activeIndex >= state.photos.length) {
                const nextPending = state.photos.findIndex(p => p.status === 'pending');
                state.activeIndex = nextPending !== -1 ? nextPending : Math.max(0, state.photos.length - 1);
                if (state.photos[state.activeIndex].status === 'pending') {
                    state.photos[state.activeIndex].status = 'active';
                }
            }
        }

        syncLegacy();
        showNotification('Foto dihapus dari daftar.', 'info', 2500);
        renderWidget();
    }

    /**
     * Pilih foto tertentu sebagai foto aktif untuk jepretan kamera berikutnya
     */
    function setActivePhoto(targetIndex) {
        if (targetIndex < 0 || targetIndex >= state.photos.length) return;

        state.photos.forEach((p, idx) => {
            if (p.status === 'active' && idx !== targetIndex) {
                p.status = 'pending';
            }
        });

        state.activeIndex = targetIndex;
        if (state.photos[targetIndex].status !== 'success') {
            state.photos[targetIndex].status = 'active';
        }

        syncLegacy();
        showNotification(`Foto siap di kamera: ${state.photos[targetIndex].category}`, 'info', 3000);
        renderWidget();
    }

    /**
     * Coba kembali (retry) foto yang gagal tanpa mengulang foto yang berhasil
     */
    function retryPhoto(id) {
        const index = state.photos.findIndex(p => p.id === id);
        if (index === -1) return;

        const photo = state.photos[index];
        photo.status = 'pending';
        photo.error = '';

        setActivePhoto(index);
        showNotification(`Foto "${photo.name}" disiapkan ulang untuk kamera.`, 'info', 3000);
    }

    /**
     * Majukan antrean ke foto pending berikutnya
     */
    function advanceQueue() {
        const nextPendingAfterCurrent = state.photos.findIndex(
            (p, idx) => idx > state.activeIndex && p.status === 'pending'
        );
        const anyPending = nextPendingAfterCurrent !== -1
            ? nextPendingAfterCurrent
            : state.photos.findIndex(p => p.status === 'pending');

        if (anyPending !== -1) {
            setActivePhoto(anyPending);
        } else {
            const allSuccess = state.photos.every(p => p.status === 'success');
            if (allSuccess && state.photos.length > 0) {
                showNotification(`Seluruh ${state.photos.length} foto berhasil diunggah! 🎉`, 'success', 6000);
            } else {
                showNotification('Rangkaian antrean selesai diproses.', 'info', 4000);
            }
            syncLegacy();
            renderWidget();
        }
    }

    /**
     * Tandai foto aktif berhasil dijepret/diunggah
     */
    function markActiveAsSuccess() {
        const current = state.photos[state.activeIndex];
        if (!current) return;

        current.status = 'success';
        current.error = '';

        if (state.autoAdvance) {
            advanceQueue();
        } else {
            syncLegacy();
            renderWidget();
        }
    }

    /**
     * Kosongkan seluruh antrean foto
     */
    function clearAllPhotos() {
        if (state.photos.length === 0) return;
        state.photos.forEach(p => {
            try { URL.revokeObjectURL(p.url); } catch (e) { }
        });
        state.photos = [];
        state.activeIndex = 0;
        syncLegacy();
        showNotification('Antrean foto telah dikosongkan.', 'info', 2500);
        renderWidget();
    }

    /**
     * Render UI Widget MBG Photo Helper
     */
    function renderWidget() {
        let container = document.getElementById('mbg-quick-bypass');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mbg-quick-bypass';
            if (document.body) {
                document.body.appendChild(container);
            } else {
                return;
            }
        }

        const totalPhotos = state.photos.length;
        const successCount = state.photos.filter(p => p.status === 'success').length;
        const failedCount = state.photos.filter(p => p.status === 'failed').length;

        // Mode Minimized
        if (state.minimized) {
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999999;background:#0f172a;color:#f8fafc;border:2px solid #3b82f6;border-radius:24px;padding:8px 14px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;';
            container.innerHTML = `
                <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;"></span>
                <span style="font-weight:bold;">MBG Multi-Foto (${successCount}/${totalPhotos})</span>
                <button id="mbg-btn-expand" style="background:#2563eb;color:#fff;border:none;border-radius:12px;padding:2px 8px;font-size:11px;font-weight:bold;cursor:pointer;">Buka</button>
            `;
            container.onclick = (e) => {
                state.minimized = false;
                renderWidget();
            };
            return;
        }

        // Mode Normal (Expanded)
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999999;background:#0f172a;color:#f8fafc;border:2px solid #3b82f6;border-radius:14px;padding:14px;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,0.6);width:340px;max-width:calc(100vw - 32px);box-sizing:border-box;font-size:13px;line-height:1.4;';

        // Header
        let html = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #334155;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 8px #22c55e;"></span>
                    <strong style="font-size:13px;color:#f8fafc;">MBG Photo Helper</strong>
                    <span style="background:#1e293b;color:#38bdf8;border:1px solid #3b82f6;border-radius:6px;font-size:10px;padding:1px 5px;font-weight:bold;">v2.1</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <button id="mbg-btn-minimize" title="Kecilkan Tampilan" style="background:#334155;color:#cbd5e1;border:none;border-radius:6px;width:24px;height:24px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
                </div>
            </div>
        `;

        // Ringkasan & Status Bar
        const progressPercent = totalPhotos > 0 ? Math.round((successCount / totalPhotos) * 100) : 0;
        html += `
            <div style="background:#1e293b;border-radius:8px;padding:8px 10px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:4px;">
                    <span style="color:#94a3b8;">Rangkaian Dokumentasi:</span>
                    <span style="font-weight:bold;color:${allCompletedColor(totalPhotos, successCount)};">
                        ${successCount}/${totalPhotos} Selesai ${failedCount > 0 ? `(${failedCount} Gagal)` : ''}
                    </span>
                </div>
                <div style="width:100%;height:5px;background:#334155;border-radius:3px;overflow:hidden;">
                    <div style="width:${progressPercent}%;height:100%;background:#22c55e;transition:width 0.3s;"></div>
                </div>
            </div>
        `;

        // Bar Notifikasi Jika Ada
        if (state.notification.text) {
            const bgMap = {
                info: 'background:#1e3a8a;color:#bfdbfe;border:1px solid #3b82f6;',
                success: 'background:#14532d;color:#bbf7d0;border:1px solid #22c55e;',
                warn: 'background:#713f12;color:#fef08a;border:1px solid #eab308;',
                error: 'background:#7f1d1d;color:#fecaca;border:1px solid #ef4444;'
            };
            html += `
                <div style="padding:6px 10px;border-radius:6px;font-size:11px;margin-bottom:10px;${bgMap[state.notification.type] || bgMap.info}">
                    ${escapeHtml(state.notification.text)}
                </div>
            `;
        }

        // Tombol Aksi Utama (Pilih Banyak File & Opsi)
        html += `
            <div style="display:flex;gap:6px;margin-bottom:10px;">
                <button id="mbg-btn-add" style="flex:1;background:#2563eb;color:#ffffff;border:none;border-radius:6px;padding:8px 10px;font-size:12px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 0.2s;">
                    <span>📁</span> + Pilih / Tambah Foto
                </button>
                <input type="file" id="mbg-file-input" accept="image/jpeg,image/png,image/webp,image/jpg" multiple style="display:none;" />
                ${totalPhotos > 0 ? `
                    <button id="mbg-btn-clear" title="Kosongkan Antrean" style="background:#334155;color:#f87171;border:none;border-radius:6px;padding:8px 10px;font-size:12px;font-weight:bold;cursor:pointer;">
                        ✕ Reset
                    </button>
                ` : ''}
            </div>
        `;

        // Opsi Auto-Next & Kontrol Manual
        if (totalPhotos > 0) {
            html += `
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#cbd5e1;margin-bottom:8px;padding:0 2px;">
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;">
                        <input type="checkbox" id="mbg-chk-autonext" ${state.autoAdvance ? 'checked' : ''} style="cursor:pointer;" />
                        Otomatis ke foto berikutnya (Auto-Next)
                    </label>
                    <button id="mbg-btn-next" title="Ganti ke foto berikutnya secara manual" style="background:#1e293b;color:#38bdf8;border:1px solid #3b82f6;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">
                        Lewati >>
                    </button>
                </div>
            `;
        }

        // Daftar Foto (List Preview)
        if (totalPhotos === 0) {
            html += `
                <div style="border:2px dashed #334155;border-radius:8px;padding:18px 12px;text-align:center;color:#94a3b8;font-size:11px;margin-bottom:8px;">
                    Belum ada foto yang dipilih.<br/>
                    Klik <strong>"+ Pilih / Tambah Foto"</strong> untuk memilih 4 foto dokumentasi (Makanan, Ompreng, Cuci Ompreng, Pendukung) sekaligus dari laptop/HP.
                </div>
            `;
        } else {
            html += `<div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding-right:2px;margin-bottom:8px;">`;
            state.photos.forEach((photo, idx) => {
                const isActive = (idx === state.activeIndex);
                const borderStyle = isActive ? 'border:2px solid #38bdf8;background:#1e293b;' : 'border:1px solid #334155;background:#0f172a;';

                html += `
                    <div style="display:flex;align-items:center;gap:8px;border-radius:8px;padding:6px 8px;${borderStyle}">
                        <img src="${photo.url}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #475569;flex-shrink:0;" alt="thumb" />
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:11px;font-weight:bold;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${escapeHtml(photo.category)}
                            </div>
                            <div style="font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${escapeHtml(photo.name)} (${formatSize(photo.size)})
                            </div>
                            <div style="margin-top:2px;">
                                ${renderStatusBadge(photo.status, isActive)}
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
                            ${renderCardActions(photo, idx, isActive)}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Petunjuk Singkat
        html += `
            <div style="font-size:10px;color:#64748b;border-top:1px solid #1e293b;padding-top:6px;display:flex;justify-content:space-between;">
                <span>💡 Klik Kamera di form POP SIPGN untuk menjepret.</span>
                <span>${totalPhotos} foto di antrean</span>
            </div>
        `;

        container.innerHTML = html;

        // Pasang Event Listeners
        const btnAdd = container.querySelector('#mbg-btn-add');
        const fileInput = container.querySelector('#mbg-file-input');
        const btnClear = container.querySelector('#mbg-btn-clear');
        const btnMinimize = container.querySelector('#mbg-btn-minimize');
        const chkAutoNext = container.querySelector('#mbg-chk-autonext');
        const btnNext = container.querySelector('#mbg-btn-next');

        if (btnAdd && fileInput) {
            btnAdd.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    addPhotos(e.target.files);
                    fileInput.value = ''; // Reset input agar bisa memilih berkas yang sama jika diinginkan
                }
            };
        }

        if (btnClear) {
            btnClear.onclick = () => {
                if (confirm('Kosongkan semua daftar foto yang sudah dipilih?')) {
                    clearAllPhotos();
                }
            };
        }

        if (btnMinimize) {
            btnMinimize.onclick = (e) => {
                e.stopPropagation();
                state.minimized = true;
                renderWidget();
            };
        }

        if (chkAutoNext) {
            chkAutoNext.onchange = (e) => {
                state.autoAdvance = e.target.checked;
            };
        }

        if (btnNext) {
            btnNext.onclick = () => {
                advanceQueue();
            };
        }

        // Pasang listener pada tiap kartu foto
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                const idx = parseInt(btn.getAttribute('data-index'), 10);

                if (action === 'remove') {
                    removePhoto(id);
                } else if (action === 'activate') {
                    setActivePhoto(idx);
                } else if (action === 'retry') {
                    retryPhoto(id);
                } else if (action === 'mark-success') {
                    markActiveAsSuccess();
                }
            };
        });
    }

    function renderStatusBadge(status, isActive) {
        if (isActive) {
            return `<span style="background:#0284c7;color:#ffffff;font-size:9px;font-weight:bold;padding:1px 6px;border-radius:10px;">📷 AKTIF DI KAMERA</span>`;
        }
        switch (status) {
            case 'success':
                return `<span style="background:#166534;color:#86efac;font-size:9px;font-weight:bold;padding:1px 6px;border-radius:10px;">✓ Berhasil</span>`;
            case 'failed':
                return `<span style="background:#991b1b;color:#fca5a5;font-size:9px;font-weight:bold;padding:1px 6px;border-radius:10px;">✕ Gagal</span>`;
            case 'pending':
            default:
                return `<span style="background:#334155;color:#cbd5e1;font-size:9px;padding:1px 6px;border-radius:10px;">Menunggu</span>`;
        }
    }

    function renderCardActions(photo, idx, isActive) {
        let acts = '';
        if (!isActive && photo.status !== 'success') {
            acts += `<button data-action="activate" data-index="${idx}" title="Pilih sebagai foto kamera aktif" style="background:#1e293b;color:#38bdf8;border:1px solid #3b82f6;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">Aktifkan</button>`;
        }
        if (photo.status === 'failed') {
            acts += `<button data-action="retry" data-id="${photo.id}" title="Coba lagi foto ini" style="background:#991b1b;color:#fecaca;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">Ulangi</button>`;
        } else if (isActive) {
            acts += `<button data-action="mark-success" data-id="${photo.id}" title="Tandai foto ini selesai diunggah" style="background:#166534;color:#bbf7d0;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">✓ Selesai</button>`;
        }
        acts += `<button data-action="remove" data-id="${photo.id}" title="Hapus dari antrean" style="background:transparent;color:#94a3b8;border:none;font-size:12px;cursor:pointer;padding:2px 4px;">✕</button>`;
        return acts;
    }

    function allCompletedColor(total, success) {
        if (total === 0) return '#cbd5e1';
        if (success === total) return '#4ade80';
        return '#38bdf8';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Jembatan WebRTC MediaStream dari Canvas Virtual
     */
    function hookWebRTC() {
        if (win._mbgGUMHooked) return;
        if (!win.navigator || !win.navigator.mediaDevices || !win.navigator.mediaDevices.getUserMedia) return;

        win._mbgGUMHooked = true;
        const oldGUM = win.navigator.mediaDevices.getUserMedia.bind(win.navigator.mediaDevices);

        win.navigator.mediaDevices.getUserMedia = async function (constraints) {
            const currentPhoto = state.photos[state.activeIndex];

            // Jika constraint meminta video dan terdapat foto aktif dalam antrean
            if (constraints && constraints.video && currentPhoto && currentPhoto.file) {
                try {
                    const canvas = document.createElement('canvas');
                    const imgEl = new Image();
                    imgEl.src = currentPhoto.url;

                    await new Promise((resolve) => {
                        if (imgEl.complete && imgEl.naturalWidth) return resolve();
                        imgEl.onload = () => resolve();
                        imgEl.onerror = () => resolve();
                        setTimeout(resolve, 2000);
                    });

                    // Skala resolusi cerdas (max 1920px) agar performa kanvas tetap ringan dan stabil
                    let w = imgEl.naturalWidth || 1280;
                    let h = imgEl.naturalHeight || 720;
                    const maxDim = 1920;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imgEl, 0, 0, w, h);

                    const stream = canvas.captureStream(25);
                    const drawInterval = setInterval(() => {
                        try {
                            ctx.drawImage(imgEl, 0, 0, w, h);
                        } catch (e) {
                            clearInterval(drawInterval);
                        }
                    }, 40);

                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        let finalized = false;
                        const onStreamEnded = () => {
                            if (finalized) return;
                            finalized = true;
                            clearInterval(drawInterval);

                            if (currentPhoto.status !== 'failed') {
                                currentPhoto.status = 'success';
                            }

                            if (state.autoAdvance) {
                                advanceQueue();
                            } else {
                                syncLegacy();
                                renderWidget();
                            }
                        };

                        const originalStop = videoTrack.stop.bind(videoTrack);
                        videoTrack.stop = function () {
                            originalStop();
                            onStreamEnded();
                        };
                        videoTrack.addEventListener('ended', onStreamEnded);
                    }

                    showNotification(`Mengalirkan [${currentPhoto.category}] ke kamera...`, 'info', 3000);
                    renderWidget();
                    return stream;
                } catch (err) {
                    console.error('[MBG Helper] Error mengalirkan foto virtual:', err);
                    currentPhoto.status = 'failed';
                    currentPhoto.error = err.message || 'Stream error';
                    showNotification('Gagal mengalirkan foto: ' + (err.message || 'Error'), 'error', 5000);
                    renderWidget();
                    throw err;
                }
            }

            return oldGUM(constraints);
        };
    }

    /**
     * Bersihkan atribut capture agar browser membuka dialog pemilih berkas
     */
    function cleanCaptureAttributes() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.id !== 'mbg-file-input' && input.hasAttribute('capture')) {
                input.removeAttribute('capture');
            }
        });
    }

    /**
     * Inisialisasi awal
     */
    function init() {
        cleanCaptureAttributes();
        hookWebRTC();
        if (!document.getElementById('mbg-quick-bypass')) {
            renderWidget();
        }
    }

    // Interval penjaga untuk aplikasi Single Page Application (SPA / Vue / React)
    setInterval(init, 1500);

    // Jalankan segera saat script terpasang
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
