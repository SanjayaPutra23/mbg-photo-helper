# Panduan Pemasangan & Penggunaan (Laptop / PC)

Panduan ini ditujukan untuk pengguna komputer/laptop berbasis Windows, macOS, atau Linux menggunakan browser Google Chrome, Brave, atau Microsoft Edge.

---

## 1. Prasyarat
- Browser berbasis Chromium (**Brave**, **Google Chrome**, atau **Microsoft Edge**).
- Ekstensi **Tampermonkey** dari [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk).

---

## 2. Pengaturan Hak Akses Peramban (Wajib di Chromium / Brave)
Karena sistem keamanan browser terbaru (Manifest V3), ikuti langkah ini agar Tampermonkey diizinkan menyuntikkan script:

1. Buka tab baru di browser:
   - Brave: `brave://extensions`
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. Di pojok kanan atas layar, nyalakan sakelar **Developer mode** (Mode Pengembang) hingga aktif.
3. Cari kartu **Tampermonkey**, lalu klik **Details (Detail)**.
4. Pastikan:
   - **Site access (Akses situs):** Disetel ke **On all sites (Di semua situs)**.
   - **Allow access to file URLs:** Diaktifkan (ON).

---

## 3. Pemasangan Script
1. Klik ikon **Tampermonkey** di bilah kanan atas browser Anda.
2. Klik **Dashboard** lalu pilih tab/menu **+** (*Create a new script*).
3. Hapus semua teks bawaan yang ada di editor Tampermonkey.
4. Salin seluruh isi berkas [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js) dan tempelkan ke editor.
5. Tekan **`Ctrl + S`** untuk menyimpan.
6. Tutup tab editor Tampermonkey.

---

## 4. Cara Penggunaan di Halaman POP SIPGN
1. Buka formulir di `https://pop-sipgn.bgn.go.id/`.
2. Di **pojok kanan bawah**, akan muncul kotak hitam berbingkai biru bertuliskan **"Bypass Kamera Aktif"**.
3. Klik tombol biru **"Pilih Foto dari Laptop"** pada kotak tersebut, lalu pilih foto makanan yang ingin diunggah.
4. Pada formulir web (misal di bagian *Foto Mulai Tahapan*), klik kotak **Kamera**.
5. Foto lokal otomatis masuk tanpa error *"Requested device not found"*, lengkap dengan stempel label resmi POP SIPGN.
6. Lanjutkan penyimpanan formulir seperti biasa.

---

## 5. Troubleshooting (Laptop)
- **Kotak tidak muncul:** Pastikan Developer Mode sudah aktif di `chrome://extensions`, lalu lakukan hard refresh (`Ctrl + Shift + R`).
- **Foto belum terisi:** Pastikan Anda sudah mengklik tombol di kotak biru dan pratinjau fotonya sudah terlihat sebelum mengklik tombol kamera aplikasi.
