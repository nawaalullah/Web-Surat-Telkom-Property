import fs from 'fs/promises';
import path from 'path';

import { db, catat } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

const DIR = path.join(process.cwd(), 'data', 'avatar');
const MAKS = 1_000_000; // 1 MB; browser sudah memperkecil gambar ke 512x512
const NAMA_OK = /^\d+-[a-z0-9]+\.(png|jpg)$/;

const ekstensi = (b: Buffer) =>
    b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? 'png'
    : b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'jpg' : null;

/** Foto profil milik pengguna yang sedang login. */
export async function GET() {
    const s = await getSession();
    if (!s) return new Response('Belum login', { status: 401 });
    const u: any = db.prepare('SELECT foto FROM users WHERE id = ?').get(s.uid);
    if (!u?.foto || !NAMA_OK.test(u.foto)) return new Response('Tidak ditemukan', { status: 404 });
    try {
        const file = await fs.readFile(path.join(DIR, u.foto));
        return new Response(new Uint8Array(file), {
            headers: { 'Content-Type': u.foto.endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' },
        });
    } catch { return new Response('Tidak ditemukan', { status: 404 }); }
}

async function hapusLama(nama?: string | null) {
    if (nama && NAMA_OK.test(nama)) await fs.unlink(path.join(DIR, nama)).catch(() => {});
}

/** Ganti foto profil. Body: multipart dengan field "foto" (PNG atau JPG, maks 1 MB). */
export async function POST(req: Request) {
    const s = await getSession();
    if (!s) return Response.json({ error: 'Belum login.' }, { status: 401 });
    const f = (await req.formData()).get('foto');
    if (!(f instanceof File)) return Response.json({ error: 'File foto tidak ditemukan.' }, { status: 400 });
    if (f.size > MAKS) return Response.json({ error: 'Foto terlalu besar (maksimal 1 MB).' }, { status: 400 });
    const buf = Buffer.from(await f.arrayBuffer()), ext = ekstensi(buf);
    if (!ext) return Response.json({ error: 'Format foto harus PNG, JPG, atau JPEG.' }, { status: 400 });

    const lama: any = db.prepare('SELECT foto FROM users WHERE id = ?').get(s.uid);
    const nama = `${s.uid}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, nama), buf);
    db.prepare('UPDATE users SET foto = ? WHERE id = ?').run(nama, s.uid);
    await hapusLama(lama?.foto);
    catat(s.uid, 'Ubah foto profil');
    return Response.json({ ok: true, foto: nama });
}

/** Hapus foto profil (kembali ke inisial nama). */
export async function DELETE() {
    const s = await getSession();
    if (!s) return Response.json({ error: 'Belum login.' }, { status: 401 });
    const lama: any = db.prepare('SELECT foto FROM users WHERE id = ?').get(s.uid);
    db.prepare('UPDATE users SET foto = NULL WHERE id = ?').run(s.uid);
    await hapusLama(lama?.foto);
    catat(s.uid, 'Hapus foto profil');
    return Response.json({ ok: true });
}
