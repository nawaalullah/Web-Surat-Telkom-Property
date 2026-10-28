import { SignJWT, jwtVerify } from 'jose';

// Nama cookie dibuat berbeda dari BA Ukur agar dua aplikasi di satu VPS tidak saling menimpa sesi.
export const NAMA_COOKIE = 'session_surat';

// tv = versi token pengguna (users.token_versi). Naik saat password diganti sehingga sesi lama batal.
export type Session = { uid: number; nama: string; tv?: number };

// Secret bawaan hanya untuk pengembangan lokal. Di produksi SESSION_SECRET wajib diisi.
function kunci() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET belum diatur di lingkungan produksi.');
  return new TextEncoder().encode(s || 'dev-secret-ganti-di-produksi');
}
export const signSession = async (s: Session) => new SignJWT({ ...s }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('8h').sign(kunci());
export async function verifySession(t?: string): Promise<Session | null> {
  if (!t) return null;
  try { return (await jwtVerify(t, kunci())).payload as unknown as Session; } catch { return null; }
}
