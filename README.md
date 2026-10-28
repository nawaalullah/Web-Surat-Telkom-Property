# Arsip Surat Keluar - Telkom Property

Next.js 14 (App Router) + TypeScript + Tailwind 3 + SQLite (better-sqlite3). Stack sama dengan BA Ukur.

## Menjalankan

    npm install   # Tahap 6 menambah paket exceljs
    npm run dev          # http://localhost:3000
    npm run build && npm start

Buat akun satu-satunya (sekali saja), lalu isi `.env` dari `.env.example`:

    AKUN_PASSWORD='password-panjang-anda' npm run seed

Cek hidup: `GET /api/health` -> `{"ok":true,"skema":"1"}`

## Tahap

1. Fondasi (selesai): kerangka sidebar + topbar + tema, database SQLite, halaman kosong per menu
2. Login & profil (selesai: login, sesi cookie `session_surat`, pembatas percobaan, Profil Saya)
3. Master Data & Pengaturan (selesai: 4 tab master, penomoran, aturan unggah, pengingat)
4. Catat Surat Baru + penomoran otomatis (selesai: form, nomor naskah + no agenda atomik, draft opsional, autosave draft)
5. Arsip, Unggah, Detail (selesai: daftar + filter + cari + paginasi, unggah/ganti file, detail, edit data, batalkan nomor, lencana Belum Diunggah)
6. Laporan & Audit (selesai: filter periode/status, kartu ringkasan, log audit, surat per pengirim, ekspor Excel, PDF lewat dialog cetak; Pengaturan > Penomoran: "Nomor naskah mulai dari"; Master Data (Jenis Surat, Unit, Penandatangan, Buku Alamat) dihapus; Cadangan database dan tombol Batalkan di daftar arsip, format nomor kini [NO] dan [TAHUN] plus teks tetap)
7. Tema, Bantuan (Pusat Bantuan: panel kanan dengan tombol ? dan halaman /bantuan; isi di `lib/bantuan.ts`), penyelesaian (antrean PDF, backup harian)

## Catatan VPS (2 GB RAM)

- Build di laptop/CI, bukan di VPS.
- `SESSION_SECRET` harus berbeda dari BA Ukur; pakai subdomain terpisah.
- Folder `data/` dan `uploads/` ada di luar git dan perlu dibackup.

Catatan penomoran (v5):
- Jenis surat tetap UM, HK, PS, LG (`lib/jenis.ts`), dipakai lewat token `[KODE]` di Pengaturan > Penomoran (bawaan `[NO]/[KODE]/[TAHUN]`).
- Nomor surat dan no agenda yang dibatalkan dipakai kembali oleh surat berikutnya sebagai satu pasangan (yang terkecil dulu, lihat `lib/penomoran.ts`).
- Saat server pertama kali jalan, `lib/db.ts` membangun ulang tabel `surat` otomatis (UNIQUE no_naskah diganti indeks unik hanya untuk surat tidak dibatalkan). Cadangkan `data/app.db` sebelum update.
