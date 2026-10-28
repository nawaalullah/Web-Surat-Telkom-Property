import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { db, catat } from '@/lib/db';

export const runtime = 'nodejs';

/** Unduh salinan konsisten database (app.db). File surat di folder uploads/ tidak ikut dan tetap dicadangkan manual. */
export async function GET() {
  const ses = await getSession();
  if (!ses) return new Response('Belum login', { status: 401 });
  const tmp = path.join(os.tmpdir(), `arsip-${crypto.randomBytes(6).toString('hex')}.db`);
  try {
    db.prepare('VACUUM INTO ?').run(tmp);
    const buf = await fs.readFile(tmp);
    const t = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' }).format(new Date()).replace(/[-: ]/g, '').replace(/^(\d{8})(\d{4})$/, '$1-$2');
    catat(ses.uid, 'Unduh cadangan database');
    return new Response(new Uint8Array(buf), { headers: {
      'Content-Type': 'application/vnd.sqlite3', 'Content-Disposition': `attachment; filename="arsip-surat-${t}.db"`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } finally { await fs.unlink(tmp).catch(() => {}); }
}
