import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { FORMAT_BAWAAN } from './nomor';

const g = globalThis as any;

function open() {
  const dir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });

  const d = new Database(path.join(dir, 'app.db'));
  d.pragma('journal_mode = WAL');
  d.pragma('foreign_keys = ON');

  // Buat tabel yang belum ada. Perubahan kolom di tahap berikutnya memakai ALTER TABLE di sini.
  d.exec(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
  // Tahap 5: log_aktivitas mengacu ke surat (untuk riwayat di halaman detail dan Laporan & Audit).
  if (!(d.prepare('PRAGMA table_info(log_aktivitas)').all() as { name: string }[]).some((c) => c.name === 'surat_id')) {
    d.exec('ALTER TABLE log_aktivitas ADD COLUMN surat_id INTEGER');
  }
  d.exec('CREATE INDEX IF NOT EXISTS idx_log_surat ON log_aktivitas(surat_id)');
  hapusJenisUnit(d);
  sesuaikanSurat(d);
  return d;
}

/**
 * Tahap 6: jenis surat, unit, penandatangan, dan buku alamat dihapus (Master Data ditiadakan). Database lama punya kolom surat.jenis_id/unit_id (NOT NULL), jadi tabel surat dibangun ulang
 * tanpa kolom itu (nomor, agenda, dan isi surat tetap). Format nomor yang memuat [KODE]/[UNIT] dikembalikan ke bawaan
 * (hanya sekali, saat migrasi dari skema lama; format [KODE] yang dipilih sekarang tidak disentuh).
 */
function hapusJenisUnit(d: Database.Database) {
  const kolom = (d.prepare('PRAGMA table_info(surat)').all() as { name: string }[]).map((c) => c.name);
  if (kolom.includes('jenis_id') || kolom.includes('unit_id')) {
    const salin = 'id, tahun, no_urut, agenda, no_naskah, sifat, perihal, dari, kepada, alamat, lampiran, tanggal, status, draft_file, draft_nama, file, file_nama, file_ukuran, catatan, alasan_batal, dibuat_oleh, dibuat_at, diarsipkan_at, dibatalkan_at';
    d.pragma('foreign_keys = OFF');
    try {
      d.transaction(() => {
        d.exec('DROP INDEX IF EXISTS idx_surat_tahun; DROP INDEX IF EXISTS idx_surat_status; ALTER TABLE surat RENAME TO surat_lama;');
        d.exec(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
        d.exec(`INSERT INTO surat(${salin}) SELECT ${salin} FROM surat_lama; DROP TABLE surat_lama;`);
      })();
    } finally { d.pragma('foreign_keys = ON'); }
    const f = d.prepare("SELECT nilai FROM pengaturan WHERE kunci = 'format_nomor'").get() as { nilai: string } | undefined;
    if (f && /\[(KODE|UNIT)\]/.test(f.nilai)) d.prepare("UPDATE pengaturan SET nilai = ? WHERE kunci = 'format_nomor'").run(FORMAT_BAWAAN);
  }
  d.exec('DROP TABLE IF EXISTS jenis_surat; DROP TABLE IF EXISTS unit; DROP TABLE IF EXISTS penandatangan; DROP TABLE IF EXISTS buku_alamat;');
}

/**
 * Penomoran v5: (1) kolom jenis dan dipakai_ulang_oleh; (2) no_naskah tidak lagi UNIQUE di seluruh tabel (database lama punya batasan itu di definisi kolom,
 * yang tidak bisa dicabut dengan ALTER), sehingga tabel dibangun ulang sekali dengan batasan unik hanya untuk surat yang tidak dibatalkan.
 * (3) Format lama bawaan '[NO]/[TAHUN]' diganti bawaan baru agar kode jenis tampil di nomor; format buatan sendiri tidak diubah.
 */
function sesuaikanSurat(d: Database.Database) {
  const nama = () => (d.prepare('PRAGMA table_info(surat)').all() as { name: string }[]).map((c) => c.name);
  if (!nama().includes('jenis')) d.exec('ALTER TABLE surat ADD COLUMN jenis TEXT');
  if (!nama().includes('dipakai_ulang_oleh')) d.exec('ALTER TABLE surat ADD COLUMN dipakai_ulang_oleh INTEGER');
  const def = (d.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'surat'").get() as { sql: string }).sql;
  if (/no_naskah\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(def)) {
    const lama = nama();
    d.pragma('foreign_keys = OFF');
    try {
      d.transaction(() => {
        d.exec('DROP INDEX IF EXISTS idx_surat_tahun; DROP INDEX IF EXISTS idx_surat_status; DROP INDEX IF EXISTS ux_surat_naskah_aktif; ALTER TABLE surat RENAME TO surat_lama;');
        d.exec(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
        const kol = nama().filter((c) => lama.includes(c)).join(', ');
        d.exec(`INSERT INTO surat(${kol}) SELECT ${kol} FROM surat_lama; DROP TABLE surat_lama;`);
      })();
    } finally { d.pragma('foreign_keys = ON'); }
  }
  d.prepare("UPDATE pengaturan SET nilai = ? WHERE kunci = 'format_nomor' AND nilai = '[NO]/[TAHUN]'").run(FORMAT_BAWAAN);
}

export const db: Database.Database = g.__arsipDb ?? (g.__arsipDb = open());

/** Catat aktivitas pengguna ke log_aktivitas (dipakai halaman Laporan & Audit di Tahap 6). */
export function catat(uid: number | null, aksi: string, objek = '', suratId: number | null = null) {
  db.prepare('INSERT INTO log_aktivitas(user_id, aksi, objek, surat_id) VALUES(?, ?, ?, ?)').run(uid, aksi, objek, suratId);
}
