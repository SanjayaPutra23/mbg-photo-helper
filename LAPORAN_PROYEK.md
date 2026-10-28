# Laporan Proyek: MBG Photo Helper Versi 2.2.0 (Unified UI, Koleksi Persisten & Multi-Sekolah)

**Nama Proyek:** MBG - Local Photo Helper (Multi-Foto & Multi-Sekolah POP SIPGN)  
**Platform Target:** Desktop (Google Chrome, Brave, Edge via Tampermonkey) & Smartphone (Android Chrome, iOS Safari via Bookmarklet Loader / Kiwi Browser)  
**Versi:** 2.2.0 (Arsitektur Terpadu Desktop & Mobile)  
**Status:** Selesai, Lolos 21 Pengujian Otomatis (14 Skenario Wajib + 7 Skenario Mobile), & Siap Produksi (Production Ready)  

---

## 1. Latar Belakang Masalah & Temuan Pengujian Langsung

Berdasarkan temuan di lapangan oleh pengguna smartphone dan evaluasi teknis lanjutan:
1. **Bookmarklet Minified Terlalu Panjang:**
   Kode bookmarklet minified versi mandiri berukuran >20 KB sehingga sulit dan kurang nyaman dipasang pada kolom URL bookmark Google Chrome ponsel. Beberapa peramban mobile bahkan memotong teks URL yang terlalu panjang.
2. **Perbedaan Tampilan Desktop dan HP (UI Discrepancy):**
   Versi bookmarklet mobile sebelumnya dibuat dengan template antarmuka terpisah yang minimalis dan terdegradasi, sehingga pengalaman pengguna (UX) di HP jauh berbeda dan kurang nyaman dibandingkan versi laptop/PC.
3. **Koleksi Foto Hilang Saat Berganti Sekolah:**
   Sebelumnya, foto sumber diperlakukan sebagai antrean sekali pakai (*single-use queue*). Ketika satu rangkaian upload selesai atau pengguna berpindah formulir/sekolah, foto dianggap selesai dan hilang, memaksa petugas membuka galeri dan memilih ulang foto dari awal untuk sekolah berikutnya.
4. **Ketergantungan Tombol "✓ Selesai":**
   Tombol manual "✓ Selesai" pada versi sebelumnya menimbulkan kerancuan apakah foto sudah terkirim ke server atau hanya ditandai lokal, serta berisiko menghentikan pemakaian foto untuk formulir lain.

---

## 2. Solusi Arsitektur Baru (Versi 2.2.0)

Untuk menyelesaikan seluruh kendala di atas tanpa merombak tampilan desktop yang sudah disetujui, diimplementasikan solusi teknis berikut:

### A. Arsitektur Kode Terpadu 100% (Unified Desktop & Mobile Engine)
- Menghapus implementasi UI mobile terpisah. Kode inti logika dan antarmuka antara `scripts/mbg-photo-helper.user.js` (Tampermonkey laptop) dan `scripts/bookmarklet.js` (Bookmarklet ponsel) dibuat **identik 100%**.
- Tampilan didesain responsif penuh dengan CSS adaptif (`max-width: calc(100vw - 28px)`, flexbox, overflow handling), sehingga tampil elegan dan rapi baik di layar monitor PC maupun di layar smartphone vertikal.

### B. Penyimpanan Persisten Koleksi Foto (IndexedDB Storage)
- Menggunakan browser **IndexedDB API** (`MBG_PhotoHelper_DB`, object store `photo_collection`) untuk menyimpan objek `File`/`Blob` secara biner asli.
- Keunggulan dibanding `localStorage`: Tidak terhalang kuota string 5 MB, tidak memerlukan konversi base64 yang boros memori, serta kebal terhadap reload halaman dan navigasi aplikasi Single Page Application (SPA).
- **Aturan Ketat:** Foto sumber dalam koleksi **TIDAK PERNAH DIHAPUS** oleh peristiwa upload berhasil, upload gagal, selesainya antrean, maupun perpindahan halaman. Foto hanya dapat dihapus jika pengguna secara sadar mengklik tombol hapus (**🗑**) pada foto tertentu atau tombol **"Reset Koleksi"** dengan konfirmasi.

### C. Pemisahan Status & Konteks Multi-Sekolah (Multi-School Support)
- Memisahkan secara bersih tiga lapisan status:
  1. `state.collection`: Koleksi foto sumber yang persisten dan permanen.
  2. `state.currentSchool`: Konteks sekolah yang sedang aktif (misalnya `Sekolah #1`, `SD Negeri Cilandak 02`).
  3. `state.schoolDeliveries[schoolId][photoId]`: Status pengiriman per sekolah (`pending`, `sent`, `failed`).
- Dengan pemisahan ini, pengguna dapat mengunggah 4 foto untuk Sekolah #1 hingga berstatus `✓ Terkirim`, lalu mengetuk tombol **"🔄 Sesi Baru"** untuk Sekolah #2. Foto-foto di dalam koleksi **tetap utuh 100%**, dan status pengiriman untuk Sekolah #2 dimulai kembali dari awal tanpa memilih ulang foto dari galeri.

### D. Penghapusan Tombol "✓ Selesai" & Penyempurnaan Kamera Virtual
- Tombol "✓ Selesai" telah dihapus sepenuhnya.
- Kemajuan antrean kamera virtual berjalan otomatis (*auto-advance*) saat modul kamera POP SIPGN selesai menjepret (terdeteksi saat `videoTrack.stop()` atau `ended` dipicu).
- Jika pengguna ingin melompati atau memilih foto tertentu di luar urutan, tersedia tombol **"📷 Pilih ke Kamera"** pada setiap kartu foto.
- Menambahkan **WebRTC Canvas Scaling (max 1280px)** dengan deteksi `img.complete` dan timeout fallback 2 detik agar foto resolusi tinggi (12MP-108MP) dari kamera ponsel tidak membebani memori GPU.

### E. Bookmarklet Loader Super Ringkas (<300 Bytes)
- Disediakan berkas [`scripts/bookmarklet-loader.url.txt`](scripts/bookmarklet-loader.url.txt) dengan panjang hanya **~256 karakter**.
- Sangat nyaman dan mudah ditempelkan pada formulir bookmark browser Android/iOS tanpa risiko terpotong.
- Dilengkapi penanganan galat jaringan (`onerror`) yang menampilkan notifikasi jelas jika ponsel sedang luring (offline).

---

## 3. Berkas yang Diperbarui dan Dibuat

| Berkas | Status | Rincian Perubahan |
| :--- | :---: | :--- |
| `scripts/mbg-photo-helper.user.js` | **Diperbarui (v2.2.0)** | Menambahkan IndexedDB persistence, multi-school context (`currentSchool`, `schoolDeliveries`), tombol "🔄 Sesi Baru", WebRTC canvas scaling max 1280px, menghapus tombol "✓ Selesai", UI responsif terpadu. |
| `scripts/bookmarklet.js` | **Diperbarui (v2.2.0)** | Disinkronkan 100% dengan kode inti userscript sehingga fungsionalitas dan tampilan mobile sama persis dengan desktop. |
| `scripts/bookmarklet-loader.url.txt` | **Baru** | Kode loader ultra-pendek (<300 bytes) dengan error handler `onerror`. |
| `scripts/bookmarklet-minified.url.txt` | **Diperbarui (v2.2.0)** | Versi mandiri minified 1-baris tanpa karakter newline yang lolos uji sintaks peramban. |
| `scripts/minify-bookmarklet.cjs` | **Diperbarui** | Peningkatan kompresor untuk menangani regex literal, karakter escape, dan penghapusan seluruh newline. |
| `tests/test-scenarios.test.mjs` | **Diperbarui (14 Skenario)** | Pengujian 14 skenario wajib arsitektur v2.2.0: kompatibilitas single photo, 4 foto SOP, append, delete, resistensi penghapusan, multi-sekolah, sinkronisasi IndexedDB, identitas kode desktop/mobile, dan ukuran loader. |
| `tests/mobile-bookmarklet.test.mjs` | **Diperbarui (7 Skenario)** | Pengujian unit simulasi mobile: format minified, intervensi form capture, canvas scaling, auto-advance, manual selection, dan mode perkecil (minimize). |
| `docs/PANDUAN_HP.md` | **Diperbarui** | Panduan smartphone diperbarui untuk instalasi Bookmarklet Loader, pemakaian berulang multi-sekolah, dan tips Chrome/Kiwi. |
| `docs/PANDUAN_LAPTOP.md` | **Diperbarui** | Panduan desktop diperbarui untuk fitur multi-sekolah dan koleksi persisten v2.2.0. |
| `README.md` | **Diperbarui** | Dokumentasi utama repositori diperbarui mencakup fitur v2.2.0 dan petunjuk pengujian. |

---

## 4. Hasil Pengujian Otomatis

Pengujian dijalankan menggunakan Node.js Test Runner:

```bash
node --test tests/*.test.mjs
```

### Rekapitulasi Hasil:
- **Total Pengujian:** 21 skenario uji
- **Hasil:** **21 Lolos (100% PASS), 0 Gagal, 0 Dibatalkan**
- **Durasi Eksekusi:** ~7,3 detik

### Rincian 14 Skenario Wajib (`tests/test-scenarios.test.mjs`):
1. **Satu foto tetap dapat digunakan:** Lolos (kompatibilitas backward ke `win.mbgSelectedFile`).
2. **Empat foto dapat dipilih sekaligus sesuai SOP MBG:** Lolos (Makanan, Ompreng, Cuci, Pendukung).
3. **Foto dapat ditambahkan tanpa mengganti foto lama (Append):** Lolos (koleksi bertambah secara dinamis).
4. **Foto dapat dihapus secara manual dari koleksi sumber:** Lolos (hanya foto terpilih yang terhapus).
5. **Upload berhasil TIDAK menghapus foto sumber:** Lolos (status `sent`, foto tetap ada di `collection`).
6. **Upload gagal TIDAK menghapus foto sumber:** Lolos (status `failed`, foto tetap ada di `collection`).
7. **Koleksi yang sama dapat digunakan untuk dua sekolah berbeda:** Lolos (koleksi utuh untuk Sekolah #2).
8. **Status sekolah pertama TIDAK membuat sekolah kedua dianggap selesai:** Lolos (isolasi status per sekolah).
9. **Foto yang berhasil tidak dikirim ulang tanpa kebutuhan:** Lolos (auto-advance langsung ke foto berikutnya).
10. **Tampilan desktop dan mobile menggunakan fungsi & logika yang sama:** Lolos (kode inti identik 100%).
11. **Loader dan bookmarklet minified menginisialisasi UI yang konsisten:** Lolos (loader <300 bytes, valid JS).
12. **Kegagalan memuat script eksternal ditangani dengan jelas di loader:** Lolos (`onerror` aktif).
13. **Perpindahan halaman SPA tidak menghilangkan koleksi:** Lolos (state memori dan storage terlindungi).
14. **Perilaku penyimpanan koleksi tersinkronisasi ke IndexedDB:** Lolos (object store menyimpan biner foto).

### Rincian 7 Skenario Mobile Unit Test (`tests/mobile-bookmarklet.test.mjs`):
1. **Validasi format bookmarklet minified (tanpa newline & valid URL):** Lolos.
2. **Intervensi atribut `capture="camera"` pada form mobile:** Lolos.
3. **Pemilihan 4 foto di HP dan pembaruan state:** Lolos.
4. **WebRTC Canvas Scaling aman mencegah crash memori HP:** Lolos.
5. **Otomatisasi kamera virtual & pemajuan antrean tanpa tombol '✓ Selesai':** Lolos.
6. **Pemilihan manual foto ke kamera di mobile:** Lolos.
7. **Mode perkecil (minimize) dan buka kembali di mobile:** Lolos.

---

## 5. Panduan Pengujian Ulang di Perangkat HP

Untuk menguji ulang di smartphone secara langsung:
1. **Pemasangan Pintasan:**
   - Buka Google Chrome di ponsel.
   - Buat bookmark baru bernama `Bypass Kamera`.
   - Salin isi dari berkas [`scripts/bookmarklet-loader.url.txt`](scripts/bookmarklet-loader.url.txt) dan tempel ke kolom URL bookmark.
2. **Pengujian Alur Dokumentasi:**
   - Buka halaman POP SIPGN di Chrome ponsel.
   - Ketik `Bypass Kamera` di kolom alamat browser, lalu ketuk bookmark tersebut.
   - Perhatikan widget MBG Photo Helper muncul di pojok kanan bawah dengan tampilan responsif yang rapi.
   - Ketuk `+ Pilih / Tambah Foto` dan pilih 4 foto dari galeri.
   - Ketuk tombol kamera pada form POP SIPGN untuk mengisi foto 1 s/d 4. Perhatikan kamera berpindah secara otomatis ke foto berikutnya setiap kali jepret selesai.
   - Setelah selesai form pertama, buka form sekolah kedua, lalu ketuk `🔄 Sesi Baru`.
   - Pastikan keempat foto Anda tetap ada di dalam widget tanpa perlu membuka galeri lagi.
