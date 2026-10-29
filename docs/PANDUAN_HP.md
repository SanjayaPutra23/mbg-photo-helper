# Panduan Penggunaan pada Smartphone (Android & iOS) — Multi-Foto & Multi-Sekolah

Aplikasi **MBG Photo Helper (Versi 2.2.1)** hadir dengan antarmuka dan fungsi terpadu yang **100% konsisten antara laptop/PC dan HP**. Foto yang sudah Anda pilih dari Galeri akan **tetap tersimpan (persisten)** dan dapat digunakan berulang kali untuk dokumentasi beberapa sekolah secara praktis.

Terdapat tiga metode instalasi di smartphone:
- **Metode 1 (Kiwi Browser + Tampermonkey — Paling Praktis & Bebas Kendala CSP):** Solusi paling direkomendasikan untuk HP Android. Berjalan otomatis di latar belakang tanpa terhalang CSP dan tanpa batasan panjang URL bookmark.
- **Metode 2 (Chrome Android via Sinkronisasi Bookmark Desktop):** Memasang kode mandiri [`scripts/bookmarklet-minified.url.txt`](../scripts/bookmarklet-minified.url.txt) (19.976 karakter) melalui Bookmark Manager Chrome Desktop yang otomatis tersinkron ke HP Anda tanpa risiko terpotong oleh clipboard HP.
- **Metode 3 (Bookmarklet Loader Pendek):** Menggunakan loader pendek [`scripts/bookmarklet-loader.url.txt`](../scripts/bookmarklet-loader.url.txt) (294 karakter) untuk browser yang mengizinkan pemuatan skrip eksternal.

---

## METODE 1: Menggunakan Kiwi Browser (Sangat Direkomendasikan di Android)

Halaman POP SIPGN menerapkan aturan **Content Security Policy (CSP)** yang ketat (`script-src 'self' 'unsafe-inline' ...`), sehingga pemuatan script eksternal lewat tag `<script src="...">` dari CDN diblokir oleh browser. Selain itu, dialog bookmark Chrome Android memotong teks panjang yang ditempel di kolom URL.

**Kiwi Browser + Tampermonkey** berjalan di level ekstensi browser (isolated world) sehingga **100% kebal terhadap CSP halaman**, tidak terikat batas karakter URL bookmark, dan otomatis aktif setiap kali Anda membuka formulir POP SIPGN:

1. Unduh **Kiwi Browser** dari Google Play Store (gratis, berbasis Chromium seperti Chrome).
2. Buka Kiwi Browser, lalu kunjungi Chrome Web Store untuk memasang Tampermonkey:
   `https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkminghmkfjojejmpbldmpobfk`
3. Klik **Tambahkan ke Chrome (Add to Chrome)**.
4. Buka menu Titik Tiga (kanan atas) > gulir ke bawah dan ketuk **Tampermonkey** > pilih **Dashboard** (atau *Buat skrip baru*).
5. Hapus kode default, lalu salin dan tempel seluruh isi berkas [`scripts/mbg-photo-helper.user.js`](../scripts/mbg-photo-helper.user.js).
6. Tekan tombol **File > Simpan** (atau ikon disket).
7. Buka `https://pop-sipgn.bgn.go.id/` di Kiwi Browser. Widget **MBG Photo Helper** akan langsung muncul otomatis di pojok kanan bawah layar!

---

## METODE 2: Menggunakan Bookmarklet Mandiri via Sinkronisasi Chrome Desktop

Jika Anda tetap ingin menggunakan Google Chrome di HP Android:

Karena kolom URL pada menu Edit Bookmark di Chrome Android membatasi/memotong panjang teks yang ditempel (clipboard truncation limit), Anda **tidak bisa menempelkan 19.976 karakter langsung di HP**. 

Namun, Anda dapat memasangnya dengan sangat mudah melalui **Google Sync**:

1. Di **Laptop/PC**, buka Google Chrome (pastikan login dengan akun Google yang sama dengan HP Anda).
2. Buka Pengelola Bookmark (`Ctrl + Shift + O`).
3. Klik menu titik tiga di kanan atas > **Tambah penanda baru (Add new bookmark)**.
4. Isi data berikut:
   - **Nama:** `MBG Helper`
   - **URL:** Salin seluruh kode dari [`scripts/bookmarklet-minified.url.txt`](../scripts/bookmarklet-minified.url.txt) (versi teroptimasi 19.976 karakter) lalu tempelkan. Chrome Desktop dapat menampung kode ini secara penuh tanpa terpotong.
5. Klik **Simpan**.
6. Buka **Chrome di HP Android** Anda:
   - Pastikan Sinkronisasi Bookmark aktif di Pengaturan Chrome HP.
   - Buka `https://pop-sipgn.bgn.go.id/`.
   - Ketuk kolom alamat URL atas, ketik **`MBG Helper`**, lalu ketuk hasil pencarian bertanda bintang (Bookmark).
   - Seluruh kode mandiri akan dieksekusi secara lokal tanpa bergantung pada CDN.

---

## METODE 3: Menggunakan Bookmarklet Loader Pendek

Jika browser Anda mengizinkan injeksi skrip eksternal atau tidak membatasi CSP:
1. Salin kode dari [`scripts/bookmarklet-loader.url.txt`](../scripts/bookmarklet-loader.url.txt) (294 karakter).
2. Simpan di Bookmark Chrome HP.
3. *Catatan:* Jika muncul peringatan *"Gagal memuat MBG Helper!"*, berarti CSP halaman POP SIPGN sedang memblokir domain CDN, dan Anda disarankan beralih ke **Metode 1 (Kiwi Browser)** atau **Metode 2 (Sinkronisasi Desktop)**.

---

## Cara Penggunaan Fitur di Layar HP:

1. **Memilih 4 Foto Kegiatan Sekaligus:**
   - Ketuk tombol **"+ Pilih / Tambah Foto"** > Buka Galeri > Pilih 4 foto kegiatan (Makanan, Ompreng, Cuci Ompreng, Pendukung).
   - Seluruh foto akan masuk ke daftar kartu dan tersimpan di penyimpanan lokal HP (IndexedDB).
2. **Dokumentasi Otomatis (Anti-Buka Kamera Langsung):**
   - Ketuk tombol dokumentasi foto di formulir POP SIPGN.
   - MBG Photo Helper secara otomatis menyalurkan foto aktif ke formulir tanpa membuka kamera HP atau galeri fisik.
   - Antrean foto akan otomatis maju ke slot berikutnya (**✓ Terkirim**).
3. **Mengganti Foto yang Salah (Fitur Ganti):**
   - Jika ingin mengganti foto tertentu (misalnya foto ompreng buram), ketuk tombol **"Ganti"** pada kartu foto tersebut.
   - Pilih 1 foto baru dari galeri. Foto tersebut akan langsung menggantikan posisi lama tanpa mereset foto lainnya.
4. **Beralih ke Sekolah Berikutnya (Foto Dipakai Berulang):**
   - Buka form sekolah berikutnya di POP SIPGN.
   - Ketuk tombol **"🔄 Sesi Baru"** pada widget.
   - Foto sumber Anda tetap tersimpan dan langsung siap digunakan kembali untuk sekolah tersebut tanpa perlu memilih ulang dari galeri.
5. **Kecilkan Tampilan (Minimize):**
   - Ketuk tanda minus (**−**) pada header widget untuk mengecilkannya menjadi pil mini di pojok layar. Ketuk **Buka** kapan saja untuk memperbesarnya kembali.
