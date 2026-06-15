# IPTV Dashboard Pro

Dasbor streaming IPTV modern dengan performa tinggi yang dibangun menggunakan **Next.js 16**, **Tailwind CSS v4**, dan **HLS.js**. Aplikasi ini memberikan pengalaman lancar untuk menjelajah dan menonton saluran TV langsung dari dataset IPTV-org yang terkurasi.

## Fitur Utama

- **Live Streaming:** Pemutar video HLS terintegrasi untuk pemutaran yang mulus.
- **Dynamic Fetching:** Mengambil dan memproses ribuan saluran secara efisien dengan *parallel API calls* dan filter lokal yang optimal.
- **Smart Filtering:** Pencarian instan, filter berdasarkan kategori, dan preset cepat (Indonesia, Sports, Kids).
- **Responsive UI:** Antarmuka dasbor yang modern, bersih, dan elegan dengan tema warna *slate-indigo*.
- **Optimized Performance:** Menangani dataset besar dengan melewati batasan *fetch cache* bawaan Next.js.
- **Client-Side Interactivity:** Manajemen status yang halus untuk perpindahan saluran dan pemilihan sumber data.

## Teknologi yang Digunakan

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Video Engine:** HLS.js
- **Data Source:** IPTV-org API

## Struktur Folder

- src/app/: Halaman inti aplikasi, layout, dan style global.
- src/lib/: Fungsi utilitas backend untuk mengambil dan memparsing data IPTV.
- src/app/components/: Komponen UI yang dapat digunakan kembali (Dashboard, VideoPlayer).

## Kustomisasi

- Kamu bisa menambahkan sumber daftar putar (playlist) baru dengan memperbarui konstanta PLAYLIST_PRESETS di dalam berkas src/app/components/Dashboard.tsx.

## Lisensi

Proyek ini bersifat open-source dan tersedia untuk tujuan edukasi.

---

Setelah kamu simpan, jangan lupa *push* lagi ke GitHub-mu dengan perintah:
```bash
git add README.md
git commit -m "Update README ke bahasa Indonesia"
git push origin main