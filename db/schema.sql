-- Skema dasar. Tabel surat ditambahkan di Tahap 4.
CREATE TABLE IF NOT EXISTS meta(
  kunci TEXT PRIMARY KEY,
  nilai TEXT NOT NULL
);
INSERT OR IGNORE INTO meta(kunci, nilai) VALUES ('versi_skema', '4');
UPDATE meta SET nilai = '4' WHERE kunci = 'versi_skema' AND CAST(nilai AS INTEGER) < 4;

-- Satu pengguna. Kolom token_versi dinaikkan saat password diganti sehingga sesi lama batal.
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  aktif INTEGER NOT NULL DEFAULT 1,
  jabatan TEXT,
  foto TEXT,
  token_versi INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS log_aktivitas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  aksi TEXT NOT NULL,
  objek TEXT DEFAULT '',
  waktu TEXT DEFAULT CURRENT_TIMESTAMP
);

-- (Jenis surat, Unit, Penandatangan, dan Buku Alamat dihapus di Tahap 6. Saran isian "Dari" dan "Kepada" diambil dari surat yang sudah dicatat.)

-- Pengaturan aplikasi (kunci -> nilai teks). Nilai bawaan ada di lib/pengaturan.ts.
CREATE TABLE IF NOT EXISTS pengaturan(
  kunci TEXT PRIMARY KEY,
  nilai TEXT NOT NULL
);

-- Penomoran per tahun: nomor naskah terakhir dan no agenda terakhir yang sudah terbit (dipakai Tahap 4).
CREATE TABLE IF NOT EXISTS nomor_urut(
  tahun INTEGER PRIMARY KEY,
  terakhir INTEGER NOT NULL DEFAULT 0,
  agenda INTEGER NOT NULL DEFAULT 0
);

-- Tahap 4: surat keluar. Nomor yang dibatalkan tetap tersimpan (status 'dibatalkan') dan tidak dipakai ulang.
CREATE TABLE IF NOT EXISTS surat(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tahun INTEGER NOT NULL,
  no_urut INTEGER NOT NULL,
  agenda INTEGER NOT NULL,
  no_naskah TEXT NOT NULL UNIQUE,
  sifat TEXT NOT NULL DEFAULT 'biasa' CHECK (sifat IN ('biasa','segera','rahasia')),
  perihal TEXT NOT NULL,
  dari TEXT NOT NULL,
  kepada TEXT NOT NULL,
  alamat TEXT NOT NULL DEFAULT '',
  lampiran TEXT NOT NULL DEFAULT '',
  tanggal TEXT NOT NULL,                      -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','terarsip','dibatalkan')),
  draft_file TEXT, draft_nama TEXT,           -- draft opsional saat dicatat
  file TEXT, file_nama TEXT, file_ukuran INTEGER,  -- surat final (Tahap 5)
  catatan TEXT NOT NULL DEFAULT '',
  alasan_batal TEXT NOT NULL DEFAULT '',
  dibuat_oleh INTEGER REFERENCES users(id),
  dibuat_at TEXT DEFAULT CURRENT_TIMESTAMP,
  diarsipkan_at TEXT, dibatalkan_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_surat_tahun ON surat(tahun, no_urut);
CREATE INDEX IF NOT EXISTS idx_surat_status ON surat(status);
