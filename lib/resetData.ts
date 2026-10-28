import fs from 'fs/promises';
import path from 'path';
import { db } from './db';

/** Tabel yang tidak pernah dikosongkan: akun login dan versi skema. */
const DIPERTAHANKAN = ['users', 'meta', 'migrations', 'schema_migrations'];

/** Reset bisa dikunci di server produksi dengan RESET_DATA=off di .env. */
export const resetDiizinkan = () => (process.env.RESET_DATA || '').toLowerCase() !== 'off';

export type HasilReset = { cadangan: string; tabel: number; baris: number };

/**
 * Kembalikan data ke keadaan aplikasi baru: surat, penomoran, log audit, dan file di uploads/ dikosongkan. Akun (users) tidak berubah.
 * Sebelumnya database disalin dan folder uploads/ DIPINDAHKAN ke data/cadangan/reset-<waktu>/ supaya masih bisa dipulihkan.
 * simpanPengaturan=true mempertahankan tabel pengaturan (format nomor, batas file, pengingat).
 */
export async function resetData(simpanPengaturan: boolean): Promise<HasilReset> {
  const dikecualikan = new Set([...DIPERTAHANKAN, ...(simpanPengaturan ? ['pengaturan'] : [])]);
  const tabel = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[])
    .map((r) => r.name).filter((n) => !dikecualikan.has(n.toLowerCase()));
  const q = (n: string) => '"' + n.replace(/"/g, '""') + '"';

  const stempel = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'data', 'cadangan', `reset-${stempel}`);
  await fs.mkdir(dir, { recursive: true });
  await db.backup(path.join(dir, 'app.db'));

  let baris = 0;
  db.pragma('foreign_keys = OFF');
  try {
    db.transaction(() => {
      for (const n of tabel) baris += db.prepare(`DELETE FROM ${q(n)}`).run().changes;
      const hapusSeq = db.prepare('DELETE FROM sqlite_sequence WHERE name = ?');
      for (const n of tabel) hapusSeq.run(n); // penghitung ID tabel lain (mis. users) tidak disentuh
    })();
  } finally { db.pragma('foreign_keys = ON'); }

  // File surat dipindahkan (bukan dihapus). Bila gagal dipindahkan, folder dibiarkan: data sudah bersih dan file yatim tidak berbahaya.
  const uploads = path.join(process.cwd(), 'uploads');
  await fs.rename(uploads, path.join(dir, 'uploads')).catch(() => {});
  return { cadangan: path.relative(process.cwd(), dir), tabel: tabel.length, baris };
}
