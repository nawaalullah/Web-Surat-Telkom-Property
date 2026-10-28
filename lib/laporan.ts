import { db } from './db';
import { tahunSekarang } from './pengaturan';

export type FilterLaporan = { tahun: number; status: '' | 'reserved' | 'terarsip' | 'dibatalkan' };
export type Param = Record<string, string | string[] | undefined>;

/** Baca filter dari URL; nilai yang tidak dikenal jatuh ke bawaan (tahun ini, semua unit/status/jenis). */
export function bacaFilter(sp: Param): FilterLaporan {
  const satu = (k: string) => String(Array.isArray(sp[k]) ? sp[k]![0] : sp[k] ?? '');
  const tahunAda = (db.prepare('SELECT DISTINCT tahun FROM surat').all() as { tahun: number }[]).map((x) => x.tahun);
  const t = Number(satu('tahun'));
  const status = satu('status');
  return {
    tahun: t === tahunSekarang() || tahunAda.includes(t) ? t : tahunSekarang(),
    status: status === 'reserved' || status === 'terarsip' || status === 'dibatalkan' ? status : '',
  };
}

export const queryString = (f: FilterLaporan, extra: Record<string, string> = {}) =>
  new URLSearchParams({ tahun: String(f.tahun), ...(f.status ? { status: f.status } : {}), ...extra }).toString();

/** Kondisi WHERE atas tabel surat (alias s). dukStatus=false dipakai kartu ringkasan agar rincian status tetap terlihat. */
function kondisi(f: FilterLaporan, denganStatus = true) {
  const k = ['s.tahun = ?'], a: (string | number)[] = [f.tahun];
  if (denganStatus && f.status) { k.push('s.status = ?'); a.push(f.status); }
  return { where: k.join(' AND '), arg: a };
}

export function ringkasan(f: FilterLaporan) {
  const { where, arg } = kondisi(f, false);
  const r = db.prepare(`SELECT
      COALESCE(SUM(s.status = 'reserved'), 0) reserved,
      COALESCE(SUM(s.status = 'terarsip'), 0) terarsip,
      COALESCE(SUM(s.status = 'dibatalkan'), 0) dibatalkan,
      COALESCE(SUM(s.status != 'dibatalkan' AND s.file IS NULL), 0) belum
    FROM surat s WHERE ${where}`).get(...arg) as { reserved: number; terarsip: number; dibatalkan: number; belum: number };
  return r;
}

/** Jumlah surat per pengirim (kolom Dari), terbanyak dulu. */
export function suratPerPengirim(f: FilterLaporan) {
  const { where, arg } = kondisi(f);
  return db.prepare(`SELECT s.dari nama, COUNT(*) n FROM surat s WHERE ${where} GROUP BY s.dari COLLATE NOCASE ORDER BY n DESC, s.dari COLLATE NOCASE LIMIT 8`).all(...arg) as { nama: string; n: number }[];
}

export type BarisLog = { id: number; aksi: string; waktu: string; surat_id: number; no_naskah: string; perihal: string };

/** Log aktivitas yang terkait surat (bukan login atau ubah pengaturan), terbaru lebih dulu. */
export function logAudit(f: FilterLaporan, batas: number, offset = 0) {
  const { where, arg } = kondisi(f);
  const dasar = `FROM log_aktivitas l JOIN surat s ON s.id = l.surat_id WHERE ${where}`;
  const total = (db.prepare(`SELECT COUNT(*) n ${dasar}`).get(...arg) as { n: number }).n;
  const baris = db.prepare(`SELECT l.id, l.aksi, l.waktu, s.id surat_id, s.no_naskah, s.perihal ${dasar} ORDER BY l.waktu DESC, l.id DESC LIMIT ? OFFSET ?`).all(...arg, batas, offset) as BarisLog[];
  return { total, baris };
}

export type BarisRekap = {
  no_urut: number; tanggal: string; agenda: number; no_naskah: string; jenis: string | null; sifat: string; dari: string; kepada: string;
  alamat: string; perihal: string; lampiran: string; status: string; file_nama: string | null; diarsipkan_at: string | null;
};
export function rekapSurat(f: FilterLaporan) {
  const { where, arg } = kondisi(f);
  return db.prepare(`SELECT s.no_urut, s.tanggal, s.agenda, s.no_naskah, s.jenis, s.sifat, s.dari, s.kepada, s.alamat, s.perihal, s.lampiran, s.status, s.file_nama, s.diarsipkan_at
    FROM surat s WHERE ${where} ORDER BY s.no_urut`).all(...arg) as BarisRekap[];
}

export const AKSI_KELAS: Record<string, string> = {
  'Terarsip': 'bg-ok-bg text-ok-fg', 'File diunggah': 'bg-ok-bg text-ok-fg', 'File diganti': 'bg-info-bg text-info-fg',
  'Nomor terbit': 'bg-warn-bg text-warn-fg', 'Dibatalkan': 'bg-inactive text-muted', 'Data diedit': 'bg-inactive text-muted',
};
