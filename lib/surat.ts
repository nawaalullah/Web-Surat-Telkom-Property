import { db } from './db';
import { getPengaturan } from './pengaturan';

export type Surat = {
  id: number; tahun: number; no_urut: number; agenda: number; no_naskah: string; sifat: 'biasa' | 'segera' | 'rahasia';
  perihal: string; dari: string; kepada: string; alamat: string; lampiran: string; tanggal: string;
  status: 'reserved' | 'terarsip' | 'dibatalkan'; draft_file: string | null; draft_nama: string | null;
  file: string | null; file_nama: string | null; file_ukuran: number | null; catatan: string; alasan_batal: string;
  dibuat_oleh: number | null; dibuat_at: string; diarsipkan_at: string | null; dibatalkan_at: string | null;
};

export const STATUS: Record<Surat['status'], { teks: string; kelas: string }> = {
  reserved: { teks: 'Reserved', kelas: 'bg-warn-bg text-warn-fg' },
  terarsip: { teks: 'Terarsip', kelas: 'bg-ok-bg text-ok-fg' },
  dibatalkan: { teks: 'Dibatalkan', kelas: 'bg-inactive text-muted' },
};

export const getSurat = (id: number) =>
  db.prepare(`SELECT * FROM surat WHERE id = ?`).get(id) as Surat | undefined;

/** Jumlah surat Reserved (belum ada file). Tampil sebagai lencana di sidebar bila pengingat aktif. */
export function jumlahBelumDiunggah(): number {
  if (!getPengaturan().ingatkan) return 0;
  return (db.prepare("SELECT COUNT(*) n FROM surat WHERE status = 'reserved'").get() as { n: number }).n;
}

export const ukuranTeks = (b: number | null) => (b == null ? '' : b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
