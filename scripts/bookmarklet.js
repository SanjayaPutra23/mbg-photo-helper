/**
 * MBG Local Photo Helper - Bookmarklet Source (Readable & Compact)
 * Versi 2.1.0 (Multi-Foto & Antrean Otomatis)
 * Mendukung HP (Android/iOS) dan Desktop tanpa ekstensi.
 */
(function () {
    // 1. Bersihkan atribut capture
    document.querySelectorAll('input[type="file"]').forEach(i => {
        if (i.id !== 'mbg-bm-file') i.removeAttribute('capture');
    });

    // 2. Kategori standar SPPG MBG
    const CATS = [
        '1. Makanan / Masakan',
        '2. Ompreng / Wadah',
        '3. Cuci Ompreng',
        '4. Pendukung'
    ];

    if (!window._mbgBmState) {
        window._mbgBmState = { photos: [], idx: 0, autoNext: true, min: false };
    }
    const st = window._mbgBmState;

    // Suntikkan style kompak
    if (!document.getElementById('mbg-bm-style')) {
        const s = document.createElement('style');
        s.id = 'mbg-bm-style';
        s.textContent = `
            #mbg-quick-bypass{position:fixed;bottom:14px;right:14px;z-index:999999999;background:#0f172a;color:#fff;border:2px solid #3b82f6;border-radius:12px;padding:10px;font-family:sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.6);width:290px;max-width:calc(100vw - 28px);box-sizing:border-box;font-size:12px}
            .mbg-btn{border:none;border-radius:4px;cursor:pointer;padding:4px 8px;font-size:11px;font-weight:bold}
            .mbg-b-blue{background:#2563eb;color:#fff}
            .mbg-b-dark{background:#334155;color:#cbd5e1}
            .mbg-b-red{background:#991b1b;color:#fecaca}
            .mbg-row{display:flex;align-items:center;justify-content:space-between}
            .mbg-card{display:flex;align-items:center;background:#1e293b;border-radius:6px;padding:4px 6px;font-size:11px;gap:6px}
            .mbg-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 6px #22c55e}
        `;
        document.head.appendChild(s);
    }

    function sync() {
        const p = st.photos[st.idx];
        window.mbgSelectedFile = (p && p.file) ? p.file : null;
        window.mbgPhotoList = st.photos;
    }

    function render() {
        let d = document.getElementById('mbg-quick-bypass');
        if (!d) {
            d = document.createElement('div');
            d.id = 'mbg-quick-bypass';
            document.body.appendChild(d);
        }

        const total = st.photos.length;
        const done = st.photos.filter(p => p.status === 'success').length;
        const cur = st.photos[st.idx];

        if (st.min) {
            d.style.display = 'flex';
            d.style.alignItems = 'center';
            d.style.gap = '6px';
            d.style.borderRadius = '20px';
            d.style.padding = '6px 12px';
            d.style.cursor = 'pointer';
            d.innerHTML = `<span class="mbg-dot"></span><b>MBG (${done}/${total})</b> [Buka]`;
            d.onclick = () => { st.min = false; render(); };
            return;
        }

        d.style.display = 'block';
        d.style.borderRadius = '12px';
        d.style.padding = '10px';
        d.onclick = null;

        let h = `
            <div class="mbg-row" style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #334155;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="mbg-dot"></span>
                    <b>MBG Multi-Foto v2.1</b>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:10px;color:#94a3b8;">${done}/${total} Selesai</span>
                    <button id="mbg-bm-min" class="mbg-btn mbg-b-dark" style="padding:1px 6px;">−</button>
                </div>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:8px;">
                <button id="mbg-bm-add" class="mbg-btn mbg-b-blue" style="flex:1;">+ Pilih / Tambah Foto</button>
                <input type="file" id="mbg-bm-file" accept="image/*" multiple style="display:none;"/>
                ${total > 0 ? `<button id="mbg-bm-clr" class="mbg-btn mbg-b-dark" style="color:#f87171;">Reset</button>` : ''}
            </div>
        `;

        if (total === 0) {
            h += `<div style="border:1px dashed #475569;border-radius:6px;padding:12px;text-align:center;color:#94a3b8;font-size:11px;">Pilih 4 foto dokumentasi (Makanan, Ompreng, Cuci, Pendukung) dari Galeri HP Anda.</div>`;
        } else {
            h += `
                <div style="background:#1e293b;border-radius:6px;padding:6px;margin-bottom:6px;border:${cur && cur.status === 'active' ? '2px solid #38bdf8' : '1px solid #334155'};">
                    <div style="font-size:10px;color:#38bdf8;font-weight:bold;margin-bottom:2px;">📷 AKTIF DI KAMERA (#${st.idx + 1}):</div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${cur ? `<img src="${cur.url}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #475569;"/>` : ''}
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cur ? cur.cat : '-'}</div>
                            <div style="font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cur ? cur.name : ''}</div>
                        </div>
                    </div>
                </div>
                <div style="max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:6px;">
            `;

            st.photos.forEach((p, i) => {
                const isAct = (i === st.idx);
                let badge = '<span style="color:#cbd5e1;font-size:9px;">Menunggu</span>';
                if (isAct) badge = '<span style="color:#38bdf8;font-weight:bold;font-size:9px;">Aktif</span>';
                if (p.status === 'success') badge = '<span style="color:#4ade80;font-weight:bold;font-size:9px;">✓ Selesai</span>';
                if (p.status === 'failed') badge = '<span style="color:#f87171;font-weight:bold;font-size:9px;">✕ Gagal</span>';

                h += `
                    <div class="mbg-card">
                        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i + 1}. ${p.cat}</span>
                        ${badge}
                        ${!isAct && p.status !== 'success' ? `<button data-act="sel" data-i="${i}" class="mbg-btn mbg-b-blue" style="padding:1px 4px;font-size:9px;">Pilih</button>` : ''}
                        ${p.status === 'failed' ? `<button data-act="ret" data-i="${i}" class="mbg-btn mbg-b-red" style="padding:1px 4px;font-size:9px;">Ulang</button>` : ''}
                        <button data-act="del" data-i="${i}" style="background:transparent;color:#94a3b8;border:none;cursor:pointer;font-size:11px;">✕</button>
                    </div>
                `;
            });
            h += `</div>`;
        }

        h += `
            <div class="mbg-row" style="font-size:10px;color:#94a3b8;border-top:1px solid #334155;padding-top:6px;">
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="mbg-bm-auto" ${st.autoNext ? 'checked' : ''}/> Auto-Next</label>
                <button id="mbg-bm-next" class="mbg-btn mbg-b-dark" style="color:#38bdf8;padding:2px 6px;">Next >></button>
            </div>
        `;

        d.innerHTML = h;

        d.querySelector('#mbg-bm-min').onclick = (e) => { e.stopPropagation(); st.min = true; render(); };
        const btnAdd = d.querySelector('#mbg-bm-add');
        const fInput = d.querySelector('#mbg-bm-file');
        btnAdd.onclick = () => fInput.click();
        fInput.onchange = (e) => {
            if (e.target.files) {
                for (let i = 0; i < e.target.files.length; i++) {
                    const fl = e.target.files[i];
                    const num = st.photos.length;
                    st.photos.push({
                        file: fl,
                        name: fl.name,
                        url: URL.createObjectURL(fl),
                        cat: num < CATS.length ? CATS[num] : `Pendukung #${num + 1}`,
                        status: st.photos.length === 0 ? 'active' : 'pending'
                    });
                }
                if (st.photos.length > 0 && !st.photos.some(p => p.status === 'active')) {
                    st.idx = 0;
                    st.photos[0].status = 'active';
                }
                sync();
                render();
            }
        };

        const clr = d.querySelector('#mbg-bm-clr');
        if (clr) clr.onclick = () => {
            st.photos.forEach(p => { try { URL.revokeObjectURL(p.url); } catch (e) { } });
            st.photos = [];
            st.idx = 0;
            sync();
            render();
        };

        const chkAuto = d.querySelector('#mbg-bm-auto');
        if (chkAuto) chkAuto.onchange = (e) => { st.autoNext = e.target.checked; };

        const btnNxt = d.querySelector('#mbg-bm-next');
        if (btnNxt) btnNxt.onclick = () => { advance(); };

        d.querySelectorAll('[data-act]').forEach(b => {
            b.onclick = (e) => {
                e.stopPropagation();
                const act = b.getAttribute('data-act');
                const i = parseInt(b.getAttribute('data-i'), 10);
                if (act === 'del') {
                    try { URL.revokeObjectURL(st.photos[i].url); } catch (e) { }
                    st.photos.splice(i, 1);
                    if (st.idx >= st.photos.length) st.idx = Math.max(0, st.photos.length - 1);
                    if (st.photos[st.idx] && st.photos[st.idx].status === 'pending') st.photos[st.idx].status = 'active';
                    sync();
                    render();
                } else if (act === 'sel') {
                    st.photos.forEach((p, idx) => { if (p.status === 'active' && idx !== i) p.status = 'pending'; });
                    st.idx = i;
                    if (st.photos[i].status !== 'success') st.photos[i].status = 'active';
                    sync();
                    render();
                } else if (act === 'ret') {
                    st.photos[i].status = 'pending';
                    st.idx = i;
                    st.photos[i].status = 'active';
                    sync();
                    render();
                }
            };
        });
    }

    function advance() {
        const next = st.photos.findIndex((p, i) => i > st.idx && p.status === 'pending');
        const any = next !== -1 ? next : st.photos.findIndex(p => p.status === 'pending');
        if (any !== -1) {
            st.photos.forEach((p, idx) => { if (p.status === 'active' && idx !== any) p.status = 'pending'; });
            st.idx = any;
            st.photos[any].status = 'active';
            sync();
            render();
        }
    }

    // 3. Jembatan WebRTC MediaStream Virtual Canvas
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !window._mbgBmHooked) {
        window._mbgBmHooked = true;
        const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = async (c) => {
            const cur = st.photos[st.idx];
            if (c && c.video && cur && cur.file) {
                const cv = document.createElement('canvas');
                const im = new Image();
                im.src = cur.url;
                await new Promise(r => im.onload = r);
                cv.width = im.naturalWidth || 1280;
                cv.height = im.naturalHeight || 720;
                const cx = cv.getContext('2d');
                cx.drawImage(im, 0, 0);
                const stream = cv.captureStream(25);
                const timer = setInterval(() => cx.drawImage(im, 0, 0), 40);

                const track = stream.getVideoTracks()[0];
                if (track) {
                    let done = false;
                    const onEnd = () => {
                        if (done) return;
                        done = true;
                        clearInterval(timer);
                        cur.status = 'success';
                        if (st.autoNext) advance();
                        else { sync(); render(); }
                    };
                    const origStop = track.stop.bind(track);
                    track.stop = () => { origStop(); onEnd(); };
                    track.addEventListener('ended', onEnd);
                }
                return stream;
            }
            return origGUM(c);
        };
    }

    render();
})();
