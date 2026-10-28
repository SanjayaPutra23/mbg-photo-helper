# MBG - Local Photo Helper (POP SIPGN) 📸⚡

> **Userscript & Bookmarklet Multi-Foto** untuk mengunggah rangkaian foto dokumentasi kegiatan Satuan Pelayanan Pemenuhan Gizi (**SPPG**) langsung dari penyimpanan lokal (laptop) atau galeri (smartphone) pada aplikasi web **POP SIPGN** (`https://pop-sipgn.bgn.go.id/`), mengatasi kendala kamera fisik yang tidak terdeteksi (*"Requested device not found"*) serta mempercepat pengunggahan banyak foto sekaligus tanpa memilih ulang satu per satu.

---

## 📌 Latar Belakang & Masalah

Pada aplikasi web **Aplikasi Kurir / POP SIPGN** di lingkungan **Badan Gizi Nasional (BGN)**, petugas lapangan/Aslap diwajibkan mendokumentasikan rangkaian kegiatan harian yang mencakup setidaknya **4 foto dokumentasi**:
1. **Foto Makanan / Hasil Masakan** (kondisi matang siap saji)
2. **Foto Ompreng / Wadah Makanan** (wadah stainless bersih & steril)
3. **Foto Pencucian Ompreng** (proses sanitasi dan pencucian)
4. **Foto Dokumentasi Pendukung Lainnya** (serah terima / kondisi lapangan)

### Kendala Sebelumnya (Versi 1.x & 2.0):
1. **Hanya 1 Foto Per Sesi:** Pengguna harus mengulang klik tombol "Pilih Foto" dari awal setiap kali ingin mengisi slot foto berikutnya di form POP SIPGN.
2. **Error Kamera Fisik:** Di laptop atau PC tanpa webcam fisik, browser menampilkan pesan kegagalan WebRTC:
   ```text
   Requested device not found
   ```
3. **Keterbatasan API Aliran Video:** POP SIPGN menggunakan penangkapan kamera langsung melalui WebRTC (`navigator.mediaDevices.getUserMedia`), bukan unggah multipart sekaligus.

---

## 🚀 Fitur Baru (Versi 2.1 - Multi-Foto Antrean Cerdas)

- ✅ **Pemilihan Banyak Foto Sekaligus (`multiple`):** Pilih 4 foto atau lebih sekaligus dari File Explorer laptop atau Galeri smartphone.
- ✅ **Penambahan Foto Fleksibel (Append):** Menambahkan foto baru kapan saja tanpa menghapus foto yang sudah dipilih sebelumnya.
- ✅ **Pratinjau & Status Real-Time:** Menampilkan thumbnail, nama file, ukuran, label kategori dokumentasi, serta badge status:
  - 🟡 `Menunggu`: Menunggu giliran dalam antrean.
  - 🔵 `📷 AKTIF DI KAMERA`: Sedang siap dialirkan ke kamera virtual POP SIPGN.
  - 🟢 `✓ Berhasil`: Telah selesai dijepret dan diberi stempel resmi POP SIPGN.
  - 🔴 `✕ Gagal`: Mengalami kendala (disediakan tombol **"Ulangi/Coba Lagi"** khusus foto tersebut).
- ✅ **Antrean Otomatis (*Smart Auto-Advancing Queue*):** Setelah pengguna menjepret Foto #1 di POP SIPGN, sistem otomatis memajukan Foto #2 menjadi aktif di kamera, lalu Foto #3, dan Foto #4 secara berurutan.
- ✅ **Mekanisme Coba Lagi Parsial (Retry):** Jika 1 foto gagal, cukup klik "Ulangi" pada foto tersebut tanpa mengulang foto-foto lain yang sudah sukses diunggah.
- ✅ **Validasi Aman:** Memvalidasi format (JPG, PNG, WEBP) serta membatasi ukuran file maksimal (15 MB) agar browser tetap stabil dan responsif.
- ✅ **Bisa Dikecilkan (Minimize / Expand):** Widget dapat disembunyikan menjadi pil kecil di pojok layar agar tidak menghalangi isian form POP SIPGN.
- ✅ **Stempel Resmi Tetap Utuh:** Foto yang dialirkan tetap diproses oleh alur internal POP SIPGN sehingga watermark lokasi, tanggal, jam, dan POP tetap tertera otomatis.

---

## 📂 Struktur Repositori

```text
aplod-galeri/
├── scripts/
│   ├── mbg-photo-helper.user.js       # Script utama Tampermonkey Desktop & Kiwi Browser (v2.1)
│   ├── bookmarklet.js                 # Source code bookmarklet mobile & desktop (v2.1)
│   ├── bookmarklet-minified.url.txt   # URL bookmarklet siap tempel untuk Chrome HP
│   └── minify-bookmarklet.cjs         # Script kompilasi bookmarklet
├── tests/
│   ├── test-scenarios.test.mjs        # Pengujian otomatis 10 skenario wajib (Node.js test runner)
│   └── mock-pop-sipgn.html            # Halaman simulasi lokal pengujian form POP SIPGN
├── docs/
│   ├── PANDUAN_LAPTOP.md              # Panduan lengkap laptop (Brave, Chrome, Edge)
│   └── PANDUAN_HP.md                  # Panduan lengkap smartphone (Chrome & Kiwi)
├── LAPORAN_PROYEK.md                  # Laporan teknis resmi evaluasi dan arsitektur
├── .gitignore
└── README.md
```

---

## ⚡ Panduan Cepat (Quick Start)

### A. Untuk Laptop / PC (Tampermonkey)
1. Pasang ekstensi **Tampermonkey** dari [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk).
2. Aktifkan **Developer Mode** di menu ekstensi peramban (`chrome://extensions` atau `brave://extensions`).
3. Buka Dashboard Tampermonkey > Buat script baru > Tempel isi dari [`scripts/mbg-photo-helper.user.js`](scripts/mbg-photo-helper.user.js) > Simpan (`Ctrl + S`).
4. Buka formulir `https://pop-sipgn.bgn.go.id/`.
5. Di pojok kanan bawah, klik **"+ Pilih / Tambah Foto"** dan pilih 4 foto sekaligus (Makanan, Ompreng, Cuci Ompreng, Pendukung).
6. Klik tombol **Kamera** pada formulir web secara bertahap. Foto akan mengalir otomatis sesuai urutan antrean!

👉 *Baca panduan lengkap laptop:* [`docs/PANDUAN_LAPTOP.md`](docs/PANDUAN_LAPTOP.md)

---

### B. Untuk Smartphone / HP (Bookmarklet)
1. Di Google Chrome HP, buat bookmark baru dengan nama `Bypass Kamera`.
2. Masukkan kode dari [`scripts/bookmarklet-minified.url.txt`](scripts/bookmarklet-minified.url.txt) ke kolom URL bookmark.
3. Saat membuka formulir di HP, ketik `Bypass Kamera` di kolom alamat browser, lalu ketuk bookmark tersebut.
4. Pilih 4 foto sekaligus dari Galeri HP Anda, lalu ketuk tombol **Kamera** di formulir web secara berurutan.

👉 *Baca panduan lengkap smartphone:* [`docs/PANDUAN_HP.md`](docs/PANDUAN_HP.md)

---

## 🧪 Pengujian Lokal & Simulasi Mandiri

Aplikasi ini dilengkapi pengujian otomatis dan simulator mandiri tanpa menyentuh server produksi:

```bash
# 1. Jalankan pengujian 10 skenario otomatis
node --test tests/test-scenarios.test.mjs
```

Untuk menguji tampilan interaktif di peramban:
Buka berkas [`tests/mock-pop-sipgn.html`](tests/mock-pop-sipgn.html) langsung di browser Anda (klik ganda atau via live server lokal).

---

## 🛡️ Keamanan & Privasi
- **100% Client-Side:** Seluruh berkas gambar diproses langsung di memori browser pengguna (`Blob URL` dan `HTML5 Canvas`).
- **Nol Transmisi Pihak Ketiga:** Tidak ada data gambar, token, atau informasi pengguna yang dikirim ke server luar selain domain resmi `pop-sipgn.bgn.go.id`.
- **Integritas Berkas Asli:** Berkas asli di komputer atau ponsel pengguna tidak pernah diubah atau dihapus.
