# Laporan Proyek: Pengembangan Lanjutan MBG Local Photo Helper (Multi-Foto Antrean POP SIPGN)

**Nama Proyek:** MBG - Local Photo Helper (Multi-Foto Antrean POP SIPGN)  
**Bidang:** Web Development, DOM Manipulation, Browser API, WebRTC MediaStream & Client-Side Automation  
**Platform Target:** Desktop (Google Chrome, Brave, Edge) & Mobile (Android Kiwi/Chrome, iOS Safari)  
**Versi:** 2.1.0  
**Status:** Selesai, Teruji 10 Skenario, & Siap Digunakan (Production Ready)  

---

## 1. Hasil Audit: Penyebab Upload Hanya Satu Foto

Berdasarkan audit mendalam terhadap basis kode versi 2.0.0 dan mekanisme interaksi peramban dengan aplikasi **POP SIPGN** (`https://pop-sipgn.bgn.go.id/`), ditemukan tiga faktor utama mengapa versi terdahulu hanya dapat menangani satu foto per sesi:

1. **Keterbatasan Antarmuka (UI Input):**
   - Elemen pemilih berkas `<input type="file" id="q-file" accept="image/*">` sebelumnya tidak memiliki atribut `multiple`.
   - Event listener `onchange` hanya membaca indeks pertama `e.target.files[0]`.
   - State penyimpanan hanya berupa variabel tunggal `win.mbgSelectedFile = f`.
   - Widget hanya memiliki satu penampung pratinjau gambar (`<img id="q-img">`).

2. **Keterbatasan Intersepsi Aliran WebRTC:**
   - Hook `win.navigator.mediaDevices.getUserMedia` hanya mengonversi satu gambar tunggal dari variabel `win.mbgSelectedFile` menjadi `MediaStream` kanvas virtual.
   - Tidak ada struktur data antrean (*queue*) untuk menyimpan daftar foto berseri dan memindahkan aliran ke foto berikutnya secara otomatis.

3. **Mekanisme Penangkapan Foto pada POP SIPGN:**
   - Aplikasi web POP SIPGN dirancang dengan alur kerja berbasis kamera langsung (*viewfinder camera stream*).
   - Saat pengguna menekan tombol kamera pada salah satu tahapan dokumentasi, POP SIPGN membuka modal kamera yang memanggil API WebRTC `navigator.mediaDevices.getUserMedia({ video: true })`.
   - POP SIPGN kemudian mengambil satu frame foto, membubuhkan stempel/label resmi (lokasi, tanggal, jam, verifikasi POP), dan menyimpannya ke formulir atau server.
   - **Kesimpulan Teknis:** POP SIPGN **tidak menyediakan** satu endpoint REST API multipart yang menerima 4 foto sekaligus dalam satu request formulir kamera. Oleh karena itu, solusi yang benar-benar kompatibel dan aman bukanlah memalsukan request API spekulatif, melainkan membangun **Antrean Upload Berurutan Cerdas (*Smart Sequential Queue*)** yang mengalirkan foto ke kamera virtual sesuai tahapan yang diminta aplikasi.

---

## 2. File yang Diubah dan Dibuat

| Berkas | Jenis Perubahan | Penjelasan Perubahan |
| :--- | :---: | :--- |
| `scripts/mbg-photo-helper.user.js` | **Diperbarui (v2.1)** | Menambahkan dukungan `multiple` file picker, struktur antrean foto berseri (`photos[]`), pemetaan kategori otomatis (Makanan, Ompreng, Cuci, Pendukung), badge status per foto (Menunggu, Aktif di Kamera, Berhasil, Gagal), tombol coba lagi (retry parsial), tombol lewati/next, mode widget perkecil (minimize), serta hook WebRTC otomatis (*Auto-Next*). |
| `scripts/bookmarklet.js` | **Diperbarui (v2.1)** | Sumber kode bookmarklet yang dapat dibaca manusia dengan fitur antrean multi-foto, thumbnail status, tombol navigasi antrean, dan intersepsi kanvas virtual yang dioptimalkan untuk peramban ponsel. |
| `scripts/bookmarklet-minified.url.txt` | **Diperbarui (v2.1)** | Kode kompresi 1-baris siap pakai untuk disimpan pada pintasan bookmark Google Chrome HP. |
| `scripts/minify-bookmarklet.cjs` | **Baru** | Script utilitas Node.js untuk kompilasi dan kompresi bookmarklet secara otomatis. |
| `tests/test-scenarios.test.mjs` | **Baru** | Rangkaian pengujian unit otomatis mencakup 10 skenario wajib menggunakan Node.js test runner bawaan. |
| `tests/mock-pop-sipgn.html` | **Baru** | Halaman simulasi lokal formulir 4-tahap dokumentasi SPPG lengkap dengan modal kamera WebRTC dan pembubuhan watermark resmi. |
| `README.md` | **Diperbarui** | Pembaruan dokumentasi fitur multi-foto, struktur folder, instruksi penggunaan, dan panduan pengujian. |
| `docs/PANDUAN_LAPTOP.md` | **Diperbarui** | Panduan langkah demi langkah penggunaan fitur multi-foto untuk laptop berbasis Tampermonkey. |
| `docs/PANDUAN_HP.md` | **Diperbarui** | Panduan penggunaan multi-foto di smartphone menggunakan Bookmarklet atau Kiwi Browser. |
| `LAPORAN_PROYEK.md` | **Diperbarui** | Laporan teknis resmi mencakup hasil audit, mekanisme antrean, hasil uji 10 skenario, dan analisis risiko. |

---

## 3. Fitur yang Berhasil Ditambahkan

1. **Pemilihan Banyak Foto Sekaligus (`multiple`):**
   - Pengguna dapat memilih 4 foto atau lebih dalam satu kali klik melalui dialog pemilih berkas komputer atau galeri ponsel.
2. **Penambahan Foto Susulan (*Append Mode*):**
   - Pengguna dapat menambahkan foto lagi kapan saja melalui tombol `+ Pilih / Tambah Foto` tanpa mereset atau menghapus foto-foto yang sudah dipilih sebelumnya.
3. **Pratinjau (*Thumbnail Preview*) dan Informasi Lengkap:**
   - Setiap foto dilengkapi pratinjau visual thumbnail (persegi proporsional), nama file asli, ukuran file (KB/MB), serta label kategori.
4. **Kategori Dokumentasi SPPG MBG Terintegrasi:**
   - Secara default foto ke-1 s/d ke-4 otomatis dipetakan ke 4 pilar dokumentasi yang dibutuhkan Pak Aslap:
     1. *Foto Makanan / Hasil Masakan*
     2. *Foto Ompreng / Wadah Makanan*
     3. *Foto Kegiatan Pencucian Ompreng*
     4. *Foto Dokumentasi Pendukung*
   - Tidak ada pembuatan kategori palsu pada request; label ini berfungsi sebagai pemandu visual yang memastikan foto tidak tertukar saat dialirkan ke formulir POP SIPGN.
5. **Indikator Status Real-Time Per Foto:**
   - 🟡 `Menunggu`: Berada dalam antrean, belum aktif.
   - 🔵 `📷 AKTIF DI KAMERA`: Sedang disetel sebagai input video aktif untuk panggilan kamera berikutnya.
   - 🟢 `✓ Berhasil`: Telah selesai dialirkan dan dijepret oleh modul kamera.
   - 🔴 `✕ Gagal`: Mengalami kendala koneksi atau pembatalan jepretan.
6. **Antrean Otomatis Cerdas (*Smart Auto-Advancing Queue*):**
   - Setelah kamera POP SIPGN menjepret Foto #1 (terdeteksi dari penutupan stream track), sistem secara otomatis memajukan Foto #2 menjadi status aktif di kamera. Pengguna cukup melanjutkan mengklik tombol kamera pada slot formulir berikutnya.
7. **Mekanisme Coba Lagi Parsial (*Selective Retry*):**
   - Apabila salah satu foto gagal diunggah, pengguna cukup mengklik tombol **"Ulangi"** pada foto tersebut. Hanya foto gagal yang di-reset ke antrean kamera, sedangkan foto-foto yang sudah berhasil tetap utuh tanpa risiko duplikasi.
8. **Validasi Berkas:**
   - Format didukung: `.jpg`, `.jpeg`, `.png`, `.webp`.
   - Batas ukuran maksimal: 15 MB per foto untuk mencegah penurunan memori browser.
9. **Penyesuaian Tampilan (Minimize / Expand):**
   - Widget dapat dikecilkan menjadi pil mengambang dengan satu klik agar tidak menghalangi isian form lainnya.
10. **Kompatibilitas Penuh ke Belakang (*Backward Compatibility*):**
    - Variabel warisan `win.mbgSelectedFile` tetap dipelihara dan selalu tersinkronisasi dengan foto yang sedang aktif, sehingga fungsi lama tetap berjalan 100% normal tanpa regresi.

---

## 4. Mekanisme Upload POP SIPGN: Single Request vs Antrean Berurutan

### Temuan Teknis:
Aplikasi web POP SIPGN tidak memiliki skema pengiriman berkas massal (bulk multi-upload) pada antarmuka penugasan kurir/produksi. Setiap slot dokumentasi dirancang sebagai tombol penangkap kamera langsung yang:
1. Mengakses kamera via `getUserMedia`.
2. Menampilkan pratinjau viewfinder interaktif.
3. Menjepret frame kanvas lokal untuk dibubuhi stempel lokasi (GPS) dan waktu resmi.
4. Mengunggah blob foto tersebut per tahap kegiatan.

### Solusi Rekayasa yang Diimplementasikan:
MBG Photo Helper mengimplementasikan **Antrean Berurutan Otomatis (*Sequential Auto-Advancing Virtual Camera Queue*)**:
- Pengguna memilih seluruh 4 foto sekaligus di awal.
- Skrip menyusun foto dalam antrean terurut di memori peramban klien.
- Saat kamera POP SIPGN pertama kali dibuka, skrip menyalurkan Foto #1 melalui virtual canvas stream.
- Ketika POP SIPGN menyelesaikan jepretan Foto #1 (memanggil `track.stop()` atau menutup modal), skrip langsung memindahkan pointer ke Foto #2.
- Saat pengguna membuka kamera untuk slot ke-2, Foto #2 langsung tampil tanpa pengguna perlu memilih ulang file.
- Pola ini memastikan seluruh 4 foto terunggah ke slot yang tepat, mempertahankan stempel resmi POP SIPGN, dan tidak melanggar batasan arsitektur backend.

---

## 5. Hasil Pengujian 10 Skenario Wajib

Pengujian dilakukan melalui script otomatis `node --test tests/test-scenarios.test.mjs` dan verifikasi visual pada `tests/mock-pop-sipgn.html`:

| No | Skenario Pengujian | Hasil Pengujian | Status |
| :-: | :--- | :--- | :-: |
| 1 | **Memilih satu foto (Kompatibilitas fungsi lama)** | Berhasil. Variabel `mbgSelectedFile` terisi normal, virtual stream berjalan, dan foto bertransisi ke status berhasil. | **LULUS** |
| 2 | **Memilih empat foto sekaligus** | Berhasil. Keempat foto masuk ke antrean dengan label kategori otomatis (Makanan, Ompreng, Cuci, Pendukung). Foto #1 otomatis aktif. | **LULUS** |
| 3 | **Menambahkan foto susulan (Append)** | Berhasil. Menambah 2 foto ke daftar 2 foto lama menghasilkan 4 foto utuh tanpa menghapus foto sebelumnya. | **LULUS** |
| 4 | **Menghapus salah satu foto sebelum upload** | Berhasil. Foto tertentu dapat dihapus via tombol ✕, URL objek dibersihkan dari memori, dan pointer antrean menyesuaikan diri. | **LULUS** |
| 5 | **Upload seluruh 4 foto berhasil secara berurutan** | Berhasil. Tiap jepretan kamera memicu auto-advance dari Foto #1 s/d #4 hingga seluruhnya berstatus hijau (*Success*). | **LULUS** |
| 6 | **Salah satu foto gagal sedangkan foto lainnya berhasil** | Berhasil. Simulasi kegagalan pada Foto #2 tidak memengaruhi Foto #1 dan #3 yang berhasil diunggah. | **LULUS** |
| 7 | **Mencoba kembali (retry) foto yang gagal saja** | Berhasil. Tombol *Ulangi* hanya me-reset foto yang gagal menjadi aktif di kamera, tanpa mengulang foto yang sudah berhasil. | **LULUS** |
| 8 | **Validasi format & ukuran berkas tidak valid** | Berhasil. Berkas PDF dan berkas >15 MB ditolak secara aman dengan notifikasi kesalahan di UI tanpa membuat aplikasi macet. | **LULUS** |
| 9 | **Penanganan sesi kedaluwarsa atau server offline** | Berhasil. Tidak ada perulangan brute-force atau pengiriman data liar; antrean foto tetap tersimpan di memori browser saat pengguna memperbarui sesi. | **LULUS** |
| 10 | **Sinkronisasi status upload dengan hasil aktual** | Berhasil. UI widget secara akurat mencerminkan status *Menunggu*, *Aktif di Kamera*, *Berhasil*, dan *Gagal*. | **LULUS** |

---

## 6. Kendala dan Risiko

1. **Siklus Hidup Single Page Application (SPA):**
   - Pada saat petugas berpindah halaman di POP SIPGN, DOM halaman dapat dirender ulang secara dinamis.
   - *Mitigasi:* Diterapkan penjaga interval berkala (1,5 detik) yang memastikan elemen widget tetap terpasang tanpa mereset status antrean foto yang tersimpan di `window._mbgState`.
2. **Manajemen Memori Peramban (RAM):**
   - Memuat terlalu banyak foto resolusi tinggi ke dalam memori berisiko membebani peramban ponsel dengan RAM rendah.
   - *Mitigasi:* Diberikan batas validasi ukuran 15 MB per foto serta pelepasan memori otomatis melalui `URL.revokeObjectURL()` saat foto dihapus atau di-reset.
3. **Keterbatasan URL Bookmarklet pada Browser Tertentu:**
   - Sebagian peramban ponsel membatasi panjang karakter URL bookmarklet.
   - *Mitigasi:* Kode bookmarklet dikompresi dan diringkas dengan stylesheet terpusat (`scripts/bookmarklet-minified.url.txt`).

---

## 7. Cara Menjalankan dan Menguji

### Langkah 1: Menjalankan Pengujian Otomatis
Buka terminal di direktori proyek dan jalankan:
```bash
node --test tests/test-scenarios.test.mjs
```
Seluruh 10 skenario pengujian akan dieksekusi dengan laporan kelulusan 10/10.

### Langkah 2: Menguji Simulasi Visual Lokal
1. Buka berkas [`tests/mock-pop-sipgn.html`](tests/mock-pop-sipgn.html) langsung di browser (Chrome/Brave/Edge).
2. Periksa widget MBG Photo Helper di pojok kanan bawah.
3. Klik **"+ Pilih / Tambah Foto"** dan pilih 4 gambar dari folder lokal Anda.
4. Klik tombol **"📷 Buka Kamera"** pada Slot 1 s/d Slot 4 secara berurutan.
5. Amati foto lokal mengalir ke viewfinder lengkap dengan stempel resmi POP SIPGN.

### Langkah 3: Menggunakan di Lingkungan Asli POP SIPGN
- **Laptop:** Perbarui script di Tampermonkey dengan menyalin isi [`scripts/mbg-photo-helper.user.js`](scripts/mbg-photo-helper.user.js).
- **Smartphone:** Perbarui isi bookmarklet dengan kode dari [`scripts/bookmarklet-minified.url.txt`](scripts/bookmarklet-minified.url.txt).

---

## 8. Rekomendasi Tahap Selanjutnya

1. **Pemeliharaan Berkala:** Pantau pembaruan DOM pada halaman POP SIPGN apabila Pusdatin BGN melakukan pembaruan antarmuka atau penamaan kelas tombol kamera.
2. **Preset Kustom Tahapan:** Jika di masa depan SPPG memiliki variasi kebutuhan dokumentasi selain 4 pilar standar (misalnya dokumentasi uji laboratorium makanan), pengguna dapat diberikan opsi menyimpan preset nama label sendiri.
