'use server';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, catat } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { NAMA_COOKIE } from '@/lib/session';
import { ipKlien, terblokir, catatGagal, catatBerhasil } from '@/lib/batasLogin';

export async function login(fd: FormData) {
  const username = String(fd.get('username') || '').trim(), ip = ipKlien(headers());
  // Terlalu banyak percobaan gagal: tolak tanpa memeriksa password.
  if (terblokir(ip, username)) redirect('/login?error=2');
  const u: any = db.prepare('SELECT * FROM users WHERE username = ? AND aktif = 1').get(username);
  if (!u || !bcrypt.compareSync(String(fd.get('password') || ''), u.password_hash)) { catatGagal(ip, username); redirect('/login?error=1'); }
  catatBerhasil(ip, username);
  await setSession({ uid: u.id, nama: u.nama, tv: u.token_versi ?? 0 });
  catat(u.id, 'Login');
  redirect('/arsip');
}

export async function logout() {
  cookies().delete(NAMA_COOKIE);
  redirect('/login');
}
