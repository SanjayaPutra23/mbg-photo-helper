# Panduan Pemasangan & Penggunaan (Laptop / PC) — Multi-Foto & Multi-Sekolah

Panduan ini ditujukan untuk pengguna komputer/laptop berbasis Windows, macOS, atau Linux menggunakan browser Google Chrome, Brave, atau Microsoft Edge dengan **MBG Photo Helper Versi 2.2.0**.

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

## 3. Pemasangan / Pembaruan Script ke Versi 2.2.0
1. Klik ikon **Tampermonkey** di bilah kanan atas browser Anda.
2. Klik **Dashboard** lalu:
   - Jika sudah memasang versi lama: Klik nama script `MBG - Local Photo Helper`, hapus seluruh teks lama, ganti dengan kode baru.
   - Jika baru memasang: Pilih tab **+** (*Create a new script*), hapus template bawaan.
3. Salin seluruh isi berkas [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js) dan tempelkan ke editor.
4. Tekan **`Ctrl + S`** untuk menyimpan.
5. Tutup tab editor Tampermonkey.

---

## 4. Cara Penggunaan Alur Multi-Foto & Multi-Sekolah di Halaman POP SIPGN

### A. Memilih & Mengelola Koleksi Foto Sumber:
1. **Buka Formulir POP SIPGN:** Akses `https://pop-sipgn.bgn.go.id/` pada menu tahapan dokumentasi SPPG Anda.
2. **Lihat Widget di Pojok Kanan Bawah:** Kotak bertuliskan **"MBG Photo Helper v2.2"** akan muncul otomatis dengan indikator hijau aktif.
3. **Pilih 4 Foto Kegiatan Sekaligus:**
   - Klik tombol biru **"+ Pilih / Tambah Foto"**.
   - Pada jendela File Explorer komputer Anda, pilih 4 foto kegiatan sekaligus (tahan tombol `Ctrl` saat mengklik berkas):
     * *1. Foto Makanan / Hasil Masakan*
     * *2. Foto Ompreng / Wadah Makanan*
     * *3. Foto Kegiatan Pencucian Ompreng*
     * *4. Foto Dokumentasi Pendukung*
   - Tekan **Open**. Seluruh foto akan masuk ke daftar koleksi sumber yang persisten (disimpan ke IndexedDB browser).
4. **Fleksibilitas Koleksi:**
   - Anda dapat menambahkan foto lain kapan saja dengan mengklik lagi **"+ Pilih / Tambah Foto"** tanpa menghapus foto yang sudah ada.
   - Untuk menghapus foto yang keliru, klik ikon tempat sampah (**🗑**) pada kartu foto tersebut.

### B. Mengisi Dokumentasi Sekolah Pertama:
1. Klik tombol **Kamera** pada slot Foto #1 di form POP SIPGN. Foto pertama otomatis mengalir ke layar kamera virtual. Klik jepret/simpan di POP SIPGN.
2. Saat penangkapan foto selesai, antrean virtual otomatis memajukan kamera ke Foto #2.
3. Lanjutkan klik tombol **Kamera** pada slot Foto #2, #3, dan #4.
4. Status pengiriman setiap foto untuk sekolah tersebut akan ditandai dengan badge hijau (**✓ Terkirim**).

### C. Menggunakan Foto yang Sama untuk Sekolah Berikutnya (Tanpa Pilih Ulang):
1. Beralih ke formulir sekolah kedua di POP SIPGN.
2. Klik tombol **"🔄 Sesi Baru"** di bagian header widget, lalu beri nama sekolah (misalnya `SD Negeri Cilandak 02`).
3. **Koleksi foto sumber Anda tetap utuh 100%!** Anda tidak perlu memilih ulang berkas dari laptop.
4. Status pengiriman akan siap kembali dan Anda langsung dapat menekan tombol kamera pada form sekolah kedua.

---

## 5. Menangani Kendala (Troubleshooting)

- **Ingin Memilih Foto Tertentu ke Kamera Secara Manual:**
  - Klik tombol **"📷 Pilih ke Kamera"** pada kartu foto mana saja untuk langsung mengarahkannya ke kamera tanpa terikat urutan otomatis.
- **Mengosongkan Seluruh Koleksi Sumber:**
  - Klik tombol abu-abu **"Reset Koleksi"** di samping tombol tambah foto. Browser akan meminta konfirmasi sebelum membersihkan IndexedDB.
- **Mengecilkan Tampilan Widget:**
  - Klik tombol minus (**−**) pada bilah judul widget untuk mengecilkannya menjadi pil minimalis. Klik tombol **Buka** kapan saja untuk memperbesarnya kembali.
