# MBG - Local Photo Helper (POP SIPGN) 📸⚡

> **Userscript & Bookmarklet Multi-Foto & Multi-Sekolah** untuk mengunggah rangkaian foto dokumentasi kegiatan Satuan Pelayanan Pemenuhan Gizi (**SPPG**) langsung dari penyimpanan lokal (laptop) atau galeri (smartphone) pada aplikasi web **POP SIPGN** (`https://pop-sipgn.bgn.go.id/`). Mengatasi kendala kamera fisik yang tidak terdeteksi (*"Requested device not found"*), menyediakan antarmuka desktop & mobile yang **100% konsisten**, serta mendukung **koleksi foto persisten (IndexedDB)** yang dapat digunakan berulang kali untuk banyak sekolah tanpa memilih ulang dari galeri.

---

## 📌 Latar Belakang & Kebutuhan

Pada aplikasi web **Aplikasi Kurir / POP SIPGN** di lingkungan **Badan Gizi Nasional (BGN)**, petugas lapangan/Aslap diwajibkan mendokumentasikan rangkaian kegiatan harian SPPG yang terdiri dari setidaknya **4 foto dokumentasi**:
1. **Foto Makanan / Hasil Masakan** (kondisi matang siap saji)
2. **Foto Ompreng / Wadah Makanan** (wadah stainless bersih & higienis)
3. **Foto Pencucian Ompreng** (proses sanitasi dan pencucian ompreng)
4. **Foto Dokumentasi Pendukung Lainnya** (serah terima / kondisi lapangan)

### Kendala yang Diselesaikan pada Versi 2.2.0:
1. **Foto Terhapus/Hilang Setelah Upload:** Pada versi sebelumnya, foto dianggap selesai dan terhapus atau antrean terhenti, sehingga saat beralih ke formulir sekolah berikutnya petugas harus memilih ulang foto dari galeri.
2. **Perbedaan Tampilan Desktop vs HP:** Versi mobile sebelumnya memiliki tampilan minimalis yang terpisah dan kurang nyaman. Versi 2.2.0 menyatukan seluruh logika dan UI desktop & mobile menjadi satu mesin terpadu yang responsif.
3. **Keterbatasan URL Bookmark HP:** Kode bookmarklet minified terlalu panjang untuk beberapa aplikasi browser ponsel. Versi 2.2.0 menyediakan **Bookmarklet Loader** pendek (<300 bytes) dengan error handler bawaan.
4. **Ketergantungan Tombol "✓ Selesai":** Tombol manual "✓ Selesai" kini telah dihapus. Pemisahan status dilakukan dengan bersih antara **koleksi foto sumber** dan **status pengiriman per sekolah**.

---

## 🚀 Fitur Unggulan Versi 2.2.0

- 🔄 **Koleksi Foto Persisten & Bisa Dipakai Berulang (IndexedDB):**
  Foto yang dipilih disimpan secara biner ke dalam IndexedDB browser (`MBG_PhotoHelper_DB`). Foto tidak akan terhapus saat formulir di-submit, saat upload berhasil/gagal, saat halaman di-reload, maupun saat beralih antar halaman SPA.
- 🏫 **Dukungan Multi-Sekolah Mandiri (Multi-School Context):**
  Pengguna cukup memilih foto satu kali, lalu dapat menggunakannya untuk Sekolah #1, Sekolah #2, dst., hanya dengan menekan tombol **"🔄 Sesi Baru"**. Status pengiriman dicatat independen per sekolah.
- 📱 **UI Desktop & HP Terpadu 100% (Unified Architecture):**
  Kode logika dan tampilan antarmuka antara Userscript laptop (`mbg-photo-helper.user.js`) dan Bookmarklet mobile (`bookmarklet.js`) identik 100%. Desain adaptif responsif untuk layar smartphone tanpa mengurangi fitur.
- 🔗 **Bookmarklet Loader Ringkas (<300 Bytes):**
  Pintasan URL loader yang sangat pendek dan aman dipasang di kolom bookmark browser ponsel mana pun, dilengkapi penanganan kesalahan jaringan (`onerror`).
- 📷 **Auto-Advance Kamera Virtual Pintar:**
  Antrean foto virtual otomatis berganti ke foto berikutnya saat track kamera ditutup/selesai dijepret oleh form POP SIPGN. Tersedia tombol **"📷 Pilih ke Kamera"** jika ingin melompati atau memilih foto secara manual.
- 🛡️ **Proteksi Memori Grafis (Canvas Scaling max 1280px):**
  Foto beresolusi tinggi (kamera 12MP-108MP) diskalakan secara cerdas ke dimensi maksimal 1280px untuk mencegah crash memori/GPU pada ponsel.
- 🗂️ **Penambahan & Pengelolaan Fleksibel:**
  Mendukung penambahan foto susulan (*append*) tanpa menimpa foto lama, penghapusan manual foto tertentu, dan reset koleksi dengan konfirmasi keamanan.

---

## 📂 Struktur Repositori

```text
aplod-galeri/
├── scripts/
│   ├── mbg-photo-helper.user.js       # Script Tampermonkey Laptop/PC & Kiwi Browser (v2.2.0)
│   ├── bookmarklet.js                 # Source code bookmarklet mesin terpadu (v2.2.0)
│   ├── bookmarklet-loader.url.txt     # Loader pendek (<300 bytes) untuk Chrome/Safari HP
│   ├── bookmarklet-minified.url.txt   # Kode mandiri minified tanpa newline (opsi offline)
│   └── minify-bookmarklet.cjs         # Script kompilasi & verifikasi integritas sintaks
├── tests/
│   ├── test-scenarios.test.mjs        # Pengujian 14 skenario wajib arsitektur v2.2.0
│   ├── mobile-bookmarklet.test.mjs    # Pengujian unit simulasi lingkungan mobile (7 skenario)
│   └── mock-pop-sipgn.html            # Halaman simulasi lokal form POP SIPGN multi-sekolah
├── docs/
│   ├── PANDUAN_LAPTOP.md              # Panduan pemasangan & penggunaan di Laptop/PC
│   └── PANDUAN_HP.md                  # Panduan lengkap Chrome Android, Safari & Kiwi
├── LAPORAN_PROYEK.md                  # Laporan teknis evaluasi, diagnosis & arsitektur v2.2.0
├── .gitignore
└── README.md
```

---

## ⚡ Panduan Cepat (Quick Start)

### A. Untuk Laptop / PC (Tampermonkey)
1. Pasang ekstensi **Tampermonkey** di browser Chromium Anda (Chrome / Brave / Edge).
2. Aktifkan **Developer Mode** di menu ekstensi peramban.
3. Buat script baru di Tampermonkey, tempelkan isi berkas [`scripts/mbg-photo-helper.user.js`](scripts/mbg-photo-helper.user.js), lalu simpan (`Ctrl + S`).
4. Buka `https://pop-sipgn.bgn.go.id/`. Di pojok kanan bawah, klik **"+ Pilih / Tambah Foto"** dan pilih 4 foto sekaligus.
5. Klik tombol **Kamera** pada form POP SIPGN secara berurutan. Foto akan mengalir otomatis!
6. Untuk beralih ke sekolah berikutnya, klik **"🔄 Sesi Baru"** tanpa perlu memilih ulang foto dari galeri.

👉 *Baca selengkapnya:* [`docs/PANDUAN_LAPTOP.md`](docs/PANDUAN_LAPTOP.md)

---

### B. Untuk Smartphone / HP (Bookmarklet Loader)
1. Di Google Chrome / Safari HP, buat bookmark baru dengan nama `Bypass Kamera`.
2. Tempelkan URL loader dari [`scripts/bookmarklet-loader.url.txt`](scripts/bookmarklet-loader.url.txt) ke kolom URL bookmark.
3. Buka formulir `https://pop-sipgn.bgn.go.id/` di HP, ketik `Bypass Kamera` di kolom alamat browser, lalu ketuk bookmark.
4. Pilih 4 foto sekaligus dari Galeri HP Anda, lalu ketuk tombol **Kamera** pada form POP SIPGN.

👉 *Baca selengkapnya:* [`docs/PANDUAN_HP.md`](docs/PANDUAN_HP.md)

---

## 🧪 Pengujian Otomatis (Test Suite)

Pengujian dapat dijalankan secara lokal menggunakan Node.js test runner bawaan:

```bash
# Jalankan seluruh rangkaian test (14 skenario wajib + 7 skenario mobile = 21 tests)
node --test tests/*.test.mjs
```

Hasil pengujian otomatis:
- **14 Skenario Wajib:** 100% Lolos (Satu foto, multi-foto, append, delete, status independen per sekolah, persistensi IndexedDB, resistensi SPA, dsb).
- **7 Skenario Mobile:** 100% Lolos (Sintaks minified tanpa newline, WebRTC canvas scaling aman, intercept capture form, auto-advance, minimize/expand).
