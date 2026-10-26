# MBG - Local Photo Helper (POP SIPGN) 📸⚡

> **Userscript & Bookmarklet** untuk mengunggah foto kondisi makanan langsung dari penyimpanan lokal (laptop) atau galeri (smartphone) pada aplikasi web **POP SIPGN** (`https://pop-sipgn.bgn.go.id/`), mengatasi kendala kamera fisik yang tidak terdeteksi (*"Requested device not found"*).

---

## 📌 Latar Belakang & Masalah

Pada aplikasi web **Aplikasi Kurir / POP SIPGN**, saat mengisi formulir penugasan (seperti *Foto Mulai Tahapan*), pengguna diwajibkan mengambil foto melalui tombol **Kamera**. 

Ketika perangkat (laptop/PC) tidak memiliki webcam fisik atau izin kamera terblokir, sistem menampilkan kesalahan:
```
Requested device not found
```
Hal ini menghentikan proses pengisian formulir. Tool ini bertindak sebagai jembatan cerdas (*intelligent bridge*) yang:
1. Menghapus atribut pemaksa kamera (`capture`) pada elemen input file formulir.
2. Melakukan *mocking* aman pada API WebRTC (`navigator.mediaDevices.getUserMedia`) dengan mengalirkan berkas gambar lokal pengguna melalui **Virtual HTML5 Canvas Stream**.
3. **Mempertahankan Integritas Data:** Foto yang dialirkan tetap diproses oleh sistem web aplikasi dan otomatis mendapatkan stempel label resmi bawaan POP SIPGN.

---

## 🚀 Fitur Utama

- ✅ **Bypass Kamera Fisik:** Tidak perlu webcam, tidak ada error *"Requested device not found"*.
- ✅ **Mendukung Laptop & HP:** Bekerja di PC (Chrome/Brave/Edge) dan Smartphone (Android Chrome & Kiwi Browser).
- ✅ **Stempel Resmi Tetap Ada:** Menjaga alur pemrosesan foto aplikasi sehingga watermark tanggal/lokasi/POP tetap tertera.
- ✅ **Kebal CSP (Content Security Policy):** Menggunakan `@grant unsafeWindow` sehingga aman dari blokir keamanan browser.
- ✅ **PnP (Plug and Play):** Dilengkapi floating widget interaktif di pojok kanan bawah untuk pratinjau foto sebelum disubmit.

---

## 📂 Struktur Repositori

```text
aplod-galeri/
├── scripts/
│   ├── mbg-photo-helper.user.js       # Script utama Tampermonkey (Desktop & Kiwi Browser)
│   ├── bookmarklet.js                 # Source code bookmarklet (terbaca)
│   └── bookmarklet-minified.url.txt   # Kode 1-baris siap tempel di bookmark HP
├── docs/
│   ├── PANDUAN_LAPTOP.md              # Panduan lengkap laptop (Brave, Chrome, Edge)
│   └── PANDUAN_HP.md                  # Panduan lengkap smartphone (Chrome & Kiwi)
├── .gitignore
└── README.md
```

---

## ⚡ Panduan Cepat (Quick Start)

### A. Untuk Laptop / PC (Tampermonkey)
1. Pasang ekstensi **Tampermonkey** dari [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk).
2. Aktifkan **Developer Mode** di menu ekstensi peramban (`chrome://extensions` atau `brave://extensions`).
3. Buka Dashboard Tampermonkey > Buat script baru > Tempel isi dari [`scripts/mbg-photo-helper.user.js`](scripts/mbg-photo-helper.user.js) > Simpan (`Ctrl + S`).
4. Buka formulir `https://pop-sipgn.bgn.go.id/`, gunakan kotak biru di pojok kanan bawah untuk memilih foto dari laptop, lalu klik tombol **Kamera** pada formulir web.

👉 *Baca panduan lengkap laptop:* [`docs/PANDUAN_LAPTOP.md`](docs/PANDUAN_LAPTOP.md)

---

### B. Untuk Smartphone / HP (Bookmarklet)
1. Di Google Chrome HP, buat bookmark baru dengan nama `Bypass Kamera`.
2. Masukkan kode dari [`scripts/bookmarklet-minified.url.txt`](scripts/bookmarklet-minified.url.txt) ke kolom URL bookmark.
3. Saat membuka formulir di HP, ketik `Bypass Kamera` di kolom alamat browser, lalu ketuk bookmark tersebut.
4. Pilih foto dari Galeri HP Anda, lalu ketuk tombol **Kamera** di formulir web.

👉 *Baca panduan lengkap smartphone:* [`docs/PANDUAN_HP.md`](docs/PANDUAN_HP.md)

---

## 🛠️ Cara Upload Repositori Ini ke GitHub

Jalankan perintah berikut di terminal / command prompt pada folder ini:

```bash
# 1. Inisialisasi Git
git init

# 2. Tambahkan semua file
git add .

# 3. Buat commit pertama
git commit -m "feat: inisialisasi MBG Local Photo Helper untuk laptop dan HP"

# 4. Ganti ke branch main
git branch -M main

# 5. Sambungkan ke repositori GitHub Anda (ganti URL dengan repositori Anda)
git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO.git

# 6. Unggah ke GitHub
git push -u origin main
```

---

## 🛡️ Lisensi & Disclaimer
Proyek ini dibuat untuk keperluan pengujian fungsional dan otomasi operasional peramban internal (Client-Side). Seluruh data foto diproses secara lokal di perangkat pengguna tanpa transmisi ke pihak ketiga.
