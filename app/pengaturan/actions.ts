'use server';
import { revalidatePath } from 'next/cache';

import { catat } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cekFormatNomor } from '@/lib/nomor';
import { MAKS_MB_BATAS, simpanPengaturan, setNomorBerikut, tahunSekarang, urutTerakhir, type Pengaturan } from '@/lib/pengaturan';

export type Hasil = { ok: boolean; pesan: string };

/** Bilangan bulat dalam rentang; null bila bukan angka bulat atau di luar rentang. */
function bulat(v: FormDataEntryValue | null, min: number, maks: number): number | null {
  const s = String(v ?? '').trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= maks ? n : null;
}

export async function simpanSemuaPengaturan(fd: FormData): Promise<Hasil> {
  const s = await getSession();
  if (!s) return { ok: false, pesan: 'Sesi berakhir. Silakan login ulang.' };

  const reset = fd.get('reset_urutan') === 'tidak' ? 'tidak' : 'tahunan';
  const format = String(fd.get('format_nomor') || '').trim();
  const errFormat = cekFormatNomor(format, reset === 'tahunan');
  if (errFormat) return { ok: false, pesan: errFormat };

  const agenda = bulat(fd.get('agenda_mulai'), 1, 999999);
  if (agenda === null) return { ok: false, pesan: 'No agenda mulai dari harus bilangan bulat 1 atau lebih.' };

  // Nomor naskah berikutnya: 'nomor_awal' = nilai yang tampil saat halaman dibuka; bila tidak diubah, abaikan (aman dari balapan dengan surat baru).
  const nomor = bulat(fd.get('nomor_mulai'), 1, 999999), nomorAwal = Number(fd.get('nomor_awal'));
  if (nomor === null) return { ok: false, pesan: 'Nomor naskah mulai dari harus bilangan bulat 1 atau lebih.' };

  const pdf = fd.get('tipe_pdf') === '1', docx = fd.get('tipe_docx') === '1';
  if (!pdf && !docx) return { ok: false, pesan: 'Pilih minimal satu jenis file (PDF atau DOCX).' };
  const mb = bulat(fd.get('maks_mb'), 1, MAKS_MB_BATAS);
  if (mb === null) return { ok: false, pesan: `Ukuran maksimal harus bilangan bulat 1 sampai ${MAKS_MB_BATAS} MB.` };

  const hari = bulat(fd.get('ingatkan_hari'), 1, 60);
  if (hari === null) return { ok: false, pesan: 'Pengingat dalam hari harus bilangan bulat 1 sampai 60.' };

  const p: Pengaturan = {
    format_nomor: format, reset_urutan: reset, agenda_mulai: agenda,
    tipe_pdf: pdf, tipe_docx: docx, maks_mb: mb, wajib_unggah: fd.get('wajib_unggah') === '1',
    ingatkan: fd.get('ingatkan') === '1', ingatkan_hari: hari,
  };
  const tahun = tahunSekarang();
  if (nomor !== nomorAwal) {
    const err = setNomorBerikut(tahun, nomor, reset);
    if (err) return { ok: false, pesan: err };
  }
  simpanPengaturan(p);
  catat(s.uid, 'Ubah pengaturan', `format ${format}` + (nomor !== nomorAwal ? `, nomor berikutnya ${nomor}` : ''));
  revalidatePath('/pengaturan');
  return { ok: true, pesan: 'Pengaturan berhasil disimpan.' };
}
