# Absensi SD YPU 2026

Project ini mengubah absensi HTML lama menjadi web dinamis yang menyimpan data ke Cloudflare D1.

## Fitur
- Dropdown kelas 1A sampai 6B
- Data siswa per kelas tersimpan di database
- Absensi per tanggal bisa disimpan dan diedit
- Kelola roster siswa per kelas
- Salin roster dari satu kelas ke kelas lain
- Export CSV untuk kelas dan tanggal aktif

## Struktur proyek
- `index.html` — frontend
- `functions/api.js` — API Cloudflare Pages Functions
- `migrations/0001_init.sql` — tabel dan data awal
- `wrangler.toml` — konfigurasi lokal dan binding D1

## Cara pakai di Cloudflare Pages
1. Upload project ini ke GitHub.
2. Di Cloudflare Dashboard, buat Pages project dari GitHub repository.
3. Pastikan root project berisi `index.html` dan folder `functions/`.
4. Buat database D1, lalu jalankan migration `migrations/0001_init.sql`.
5. Tambahkan binding D1 dengan nama `DB` di Settings > Bindings pada Pages project.
6. Push perubahan ke GitHub, lalu Cloudflare akan deploy otomatis.

Cloudflare Pages mendukung Git integration untuk deploy otomatis saat push ke repo, dan Pages Functions bisa dipakai untuk fungsi server-side tanpa server khusus. D1 juga dapat dibind ke Pages Functions melalui binding.

## Catatan
- Kelas 1A sudah diisi dengan data contoh dari file HTML yang Anda upload.
- Kelas lain kosong dulu, lalu bisa diisi dari menu **Kelola Siswa**.
- Jika ingin, roster kelas 1A bisa disalin ke kelas lain lalu diedit namanya.

## Jalankan lokal
Gunakan Wrangler untuk preview lokal dan deploy.