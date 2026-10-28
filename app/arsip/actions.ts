'use server';
import { revalidatePath } from 'next/cache';

import { db, catat } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getSurat } from '@/lib/surat';

export type Hasil = { ok: boolean; pesan: string };
const bersih = (v: FormDataEntryValue | null) => String(v ?? '').trim().replace(/\s+/g, ' ');

/** Ubah data surat yang tidak memengaruhi nomor (nomor naskah dan no agenda tidak bisa diubah). */
export async function ubahSurat(id: number, fd: FormData): Promise<Hasil> {
  const ses = await getSession();
  if (!ses) return { ok: false, pesan: 'Sesi berakhir. Silakan login ulang.' };
  const s = getSurat(id);
  if (!s) return { ok: false, pesan: 'Surat tidak ditemukan.' };
  if (s.status === 'dibatalkan') return { ok: false, pesan: 'Nomor yang dibatalkan tidak bisa diedit.' };

  const sifat = String(fd.get('sifat')), perihal = bersih(fd.get('perihal')), kepada = bersih(fd.get('kepada')), dari = bersih(fd.get('dari'));
  const alamat = bersih(fd.get('alamat')), lampiran = bersih(fd.get('lampiran')), tanggal = String(fd.get('tanggal') || '');
  if (!['biasa', 'segera', 'rahasia'].includes(sifat)) return { ok: false, pesan: 'Pilih sifat surat.' };
  if (!perihal) return { ok: false, pesan: 'Perihal wajib diisi.' };
  if (perihal.length > 200) return { ok: false, pesan: 'Perihal maksimal 200 karakter.' };
  if (!dari) return { ok: false, pesan: 'Dari wajib diisi.' };
  if (dari.length > 120) return { ok: false, pesan: 'Dari maksimal 120 karakter.' };
  if (!kepada) return { ok: false, pesan: 'Kepada wajib diisi.' };
  if (kepada.length > 120) return { ok: false, pesan: 'Kepada maksimal 120 karakter.' };
  if (alamat.length > 300) return { ok: false, pesan: 'Alamat maksimal 300 karakter.' };
  if (lampiran.length > 100) return { ok: false, pesan: 'Lampiran maksimal 100 karakter.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(Date.parse(tanggal))) return { ok: false, pesan: 'Tanggal surat tidak valid.' };
  if (Number(tanggal.slice(0, 4)) !== s.tahun) return { ok: false, pesan: `Tanggal surat harus berada di tahun ${s.tahun}, sesuai nomor naskah.` };

  db.prepare('UPDATE surat SET sifat = ?, perihal = ?, dari = ?, kepada = ?, alamat = ?, lampiran = ?, tanggal = ? WHERE id = ?').run(sifat, perihal, dari, kepada, alamat, lampiran, tanggal, id);
  catat(ses.uid, 'Data diedit', s.no_naskah, id);
  revalidatePath('/', 'layout');
  return { ok: true, pesan: 'Data surat berhasil diperbarui.' };
}

/** Batalkan nomor. Nomor dicoret di arsip dan tidak dipakai ulang; file yang sudah diunggah tetap tersimpan. */
export async function batalkanSurat(id: number, alasan: string): Promise<Hasil> {
  const ses = await getSession();
  if (!ses) return { ok: false, pesan: 'Sesi berakhir. Silakan login ulang.' };
  const a = String(alasan || '').trim().replace(/\s+/g, ' ');
  if (a.length < 3) return { ok: false, pesan: 'Alasan pembatalan wajib diisi.' };
  if (a.length > 200) return { ok: false, pesan: 'Alasan maksimal 200 karakter.' };
  const s = getSurat(id);
  if (!s) return { ok: false, pesan: 'Surat tidak ditemukan.' };
  if (s.status === 'dibatalkan') return { ok: false, pesan: 'Nomor ini sudah dibatalkan.' };
  db.prepare("UPDATE surat SET status = 'dibatalkan', alasan_batal = ?, dibatalkan_at = CURRENT_TIMESTAMP WHERE id = ?").run(a, id);
  catat(ses.uid, 'Dibatalkan', `${s.no_naskah} - ${a}`, id);
  revalidatePath('/', 'layout');
  return { ok: true, pesan: 'Nomor berhasil dibatalkan.' };
}
