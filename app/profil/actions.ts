'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { db, catat } from '@/lib/db';
import { getSession, setSession } from '@/lib/auth';

export type Hasil = { ok: boolean; pesan: string };

/** Ubah nama, username, dan jabatan milik pengguna yang sedang login. */
export async function ubahProfil(fd: FormData): Promise<Hasil> {
    const s = await getSession();
    if (!s) return { ok: false, pesan: 'Sesi berakhir. Silakan login ulang.' };

    const nama = String(fd.get('nama') || '').trim().replace(/\s+/g, ' ');
    const username = String(fd.get('username') || '').trim();
    const jabatan = String(fd.get('jabatan') || '').trim().replace(/\s+/g, ' ');

    if (!nama) return { ok: false, pesan: 'Nama lengkap wajib diisi.' };
    if (nama.length > 100) return { ok: false, pesan: 'Nama maksimal 100 karakter.' };
    if (!username) return { ok: false, pesan: 'Username wajib diisi.' };
    if (username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
        return { ok: false, pesan: 'Username harus 3–30 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.' };
    }
    if (!jabatan) return { ok: false, pesan: 'Jabatan wajib diisi.' };
    if (jabatan.length > 100) return { ok: false, pesan: 'Jabatan maksimal 100 karakter.' };

    const pemilik = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, s.uid);
    if (pemilik) return { ok: false, pesan: 'Username sudah digunakan akun lain.' };

    try {
        db.prepare('UPDATE users SET nama = ?, username = ?, jabatan = ? WHERE id = ?').run(nama, username, jabatan, s.uid);
    } catch (e: any) {
        if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return { ok: false, pesan: 'Username sudah digunakan akun lain.' };
        return { ok: false, pesan: 'Profil gagal disimpan. Silakan coba lagi.' };
    }

    await setSession({ uid: s.uid, nama, tv: s.tv });
    catat(s.uid, 'Ubah profil', `Nama: ${nama}; Username: ${username}; Jabatan: ${jabatan}`);
    revalidatePath('/', 'layout');
    revalidatePath('/profil');
    return { ok: true, pesan: 'Profil berhasil diperbarui.' };
}

/** Ganti password sendiri. Wajib menyertakan password lama. */
export async function ubahPassword(fd: FormData): Promise<Hasil> {
    const s = await getSession();
    if (!s) return { ok: false, pesan: 'Sesi berakhir. Silakan login ulang.' };
    const lama = String(fd.get('lama') || ''), baru = String(fd.get('baru') || ''), ulang = String(fd.get('ulang') || '');
    const u: any = db.prepare('SELECT password_hash FROM users WHERE id = ? AND aktif = 1').get(s.uid);
    if (!u || !bcrypt.compareSync(lama, u.password_hash)) return { ok: false, pesan: 'Password lama salah.' };
    if (baru.length < 10) return { ok: false, pesan: 'Password baru minimal 10 karakter.' };
    if (baru.length > 72) return { ok: false, pesan: 'Password baru maksimal 72 karakter.' };
    if (baru !== ulang) return { ok: false, pesan: 'Konfirmasi password tidak sama.' };
    if (baru === lama) return { ok: false, pesan: 'Password baru harus berbeda dari password lama.' };
    db.prepare('UPDATE users SET password_hash = ?, token_versi = token_versi + 1 WHERE id = ?').run(bcrypt.hashSync(baru, 12), s.uid);
    // Sesi lain (perangkat lain) batal; sesi ini diperbarui supaya pengguna tidak ikut keluar.
    const tv = (db.prepare('SELECT token_versi FROM users WHERE id = ?').get(s.uid) as { token_versi: number }).token_versi;
    await setSession({ uid: s.uid, nama: s.nama, tv });
    catat(s.uid, 'Ubah password sendiri');
    return { ok: true, pesan: 'Password berhasil diganti. Gunakan password baru saat login berikutnya.' };
}
