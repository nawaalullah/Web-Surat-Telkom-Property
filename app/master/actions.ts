'use server';
import { revalidatePath } from 'next/cache';

import { db, catat } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MASTER, adalahTab, cekKolom } from '@/lib/master';

export type Hasil = { ok: boolean; pesan: string };
const SESI_HABIS: Hasil = { ok: false, pesan: 'Sesi berakhir. Silakan login ulang.' };

/** Tambah (tanpa id) atau ubah (dengan id) satu baris master data. */
export async function simpanMaster(tab: string, fd: FormData): Promise<Hasil> {
  const s = await getSession();
  if (!s) return SESI_HABIS;
  if (!adalahTab(tab)) return { ok: false, pesan: 'Data tidak dikenal.' };
  const m = MASTER[tab];

  const nilai: Record<string, string> = {};
  for (const c of m.kolom) {
    const [v, err] = cekKolom(c, fd.get(c.k));
    if (err) return { ok: false, pesan: err };
    nilai[c.k] = v;
  }
  const idMentah = String(fd.get('id') || '');
  const id = idMentah ? Number(idMentah) : null;
  if (idMentah && !Number.isInteger(id)) return { ok: false, pesan: 'Data tidak ditemukan.' };
  const aktif = fd.get('aktif') === '0' ? 0 : 1;
  const label = nilai.kode ? `${nilai.kode} - ${nilai.nama}` : nilai.nama;

  try {
    if (id === null) {
      const kol = [...m.kolom.map((c) => c.k), 'aktif'];
      db.prepare(`INSERT INTO ${m.tabel}(${kol.join(', ')}) VALUES(${kol.map(() => '?').join(', ')})`).run(...m.kolom.map((c) => nilai[c.k]), 1);
      catat(s.uid, `Tambah ${m.tunggal}`, label);
    } else {
      const r = db.prepare(`UPDATE ${m.tabel} SET ${m.kolom.map((c) => c.k + ' = ?').join(', ')}, aktif = ? WHERE id = ?`).run(...m.kolom.map((c) => nilai[c.k]), aktif, id);
      if (!r.changes) return { ok: false, pesan: 'Data tidak ditemukan.' };
      catat(s.uid, `Ubah ${m.tunggal}`, label);
    }
  } catch (e: any) {
    if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return { ok: false, pesan: `Kode "${nilai.kode}" sudah dipakai.` };
    throw e;
  }
  revalidatePath('/master');
  return { ok: true, pesan: id === null ? `Data ${m.tunggal} berhasil disimpan.` : `Data ${m.tunggal} berhasil diperbarui.` };
}

/** Hapus satu baris. Bila sudah dipakai surat (Tahap 4 menambah referensi), kembalikan saran untuk menonaktifkan. */
export async function hapusMaster(tab: string, id: number): Promise<Hasil> {
  const s = await getSession();
  if (!s) return SESI_HABIS;
  if (!adalahTab(tab) || !Number.isInteger(id)) return { ok: false, pesan: 'Data tidak dikenal.' };
  const m = MASTER[tab];
  const baris = db.prepare(`SELECT * FROM ${m.tabel} WHERE id = ?`).get(id) as any;
  if (!baris) return { ok: false, pesan: 'Data sudah tidak ada.' };
  try {
    db.prepare(`DELETE FROM ${m.tabel} WHERE id = ?`).run(id);
  } catch (e: any) {
    if (String(e?.code).startsWith('SQLITE_CONSTRAINT')) return { ok: false, pesan: 'Data ini sudah dipakai pada surat dan tidak bisa dihapus. Nonaktifkan lewat tombol ubah.' };
    throw e;
  }
  catat(s.uid, `Hapus ${m.tunggal}`, baris.kode ? `${baris.kode} - ${baris.nama}` : baris.nama);
  revalidatePath('/master');
  return { ok: true, pesan: `Data ${m.tunggal} berhasil dihapus.` };
}
