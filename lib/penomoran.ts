import { db } from './db';
import { getPengaturan, kunciUrut, type Pengaturan } from './pengaturan';

export type NomorBerikut = { no: number; agenda: number; ulangDariId: number | null };

/**
 * Nomor naskah dan no agenda yang akan diterbitkan berikutnya. Bila ada surat yang dibatalkan, keduanya diambil dari surat batal itu
 * (yang nomornya terkecil) sebagai satu pasangan; baru setelah semuanya terpakai, urutan dilanjutkan dari nomor terakhir.
 */
export function nomorBerikut(tahun: number, set: Pengaturan = getPengaturan()): NomorBerikut {
  const u = (db.prepare('SELECT terakhir, agenda FROM nomor_urut WHERE tahun = ?').get(kunciUrut(set.reset_urutan, tahun)) as { terakhir: number; agenda: number } | undefined) ?? { terakhir: 0, agenda: 0 };
  const tahunan = set.reset_urutan === 'tahunan';
  const bebas = db.prepare(`SELECT id, no_urut, agenda FROM surat WHERE status = 'dibatalkan' AND dipakai_ulang_oleh IS NULL ${tahunan ? 'AND tahun = ?' : ''} ORDER BY no_urut, id LIMIT 1`)
    .get(...(tahunan ? [tahun] : [])) as { id: number; no_urut: number; agenda: number } | undefined;
  return { no: bebas ? bebas.no_urut : u.terakhir + 1, agenda: bebas ? bebas.agenda : Math.max(u.agenda + 1, set.agenda_mulai), ulangDariId: bebas?.id ?? null };
}
