# Panduan Pemasangan & Penggunaan (Laptop / PC) — Multi-Foto

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

## 3. Pemasangan / Pembaruan Script ke Versi 2.1
1. Klik ikon **Tampermonkey** di bilah kanan atas browser Anda.
2. Klik **Dashboard** lalu:
   - Jika sudah memasang versi lama: Klik nama script `MBG - Local Photo Helper`, hapus seluruh teks lama, ganti dengan kode baru.
   - Jika baru memasang: Pilih tab **+** (*Create a new script*), hapus template bawaan.
3. Salin seluruh isi berkas [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js) dan tempelkan ke editor.
4. Tekan **`Ctrl + S`** untuk menyimpan.
5. Tutup tab editor Tampermonkey.

---

## 4. Cara Penggunaan Alur Multi-Foto di Halaman POP SIPGN

Alur kerja untuk mendokumentasikan 4 foto sekaligus (1. Makanan, 2. Ompreng, 3. Pencucian Ompreng, 4. Pendukung):

1. **Buka Formulir POP SIPGN:** Akses `https://pop-sipgn.bgn.go.id/` pada menu tahapan dokumentasi SPPG Anda.
2. **Lihat Widget di Pojok Kanan Bawah:** Kotak bertuliskan **"MBG Photo Helper v2.1"** akan muncul otomatis dengan titik hijau aktif.
3. **Pilih Foto Sekaligus:**
   - Klik tombol biru **"+ Pilih / Tambah Foto"**.
   - Pada jendela File Explorer komputer Anda, pilih **4 foto sekaligus** (tahan tombol `Ctrl` saat mengklik berkas) atau pilih beberapa foto.
   - Tekan **Open**. Seluruh foto akan masuk ke daftar antrean lengkap dengan label kategori:
     * *1. Foto Makanan / Hasil Masakan*
     * *2. Foto Ompreng / Wadah Makanan*
     * *3. Foto Kegiatan Pencucian Ompreng*
     * *4. Foto Dokumentasi Pendukung*
4. **Periksa dan Kelola Antrean:**
   - Pastikan foto yang aktif ditandai dengan badge biru **📷 AKTIF DI KAMERA**.
   - Jika ada foto yang salah, klik tombol **✕** pada foto tersebut untuk menghapusnya.
   - Anda juga dapat mengklik tombol **"+ Pilih / Tambah Foto"** lagi untuk menambah foto susulan tanpa menghapus foto sebelumnya.
5. **Jalankan Pengambilan Foto di Form POP SIPGN:**
   - Klik tombol **Kamera** pada slot Foto #1 di form web. Foto pertama otomatis muncul di layar kamera. Klik jepret/simpan di POP SIPGN.
   - Berkat fitur **Auto-Next**, foto kedua otomatis menjadi aktif di antrean helper.
   - Lanjutkan klik tombol **Kamera** pada slot Foto #2, #3, dan #4. Seluruh foto akan terisi secara berurutan tanpa perlu membuka-tutup file picker lagi!
6. **Mengecilkan Widget (Opsional):**
   - Klik tanda minus (**−**) di pojok kanan atas widget untuk mengecilkannya menjadi pil mengapung jika Anda ingin melihat area form yang tertutup. Klik **Buka** kapan saja untuk memperbesarnya kembali.

---

## 5. Menangani Kendala (Troubleshooting)

- **Salah Satu Foto Gagal Diunggah:**
  - Klik tombol **"Ulangi"** pada foto yang gagal di widget antrean.
  - Foto tersebut akan otomatis kembali disiapkan sebagai foto aktif di kamera tanpa mengulang foto-foto yang sudah berhasil.
- **Ingin Mengganti Urutan Foto Secara Manual:**
  - Cukup klik tombol **"Aktifkan"** pada kartu foto yang ingin Anda pakai untuk jepretan berikutnya.
- **Ukuran File Terlalu Besar:**
  - Batas ukuran file yang dianjurkan adalah di bawah 15 MB per foto agar browser tidak mengalami penurunan performa saat me-render video stream.
