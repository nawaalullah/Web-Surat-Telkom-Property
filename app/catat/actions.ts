'use server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

import { db, catat } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ekstensiSurat } from '@/lib/magic';
import { formatNomor } from '@/lib/nomor';
import { getPengaturan, kunciUrut, tahunSekarang } from '@/lib/pengaturan';

export type HasilCatat = { ok: boolean; pesan: string; id?: number; no_naskah?: string; agenda?: number };
const gagal = (pesan: string): HasilCatat => ({ ok: false, pesan });
const bersih = (v: FormDataEntryValue | null) => String(v ?? '').trim().replace(/\s+/g, ' ');

/** Catat surat baru: nomor naskah dan no agenda terbit dalam satu transaksi, status awal Reserved. */
export async function catatSurat(fd: FormData): Promise<HasilCatat> {
  const s = await getSession();
  if (!s) return gagal('Sesi berakhir. Silakan login ulang.');
  const set = getPengaturan(), tahun = tahunSekarang();

  const sifat = String(fd.get('sifat'));
  if (!['biasa', 'segera', 'rahasia'].includes(sifat)) return gagal('Pilih sifat surat.');
  const perihal = bersih(fd.get('perihal'));
  if (!perihal) return gagal('Perihal wajib diisi.');
  if (perihal.length > 200) return gagal('Perihal maksimal 200 karakter.');

  const dari = bersih(fd.get('dari'));
  if (!dari) return gagal('Dari wajib diisi.');
  if (dari.length > 120) return gagal('Dari maksimal 120 karakter.');
  const kepada = bersih(fd.get('kepada')), alamat = bersih(fd.get('alamat')), lampiran = bersih(fd.get('lampiran'));
  if (!kepada) return gagal('Kepada wajib diisi.');
  if (kepada.length > 120) return gagal('Kepada maksimal 120 karakter.');
  if (alamat.length > 300) return gagal('Alamat maksimal 300 karakter.');
  if (lampiran.length > 100) return gagal('Lampiran maksimal 100 karakter.');

  const tanggal = String(fd.get('tanggal') || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(Date.parse(tanggal))) return gagal('Tanggal surat tidak valid.');
  if (Number(tanggal.slice(0, 4)) !== tahun) return gagal(`Tanggal surat harus berada di tahun ${tahun}.`);

  // Draft opsional: periksa isi file sebenarnya, bukan hanya nama atau File.type.
  let draft: { buf: Buffer; ext: string; nama: string } | null = null;
  const f = fd.get('draft');
  if (f instanceof File && f.size > 0) {
    if (f.size > set.maks_mb * 1024 * 1024) return gagal(`Draft lebih dari ${set.maks_mb} MB.`);
    const buf = Buffer.from(await f.arrayBuffer()), ext = ekstensiSurat(f.name, buf);
    if (!ext) return gagal('Draft harus berupa file PDF atau DOCX yang valid.');
    if ((ext === 'pdf' && !set.tipe_pdf) || (ext === 'docx' && !set.tipe_docx)) return gagal(`File ${ext.toUpperCase()} tidak diizinkan di Pengaturan.`);
    draft = { buf, ext, nama: f.name.replace(/[^\w.\- ]+/g, '_').slice(-120) };
  }
  let draftFile: string | null = null;
  if (draft) {
    draftFile = `${crypto.randomBytes(12).toString('hex')}.${draft.ext}`;
    await fs.mkdir(path.join(process.cwd(), 'uploads', 'draft'), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), 'uploads', 'draft', draftFile), draft.buf);
  }

  try {
    const hasil = db.transaction(() => {
      const kunci = kunciUrut(set.reset_urutan, tahun);
      db.prepare('INSERT OR IGNORE INTO nomor_urut(tahun, terakhir, agenda) VALUES(?, 0, 0)').run(kunci);
      const u = db.prepare('SELECT terakhir, agenda FROM nomor_urut WHERE tahun = ?').get(kunci) as { terakhir: number; agenda: number };
      const noUrut = u.terakhir + 1, agenda = Math.max(u.agenda + 1, set.agenda_mulai);
      db.prepare('UPDATE nomor_urut SET terakhir = ?, agenda = ? WHERE tahun = ?').run(noUrut, agenda, kunci);
      const noNaskah = formatNomor(set.format_nomor, { no: noUrut, tahun });
      const r = db.prepare(`INSERT INTO surat(tahun, no_urut, agenda, no_naskah, sifat, perihal, dari, kepada, alamat, lampiran, tanggal, status, draft_file, draft_nama, dibuat_oleh)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reserved', ?, ?, ?)`)
        .run(tahun, noUrut, agenda, noNaskah, sifat, perihal, dari, kepada, alamat, lampiran, tanggal, draftFile, draft?.nama ?? null, s.uid);
      return { id: Number(r.lastInsertRowid), noNaskah, agenda };
    })();
    catat(s.uid, 'Nomor terbit', hasil.noNaskah, hasil.id);
    revalidatePath('/', 'layout');
    return { ok: true, pesan: 'Nomor naskah terbit.', id: hasil.id, no_naskah: hasil.noNaskah, agenda: hasil.agenda };
  } catch (e: any) {
    if (draftFile) await fs.unlink(path.join(process.cwd(), 'uploads', 'draft', draftFile)).catch(() => {});
    if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return gagal('Nomor naskah kembar. Periksa format nomor di Pengaturan (harus memuat [NO]).');
    throw e;
  }
}
