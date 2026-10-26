# Laporan Proyek: Pengembangan MBG Local Photo Helper

**Nama Proyek:** MBG - Local Photo Helper (Aplikasi POP SIPGN)  
**Bidang:** Web Development, DOM Manipulation, Browser API, & Client-Side Automation  
**Platform Target:** Desktop (Google Chrome, Brave, Edge) & Mobile (Android, iOS)  
**Status:** Selesai & Teruji (Production Ready)  

---

## 1. Latar Belakang & Masalah

Pada operasional aplikasi web **Aplikasi Kurir / POP SIPGN** (`https://pop-sipgn.bgn.go.id/`), petugas lapangan diwajibkan mendokumentasikan kondisi makanan melalui fitur pengambilan foto (*Foto Mulai Tahapan*).

### Permasalahan Teknis:
1. **Ketiadaan Hardware Kamera:** Ketika aplikasi diakses dari laptop atau PC operasional tanpa webcam fisik, peramban memunculkan pesan kesalahan sistem WebRTC:
   ```text
   Requested device not found
   ```
2. **Keterbatasan Alur Input:** Tombol input kamera mengunci pengguna hanya pada kamera aktif (menggunakan atribut `capture="camera"` atau pemanggilan langsung `navigator.mediaDevices.getUserMedia`). Pengguna tidak diberikan opsi memilih foto yang telah diambil sebelumnya dari penyimpanan/galeri.
3. **Pembatasan Keamanan (CSP & Permissions):** Pada peramban modern berbasis Chromium dan Single Page Application (SPA), skrip intervensi biasa sering terblokir oleh kebijakan Content Security Policy (CSP) dan rendering siklus hidup framework web.

---

## 2. Tujuan Proyek

1. **Mengeliminasi Ketergantungan Kamera Fisik:** Mengizinkan pengunggahan foto makanan dari galeri smartphone maupun folder lokal laptop tanpa memicu error sistem.
2. **Menjaga Validasi & Integritas Data:** Memastikan foto lokal yang dialirkan tetap diproses oleh sistem aplikasi sehingga **stempel/label resmi POP SIPGN** (tanggal, jam, dan lokasi) tetap tertera secara otomatis.
3. **Fleksibilitas Lintas Perangkat:**
   - **Desktop/Laptop:** Berjalan otomatis di latar belakang melalui ekstensi Tampermonkey.
   - **Smartphone (HP):** Dapat dijalankan tanpa perlu instalasi aplikasi tambahan menggunakan teknik **Bookmarklet** di Google Chrome bawaan, atau berjalan otomatis di Kiwi Browser.
4. **Privasi & Keamanan:** Seluruh pemrosesan berjalan 100% lokal pada peramban klien tanpa transmisi berkas ke server pihak ketiga.

---

## 3. Arsitektur Teknis & Solusi Rekayasa

Proyek ini mengintegrasikan 3 mekanisme utama:

### A. Intervensi DOM (Atribut Capture)
Pada komponen web standar yang menggunakan `<input type="file" capture="camera">`, script secara dinamis menghapus atribut `capture` tersebut. Hal ini membuat peramban kembali ke perilaku alaminya, yaitu membuka dialog File Explorer / Galeri HP.

### B. WebRTC Canvas-to-MediaStream Mocking
Untuk bagian aplikasi yang memanggil API streaming WebRTC:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
```
Script mencegat (*override*) pemanggilan fungsi tersebut. Saat foto lokal dipilih oleh pengguna:
1. Gambar dimuat ke elemen `<canvas>` internal.
2. Canvas tersebut dikonversi menjadi `MediaStream` resmi menggunakan standard API:
   ```javascript
   const stream = canvas.captureStream(25);
   ```
3. `MediaStream` sintetis ini dialirkan ke elemen `<video>` aplikasi, sehingga sistem aplikasi mengenali foto lokal sebagai aliran video kamera aktif yang valid.

### C. SPA Resilience & CSP Bypass
- Menggunakan `@grant unsafeWindow` untuk mengeksekusi script dengan hak istimewa setara Developer Console (`F12`), menembus proteksi CSP.
- Dilengkapi mekanisme *polling interval* (1,5 detik) agar antarmuka widget tetap ada saat pengguna berpindah menu dalam aplikasi Single Page Application (Vue/React).

---

## 4. Hasil Pengujian & Verifikasi

Pengujian dilakukan secara langsung pada alur penugasan produksi aplikasi POP SIPGN:

| Skenario Pengujian | Perangkat / Browser | Hasil yang Diamati | Status |
| :--- | :--- | :--- | :---: |
| Akses form tanpa kamera fisik | Laptop (Brave Browser) | Error *"Requested device not found"* berhasil ditiadakan; foto lokal terunggah sukses. | **LULUS** |
| Otomasi ekstensi Tampermonkey | Laptop (Chrome & Edge) | Widget otomatis muncul di pojok kanan bawah; foto terinjeksi mulus. | **LULUS** |
| Akses via Google Chrome Android | Smartphone (Android) | Bookmarklet berhasil memicu pemilih berkas Galeri HP; foto terunggah sukses. | **LULUS** |
| Uji Pembubuhan Watermark/Label | Laptop & HP | Foto yang diunggah melalui bypass tetap memiliki stempel resmi POP SIPGN. | **LULUS** |

---

## 5. Kesimpulan & Rekomendasi

Proyek **MBG Local Photo Helper** berhasil menyelesaikan kendala teknis pengambilan foto pada aplikasi POP SIPGN secara tuntas, aman, dan efisien. Solusi ini memangkas hambatan operasional petugas di lapangan tanpa memerlukan modifikasi pada server aplikasi pusat.

**Rekomendasi Pemeliharaan:**
- Untuk penggunaan PC/Laptop, disarankan menggunakan skrip Tampermonkey v2.0.0 agar proses berjalan sepenuhnya otomatis.
- Untuk penggunaan mobile harian yang intensif, penggunaan **Kiwi Browser** disarankan untuk otomasi penuh, sementara **Bookmarklet** tetap menjadi alternatif terbaik jika menggunakan Chrome bawaan.
