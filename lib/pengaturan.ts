import { db } from './db';
import { BAWAAN, type Pengaturan } from './pengaturanDef';

export { BAWAAN, MAKS_MB_BATAS, tahunSekarang, type Pengaturan } from './pengaturanDef';

/** Baca semua pengaturan; nilai yang belum tersimpan memakai BAWAAN. */
export function getPengaturan(): Pengaturan {
  const baris = db.prepare('SELECT kunci, nilai FROM pengaturan').all() as { kunci: string; nilai: string }[];
  const m = new Map(baris.map((b) => [b.kunci, b.nilai]));
  const teks = (k: keyof Pengaturan) => m.get(k) ?? String(BAWAAN[k]);
  const angka = (k: keyof Pengaturan) => { const n = Number(teks(k)); return Number.isFinite(n) ? n : Number(BAWAAN[k]); };
  const bool = (k: keyof Pengaturan) => (m.has(k) ? m.get(k) === '1' : Boolean(BAWAAN[k]));
  return {
    format_nomor: teks('format_nomor'),
    reset_urutan: teks('reset_urutan') === 'tidak' ? 'tidak' : 'tahunan',
    agenda_mulai: angka('agenda_mulai'),
    tipe_pdf: bool('tipe_pdf'), tipe_docx: bool('tipe_docx'),
    maks_mb: angka('maks_mb'),
    wajib_unggah: bool('wajib_unggah'),
    ingatkan: bool('ingatkan'),
    ingatkan_hari: angka('ingatkan_hari'),
  };
}

export function simpanPengaturan(p: Pengaturan) {
  const st = db.prepare('INSERT INTO pengaturan(kunci, nilai) VALUES(?, ?) ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai');
  db.transaction(() => {
    for (const [k, v] of Object.entries(p)) st.run(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  })();
}

/** Kunci baris nomor_urut: per tahun bila direset tahunan, selain itu satu urutan global (kunci 0). */
export const kunciUrut = (reset: Pengaturan['reset_urutan'], tahun: number) => (reset === 'tahunan' ? tahun : 0);

/** Nomor naskah dan no agenda terakhir yang sudah terbit (0 bila belum ada). */
export function urutTerakhir(tahun: number, reset = getPengaturan().reset_urutan): { no: number; agenda: number } {
  const r = db.prepare('SELECT terakhir, agenda FROM nomor_urut WHERE tahun = ?').get(kunciUrut(reset, tahun)) as { terakhir: number; agenda: number } | undefined;
  return { no: r?.terakhir ?? 0, agenda: r?.agenda ?? 0 };
}
export const nomorTerakhir = (tahun: number) => urutTerakhir(tahun).no;

/**
 * Atur nomor naskah berikutnya (untuk melanjutkan buku agenda yang sudah berjalan, mis. mulai dari 135).
 * Hanya boleh menaikkan: urutan tidak bisa dimundurkan ke nomor yang sudah terbit (nomor surat yang dibatalkan dipakai kembali lewat lib/penomoran.ts). Mengembalikan pesan kesalahan atau null.
 */
export function setNomorBerikut(tahun: number, nomor: number, reset = getPengaturan().reset_urutan): string | null {
  const kunci = kunciUrut(reset, tahun);
  return db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO nomor_urut(tahun, terakhir, agenda) VALUES(?, 0, 0)').run(kunci);
    const u = db.prepare('SELECT terakhir FROM nomor_urut WHERE tahun = ?').get(kunci) as { terakhir: number };
    if (nomor < u.terakhir + 1) return `Nomor naskah berikutnya minimal ${u.terakhir + 1} karena nomor sebelumnya sudah terbit.`;
    db.prepare('UPDATE nomor_urut SET terakhir = ? WHERE tahun = ?').run(nomor - 1, kunci);
    return null;
  })();
}
