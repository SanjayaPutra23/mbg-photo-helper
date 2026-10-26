// ==UserScript==
// @name         MBG - Local Photo Helper (Auto)
// @namespace    https://pop-sipgn.bgn.go.id/
// @version      2.0.0
// @description  Bypass Kamera POP SIPGN Otomatis untuk Upload Foto Galeri/Laptop
// @author       Antigravity 2.0
// @match        *://pop-sipgn.bgn.go.id/*
// @include      *pop-sipgn.bgn.go.id*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    function initBypass() {
        if (document.getElementById('mbg-quick-bypass')) return;

        // 1. Bersihkan atribut capture agar file explorer terbuka normal
        document.querySelectorAll('input[type="file"]').forEach(i => i.removeAttribute('capture'));

        // 2. Buat widget indikator dan tombol pilih file di pojok kanan bawah
        const div = document.createElement('div');
        div.id = 'mbg-quick-bypass';
        div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999999;background:#1e293b;color:#ffffff;border:2px solid #3b82f6;border-radius:12px;padding:12px 16px;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5);width:240px;';
        div.innerHTML = `
            <div style="font-weight:bold;display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 8px #22c55e;"></span>
                Bypass Kamera Aktif
            </div>
            <div id="q-status" style="font-size:11px;color:#cbd5e1;margin-bottom:10px;">Pilih foto dari laptop pengganti jepretan kamera:</div>
            <button id="q-btn" style="background:#2563eb;color:#ffffff;border:none;border-radius:6px;padding:8px 12px;font-size:12px;font-weight:bold;cursor:pointer;width:100%;transition:background 0.2s;">Pilih Foto dari Laptop</button>
            <input type="file" id="q-file" accept="image/*" style="display:none;" />
            <div id="q-prev" style="margin-top:8px;display:none;text-align:center;"><img id="q-img" style="max-height:80px;border-radius:4px;border:1px solid #475569;" alt="Pratinjau Foto"/></div>
        `;

        if (document.body) {
            document.body.appendChild(div);
        } else {
            return;
        }

        win.mbgSelectedFile = null;
        const btn = div.querySelector('#q-btn');
        const fileInput = div.querySelector('#q-file');
        const status = div.querySelector('#q-status');
        const prev = div.querySelector('#q-prev');
        const img = div.querySelector('#q-img');

        btn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const f = e.target.files[0];
            if (f) {
                win.mbgSelectedFile = f;
                img.src = URL.createObjectURL(f);
                prev.style.display = 'block';
                status.innerText = 'Foto siap: ' + f.name.substring(0, 15) + '...';
                status.style.color = '#38bdf8';
            }
        };

        // 3. Jembatan WebRTC MediaStream dari Canvas Virtual
        if (win.navigator.mediaDevices && win.navigator.mediaDevices.getUserMedia) {
            const oldGUM = win.navigator.mediaDevices.getUserMedia.bind(win.navigator.mediaDevices);
            win.navigator.mediaDevices.getUserMedia = async (c) => {
                if (c && c.video && win.mbgSelectedFile) {
                    const canvas = document.createElement('canvas');
                    const imgEl = new Image();
                    imgEl.src = URL.createObjectURL(win.mbgSelectedFile);
                    await new Promise(r => imgEl.onload = r);
                    canvas.width = imgEl.naturalWidth || 1280;
                    canvas.height = imgEl.naturalHeight || 720;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imgEl, 0, 0);
                    const stream = canvas.captureStream(25);
                    setInterval(() => ctx.drawImage(imgEl, 0, 0), 40);
                    return stream;
                }
                return oldGUM(c);
            };
        }
    }

    // Interval penjaga untuk aplikasi Single Page Application (SPA)
    setInterval(initBypass, 1500);
})();
