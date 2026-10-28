import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signSession, verifySession, NAMA_COOKIE, Session } from './session';
import { db } from './db';

export async function setSession(s: Session) {
  cookies().set(NAMA_COOKIE, await signSession(s), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 28800, secure: process.env.NODE_ENV === 'production' });
}

/**
 * Sesi dari cookie, lalu dicocokkan dengan database: akun nonaktif atau password yang sudah diganti langsung kehilangan akses.
 * Middleware hanya memeriksa tanda tangan token (edge runtime tidak bisa membuka SQLite); pemeriksaan penuh ada di sini.
 */
export const getSession = async (): Promise<Session | null> => {
  const s = await verifySession(cookies().get(NAMA_COOKIE)?.value);
  if (!s) return null;
  const u = db.prepare('SELECT id, nama, token_versi FROM users WHERE id = ? AND aktif = 1').get(s.uid) as { id: number; nama: string; token_versi: number } | undefined;
  if (!u || (s.tv ?? 0) !== u.token_versi) return null;
  return { uid: u.id, nama: u.nama, tv: u.token_versi };
};

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}
