# Panduan Penggunaan pada Smartphone (Android & iOS) — Multi-Foto & Multi-Sekolah

Aplikasi **MBG Photo Helper (Versi 2.2.0)** hadir dengan antarmuka dan fungsi terpadu yang **100% konsisten antara laptop/PC dan HP**. Foto yang sudah Anda pilih dari Galeri akan **tetap tersimpan (persisten)** dan dapat digunakan berulang kali untuk dokumentasi beberapa sekolah secara praktis.

Terdapat dua metode untuk menggunakannya di smartphone:
- **Metode A (Bookmarklet Loader — Sangat Direkomendasikan):** Menggunakan kode URL pendek yang nyaman dipasang di Google Chrome / Safari bawaan HP.
- **Metode B (Kiwi Browser):** Otomatis 100% menggunakan ekstensi Tampermonkey seperti di laptop.

---

## METODE A: Menggunakan Bookmarklet (Chrome Android & Safari iOS)

Metode ini tidak membutuhkan install aplikasi baru. Cukup menyimpan pintasan Bookmark di browser HP Anda.

### 1. Cara Menyimpan Pintasan Bookmark (Hanya 1x Setup):
1. Buka Google Chrome di HP Anda.
2. Buka web apa saja (contoh: `google.com`), lalu ketuk tombol **Titik Tiga > Bintang (Bookmark)**.
3. Buka menu **Titik Tiga > Bookmarks (Penanda)**.
4. Cari bookmark yang baru saja dibuat, ketuk tombol **Titik Tiga di sampingnya > Edit**.
5. Ubah data berikut:
   - **Name (Nama):** `Bypass Kamera`
   - **URL:** Hapus link lama, lalu tempelkan kode loader pendek dari berkas [`scripts/bookmarklet-loader.url.txt`](../scripts/bookmarklet-loader.url.txt).
   > 💡 **Kenapa Loader?** Kode loader sangat pendek (di bawah 300 karakter), sehingga tidak akan terpotong oleh kolom URL browser HP dan otomatis selalu memuat versi logika terbaru. Jika ponsel sedang offline atau script gagal dimuat, loader akan menampilkan peringatan yang jelas.
   >
   > *(Opsi Cadangan Offline)*: Anda juga dapat menggunakan kode mandiri dari [`scripts/bookmarklet-minified.url.txt`](../scripts/bookmarklet-minified.url.txt). Pastikan teks URL diawali dengan **`javascript:`**.
6. Simpan atau ketuk tombol kembali.

### 2. Cara Menggunakan Multi-Foto & Multi-Sekolah di HP:
1. Buka formulir POP SIPGN di Chrome HP Anda (`https://pop-sipgn.bgn.go.id/`).
2. Ketuk kolom alamat URL atas, lalu ketik kata: **`Bypass Kamera`**.
3. Di daftar saran pencarian yang muncul, ketuk saran yang berikon **Bintang / Bookmark**.
4. Widget **MBG Photo Helper** akan langsung muncul di pojok kanan bawah layar HP dengan tampilan lengkap yang responsif.
5. Ketuk **"+ Pilih / Tambah Foto"** > Buka **Galeri / Media Picker** > Pilih 4 foto kegiatan sekaligus (Makanan, Ompreng, Cuci Ompreng, Pendukung).
6. Semua foto akan muncul sebagai thumbnail kartu di dalam koleksi sumber.
7. **Dokumentasi Sekolah Pertama:**
   - Ketuk tombol **Kamera** pada slot Foto #1 di form POP SIPGN. Foto pertama otomatis mengalir ke kamera. Ketuk ambil/simpan di POP SIPGN.
   - Sistem kamera virtual akan mendeteksi saat penangkapan selesai dan otomatis memajukan antrean ke Foto #2.
   - Lanjutkan hingga Foto #4 terkirim.
   - Status pengiriman untuk sekolah tersebut akan berubah menjadi hijau (**✓ Terkirim**).
8. **Beralih ke Sekolah Berikutnya (Foto Dipakai Berulang Tanpa Pilih Ulang):**
   - Setelah selesai mengisi form sekolah pertama, buka form sekolah kedua di POP SIPGN.
   - Pada widget MBG Helper, ketuk tombol biru **"🔄 Sesi Baru"** (atau masukkan nama sekolah baru).
   - **Koleksi foto sumber Anda TETAP UTUH 100%!** Anda TIDAK PERLU membuka galeri dan memilih ulang foto.
   - Status pengiriman otomatis direset menjadi siap untuk sekolah kedua, dan Anda langsung dapat menekan tombol Kamera di form sekolah kedua.
9. **Kecilkan Tampilan (Minimize):**
   - Ketuk tanda minus (**−**) pada header widget untuk mengecilkannya menjadi pil mengapung jika menutupi form. Ketuk **Buka** kapan saja untuk memperbesarnya kembali.

---

## METODE B: Menggunakan Kiwi Browser (Otomatis 100% Tanpa Panggil Bookmark)

Jika Anda ingin widget MBG Photo Helper **selalu muncul otomatis** setiap kali membuka halaman POP SIPGN tanpa perlu mengetik bookmark:

1. Unduh **Kiwi Browser** dari Google Play Store (gratis).
2. Buka tautan ekstensi Tampermonkey di Kiwi Browser:  
   `https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk`
3. Klik **Add to Chrome**.
4. Buka menu Titik Tiga > Tampermonkey > Create a new script.
5. Tempelkan seluruh isi dari [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js), lalu simpan (`Ctrl + S` atau ikon disket).
6. Buka `https://pop-sipgn.bgn.go.id/` di Kiwi Browser. Widget otomatis aktif dan koleksi foto tersimpan aman di IndexedDB.
