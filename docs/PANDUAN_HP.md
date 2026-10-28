# Panduan Penggunaan pada Smartphone (Android & iOS) — Multi-Foto

Terdapat dua metode untuk menjalankan bypass kamera dan antrean multi-foto pada smartphone:
- **Metode A (Bookmarklet):** Paling cepat, bekerja langsung di Google Chrome / Safari bawaan tanpa install aplikasi tambahan.
- **Metode B (Kiwi Browser):** Otomatis 100% menggunakan ekstensi Tampermonkey persis seperti di laptop.

---

## METODE A: Menggunakan Bookmarklet (Chrome Android & Safari iOS)

Metode ini tidak membutuhkan aplikasi baru. Cukup menyimpan kode sebagai pintasan Bookmark di peramban HP Anda.

### 1. Cara Menyimpan / Memperbarui Bookmark (Hanya 1x Setup):
1. Buka Google Chrome di HP Anda.
2. Buka web apa saja (contoh: `google.com`), lalu ketuk tombol **Titik Tiga > Bintang (Bookmark)** untuk menyimpannya.
3. Buka menu **Titik Tiga > Bookmarks (Penanda)**.
4. Cari bookmark yang baru saja dibuat atau bookmark lama `Bypass Kamera`, ketuk tombol **Titik Tiga di sampingnya > Edit**.
5. Ubah data berikut:
   - **Name (Nama):** `Bypass Kamera`
   - **URL:** Hapus link lama, lalu tempelkan seluruh teks dari berkas [`scripts/bookmarklet-minified.url.txt`](../scripts/bookmarklet-minified.url.txt).
   > ⚠️ **PENTING (Tips Mobile Chrome):** Pastikan teks URL dimulai dengan **`javascript:`**. Beberapa peramban ponsel secara otomatis memotong awalan `javascript:` saat ditempel. Jika terpotong, ketik kembali kata `javascript:` di bagian paling depan URL.
   > 
   > 💡 *Alternatif Loader Ringan:* Jika ponsel Anda membatasi panjang teks pada form bookmark, gunakan kode dari [`scripts/bookmarklet-loader.url.txt`](../scripts/bookmarklet-loader.url.txt) yang sangat pendek (~170 karakter).
6. Simpan atau tekan tombol kembali.

### 2. Cara Memakai Multi-Foto di HP:
1. Buka formulir POP SIPGN di Chrome HP Anda (`https://pop-sipgn.bgn.go.id/`).
2. Ketuk kolom alamat URL atas, lalu ketik kata: **`Bypass Kamera`**.
3. Di daftar saran pencarian yang muncul, ketuk saran yang berikon **Bintang / Bookmark**.
4. Kotak **"MBG Multi-Foto v2.1"** akan langsung muncul di pojok kanan bawah layar HP.
5. Ketuk **"+ Pilih / Tambah Foto"** > Buka **Galeri / Media Picker** > Pilih 4 foto kegiatan sekaligus (tahan foto pertama untuk memilih beberapa foto).
6. Foto akan tersusun rapi dalam antrean (1. Makanan, 2. Ompreng, 3. Cuci Ompreng, 4. Pendukung).
7. Pada bagian bawah kotak, perhatikan teks **"Tahap: ..."** yang memandu progres secara langsung.
8. Ketuk tombol **Kamera** pada formulir POP SIPGN secara bertahap:
   - Foto #1 otomatis mengalir ke tampilan kamera. Klik ambil foto di POP SIPGN.
   - Sistem akan otomatis memajukan antrean ke Foto #2.
   - *Tips:* Jika tampilan kamera POP SIPGN pada HP Anda tidak menutup otomatis setelah jepret, cukup ketuk tombol hijau **"✓ Selesai"** pada kartu foto aktif di widget untuk langsung beralih ke foto berikutnya.

---

## METODE B: Menggunakan Kiwi Browser (Otomatis 100% Tanpa Panggil Bookmark)

Jika Anda ingin antrean multi-foto **selalu muncul otomatis** setiap kali membuka halaman POP SIPGN tanpa perlu mengetik bookmark:

1. Unduh **Kiwi Browser** dari Google Play Store (gratis).
2. Buka tautan ekstensi Tampermonkey di Kiwi Browser:  
   `https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk`
3. Klik **Add to Chrome**.
4. Buka menu Titik Tiga > Tampermonkey > Create a new script.
5. Tempelkan script dari [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js), lalu simpan (`Ctrl + S` atau ikon disket).
6. Buka `https://pop-sipgn.bgn.go.id/` di Kiwi Browser. Widget antrean multi-foto akan otomatis muncul setiap saat!
