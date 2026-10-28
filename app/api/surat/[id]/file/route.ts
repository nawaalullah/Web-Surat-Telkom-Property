import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

import { db, catat } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ekstensiSurat } from '@/lib/magic';
import { getPengaturan } from '@/lib/pengaturan';
import { getSurat } from '@/lib/surat';

export const runtime = 'nodejs';
const UP = path.join(process.cwd(), 'uploads');
const NAMA_OK = /^[a-f0-9]{24}\.(pdf|docx)$/;
const TIPE = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } as const;

/** Unduh atau pratinjau file surat. ?jenis=draft untuk draft; ?unduh=1 memaksa unduhan. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return new Response('Belum login', { status: 401 });
  const s = getSurat(Number(params.id));
  const q = new URL(req.url).searchParams, draft = q.get('jenis') === 'draft';
  const nama = draft ? s?.draft_file : s?.file, asli = (draft ? s?.draft_nama : s?.file_nama) || 'surat';
  if (!s || !nama || !NAMA_OK.test(nama)) return new Response('Tidak ditemukan', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(UP, draft ? 'draft' : 'final', nama));
    const ext = nama.endsWith('.pdf') ? 'pdf' : 'docx';
    const inline = ext === 'pdf' && !q.get('unduh');
    return new Response(new Uint8Array(buf), { headers: {
      'Content-Type': TIPE[ext], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${asli.replace(/[^\w.\- ]+/g, '_')}"`,
    } });
  } catch { return new Response('File tidak ditemukan di server', { status: 404 }); }
}

/** Unggah surat final (Reserved -> Terarsip) atau ganti file (Terarsip). Body multipart: file, catatan. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ses = await getSession();
  if (!ses) return Response.json({ error: 'Sesi berakhir. Silakan login ulang.' }, { status: 401 });
  const s = getSurat(Number(params.id));
  if (!s) return Response.json({ error: 'Surat tidak ditemukan.' }, { status: 404 });
  if (s.status === 'dibatalkan') return Response.json({ error: 'Nomor ini sudah dibatalkan, tidak bisa diunggah.' }, { status: 400 });

  const set = getPengaturan(), fd = await req.formData(), f = fd.get('file');
  const catatan = String(fd.get('catatan') || '').trim().replace(/\s+/g, ' ').slice(0, 200);
  let simpan: { nama: string; asli: string; ukuran: number } | null = null;

  if (f instanceof File && f.size > 0) {
    if (f.size > set.maks_mb * 1048576) return Response.json({ error: `File lebih dari ${set.maks_mb} MB.` }, { status: 400 });
    const buf = Buffer.from(await f.arrayBuffer()), ext = ekstensiSurat(f.name, buf);
    if (!ext) return Response.json({ error: 'File harus berupa PDF atau DOCX yang valid.' }, { status: 400 });
    if ((ext === 'pdf' && !set.tipe_pdf) || (ext === 'docx' && !set.tipe_docx)) return Response.json({ error: `File ${ext.toUpperCase()} tidak diizinkan di Pengaturan.` }, { status: 400 });
    const nama = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
    await fs.mkdir(path.join(UP, 'final'), { recursive: true });
    await fs.writeFile(path.join(UP, 'final', nama), buf);
    simpan = { nama, asli: f.name.replace(/[^\w.\- ]+/g, '_').slice(-120), ukuran: buf.length };
  } else if (set.wajib_unggah || s.status === 'terarsip') {
    return Response.json({ error: 'Pilih file surat terlebih dahulu.' }, { status: 400 });
  }

  const pertama = s.status === 'reserved';
  db.prepare(`UPDATE surat SET status = 'terarsip', diarsipkan_at = COALESCE(diarsipkan_at, CURRENT_TIMESTAMP), catatan = ?,
    file = COALESCE(?, file), file_nama = COALESCE(?, file_nama), file_ukuran = COALESCE(?, file_ukuran) WHERE id = ?`)
    .run(catatan || s.catatan, simpan?.nama ?? null, simpan?.asli ?? null, simpan?.ukuran ?? null, s.id);
  if (simpan && s.file && NAMA_OK.test(s.file)) await fs.unlink(path.join(UP, 'final', s.file)).catch(() => {});
  if (simpan) catat(ses.uid, pertama ? 'File diunggah' : 'File diganti', s.no_naskah, s.id);
  if (pertama) catat(ses.uid, 'Terarsip', s.no_naskah, s.id);
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
