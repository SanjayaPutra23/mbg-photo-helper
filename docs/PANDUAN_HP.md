# Panduan Penggunaan pada Smartphone (Android & iOS) — Multi-Foto & Multi-Sekolah

Aplikasi **MBG Photo Helper (Versi 2.2.1)** hadir dengan antarmuka dan fungsi terpadu yang **100% konsisten antara laptop/PC dan HP**. Foto yang sudah Anda pilih dari Galeri akan **tetap tersimpan (persisten)** dan dapat digunakan berulang kali untuk dokumentasi beberapa sekolah secara praktis.

Terdapat dua metode untuk menggunakannya di smartphone:
- **Metode A (Google Chrome Mobile — Bookmarklet Loader Pendek):** Menggunakan pintasan Bookmark pendek (hanya 294 karakter) yang nyaman dipasang di Chrome Android tanpa terpotong.
- **Metode B (Kiwi Browser — Tampermonkey):** Otomatis 100% menggunakan ekstensi Tampermonkey seperti di laptop, bebas pembatasan CSP dan tanpa perlu memanggil bookmark.

---

## METODE A: Menggunakan Bookmarklet Loader di Chrome HP

Metode ini tidak membutuhkan install aplikasi baru. Cukup menyimpan pintasan Bookmark pendek di Google Chrome HP Anda.

### 1. Cara Memasang / Mengedit Pintasan Bookmark di Chrome HP:
1. Buka Google Chrome di HP Anda.
2. Buka web apa saja (contoh: `google.com`), lalu ketuk tombol **Titik Tiga > Bintang (Bookmark)**.
3. Buka menu **Titik Tiga > Bookmarks (Penanda)**.
4. Cari bookmark yang baru dibuat, ketuk tombol **Titik Tiga di sampingnya > Edit**.
5. Ubah data berikut:
   - **Name (Nama):** `Bypass Kamera`
   - **URL:** Salin seluruh isi dari berkas [`scripts/bookmarklet-loader.url.txt`](../scripts/bookmarklet-loader.url.txt) (panjangnya hanya **294 karakter**, dijamin pas dan tidak terpotong oleh Chrome Android).
6. Simpan atau ketuk tombol kembali.

> 💡 **Catatan Mengenai Hosting Script:**
> Loader pendek ini bekerja dengan mengunduh script mesin utama `scripts/bookmarklet.js` via HTTPS CDN. 
> Saat repositori GitHub disinkronkan, loader akan otomatis selalu memuat versi logika terbaru tanpa Anda perlu mengubah link bookmark lagi.
> *(Berkas [`scripts/bookmarklet-minified.url.txt`](../scripts/bookmarklet-minified.url.txt) tetap disimpan sebagai artefak build lengkap mandiri).*

### 2. Cara Menggunakan Multi-Foto & Multi-Sekolah di HP:
1. Buka formulir POP SIPGN di Chrome HP Anda (`https://pop-sipgn.bgn.go.id/`).
2. Ketuk kolom alamat URL atas, lalu ketik kata: **`Bypass Kamera`**.
3. Di daftar saran pencarian yang muncul, ketuk saran yang berikon **Bintang / Bookmark**.
4. Widget **MBG Photo Helper** akan langsung muncul di pojok kanan bawah layar HP dengan tampilan lengkap yang responsif.
5. Ketuk **"+ Pilih / Tambah Foto"** > Buka **Galeri / Media Picker** > Pilih 4 foto kegiatan sekaligus (Makanan, Ompreng, Cuci Ompreng, Pendukung).
6. Semua foto akan muncul sebagai thumbnail kartu di dalam koleksi sumber dengan status `📷 SIAP DI KAMERA` pada foto pertama.

### 3. Alur Dokumentasi Otomatis (Anti-Buka Kamera Langsung):
1. **Tekan Tombol Dokumentasi Foto di POP SIPGN:**
   - Baik POP SIPGN menggunakan tombol kamera langsung (WebRTC) maupun input berkas form (`<input type="file">`), MBG Photo Helper **secara otomatis mengalirkan/menginjeksi foto aktif** ke dalam formulir.
   - Kamera HP **tidak akan terbuka langsung**, dan galeri sistem tidak akan muncul berulang kali. Foto aktif dari MBG Helper langsung disalurkan ke formulir.
2. **Kemajuan Antrean Otomatis:**
   - Setelah foto pertama terisi, sistem otomatis menandai statusnya menjadi hijau (**✓ Terkirim**) dan memajukan antrean ke Foto #2 (Ompreng), lalu Foto #3 (Cuci Ompreng), hingga Foto #4 (Pendukung).
3. **Fitur "Ganti Foto" (Jika Ada Foto yang Salah):**
   - Jika ada foto yang buram atau salah pilih (misalnya foto ompreng ingin diganti), ketuk tombol **"Ganti"** pada kartu foto tersebut.
   - Pilih 1 foto pengganti dari galeri. Foto tersebut akan langsung menggantikan foto lama tanpa merusak kategori atau urutan slot lainnya.
4. **Beralih ke Sekolah Berikutnya (Foto Dipakai Berulang):**
   - Setelah selesai mengisi form sekolah pertama, buka form sekolah kedua di POP SIPGN.
   - Pada widget MBG Helper, ketuk tombol biru **"🔄 Sesi Baru"** (atau masukkan nama sekolah baru).
   - **Koleksi foto sumber Anda TETAP UTUH 100%!** Anda TIDAK PERLU membuka galeri dan memilih ulang foto.
   - Status pengiriman otomatis direset menjadi siap untuk sekolah kedua, dan Anda langsung dapat menekan tombol foto di form sekolah kedua.
5. **Kecilkan Tampilan (Minimize):**
   - Ketuk tanda minus (**−**) pada header widget untuk mengecilkannya menjadi pil mengapung jika menutupi form. Ketuk **Buka** kapan saja untuk memperbesarnya kembali.

---

## METODE B: Menggunakan Kiwi Browser (Otomatis 100% Bebas Kendala CSP)

Jika browser Chrome Android membatasi pemuatan skrip eksternal karena kebijakan *Content Security Policy* (CSP) pada halaman POP SIPGN, **Kiwi Browser + Tampermonkey** adalah solusi terbaik:

1. Unduh **Kiwi Browser** dari Google Play Store (gratis).
2. Buka tautan ekstensi Tampermonkey di Kiwi Browser:  
   `https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk`
3. Klik **Add to Chrome**.
4. Buka menu Titik Tiga > Tampermonkey > Create a new script.
5. Tempelkan seluruh isi dari [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js), lalu simpan (`Ctrl + S` atau ikon disket).
6. Buka `https://pop-sipgn.bgn.go.id/` di Kiwi Browser. Widget otomatis aktif tanpa perlu mengetik bookmark dan bebas dari batasan CSP.
