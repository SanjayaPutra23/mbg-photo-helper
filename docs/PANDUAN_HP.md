# Panduan Penggunaan pada Smartphone (Android & iOS)

Terdapat dua metode untuk menjalankan bypass kamera pada smartphone:
- **Metode A (Bookmarklet):** Paling cepat, bekerja langsung di Google Chrome / Safari bawaan tanpa install aplikasi tambahan.
- **Metode B (Kiwi Browser):** Otomatis 100% menggunakan Tampermonkey persis seperti di laptop.

---

## METODE A: Menggunakan Bookmarklet (Chrome Android & Safari iOS)

Metode ini tidak membutuhkan aplikasi baru. Cukup menyimpan kode sebagai pintasan Bookmark.

### 1. Cara Menyimpan Bookmark (Hanya 1x Setup):
1. Buka Google Chrome di HP Anda.
2. Buka web apa saja (contoh: `google.com`), lalu ketuk tombol **Titik Tiga > Bintang (Bookmark)** untuk menyimpannya.
3. Buka menu **Titik Tiga > Bookmarks (Penanda)**.
4. Cari bookmark yang baru saja Anda buat tadi, ketuk tombol **Titik Tiga di sampingnya > Edit**.
5. Ubah data berikut:
   - **Name (Nama):** `Bypass Kamera`
   - **URL:** Hapus link lama, lalu tempelkan teks dari berkas [`scripts/bookmarklet-minified.url.txt`](../scripts/bookmarklet-minified.url.txt):
     ```javascript
     javascript:(function(){document.querySelectorAll('input[type="file"]').forEach(i=>i.removeAttribute('capture'));if(!document.getElementById('mbg-quick-bypass')){const d=document.createElement('div');d.id='mbg-quick-bypass';d.style.cssText='position:fixed;bottom:20px;right:20px;z-index:999999999;background:#1e293b;color:#fff;border:2px solid #3b82f6;border-radius:12px;padding:12px 16px;font-family:sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5);width:230px;';d.innerHTML='<div style="font-weight:bold;margin-bottom:8px;display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 8px #22c55e;"></span>Bypass Kamera Aktif</div><div id="q-status" style="font-size:11px;color:#cbd5e1;margin-bottom:10px;">Pilih foto pengganti kamera:</div><button id="q-btn" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:8px 12px;font-size:12px;font-weight:bold;cursor:pointer;width:100%;">Pilih dari Galeri</button><input type="file" id="q-file" accept="image/*" style="display:none;"/><div id="q-prev" style="margin-top:8px;display:none;text-align:center;"><img id="q-img" style="max-height:80px;border-radius:4px;border:1px solid #475569;"/></div>';document.body.appendChild(d);window.mbgSelectedFile=null;const b=d.querySelector('#q-btn'),f=d.querySelector('#q-file'),s=d.querySelector('#q-status'),p=d.querySelector('#q-prev'),im=d.querySelector('#q-img');b.onclick=()=>f.click();f.onchange=(e)=>{const fl=e.target.files[0];if(fl){window.mbgSelectedFile=fl;im.src=URL.createObjectURL(fl);p.style.display='block';s.innerText='Foto siap!';s.style.color='#38bdf8';}};if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){const o=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async(c)=>{if(c&&c.video&&window.mbgSelectedFile){const cv=document.createElement('canvas'),img=new Image();img.src=URL.createObjectURL(window.mbgSelectedFile);await new Promise(r=>img.onload=r);cv.width=img.naturalWidth||1280;cv.height=img.naturalHeight||720;const cx=cv.getContext('2d');cx.drawImage(img,0,0);const st=cv.captureStream(25);setInterval(()=>cx.drawImage(img,0,0),40);return st;}return o(c);};}}})();
     ```
6. Simpan atau tekan tombol kembali.

### 2. Cara Memakai di HP:
1. Buka formulir POP SIPGN di Chrome HP Anda.
2. Ketuk kolom alamat URL atas, lalu ketik kata: **`Bypass Kamera`**.
3. Di daftar saran pencarian yang muncul, ketuk saran yang berikon **Bintang / Bookmark**.
4. Kotak **"Bypass Kamera Aktif"** akan langsung muncul di pojok kanan bawah layar HP.
5. Ketuk **"Pilih dari Galeri"**, tentukan foto makanan Anda, lalu ketuk tombol **Kamera** pada formulir web.

---

## METODE B: Menggunakan Kiwi Browser (Otomatis Tanpa Panggil Bookmark)

Jika Anda ingin kotak tersebut **selalu muncul otomatis** setiap kali membuka halaman POP SIPGN tanpa perlu mengetik bookmark:

1. Unduh **Kiwi Browser** dari Google Play Store.
2. Buka tautan ekstensi Tampermonkey di Kiwi Browser:  
   `https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk`
3. Klik **Add to Chrome**.
4. Buka menu Titik Tiga > Tampermonkey > Create a new script.
5. Tempelkan script dari [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js), lalu simpan.
6. Buka `https://pop-sipgn.bgn.go.id/` di Kiwi Browser. Kotak akan otomatis muncul setiap saat!
