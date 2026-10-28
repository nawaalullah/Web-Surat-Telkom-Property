/**
 * Pembatas percobaan login (disimpan di memori proses; cukup untuk satu server).
 * - Per kombinasi IP + username: maksimal 5 kegagalan dalam 15 menit.
 * - Per IP: maksimal 20 kegagalan dalam 15 menit (menahan tebakan banyak username); hanya bila IP dapat dipercaya.
 * - Per username (semua IP): maksimal 15 kegagalan dalam 15 menit.
 * Kombinasi IP + username dipakai agar penyerang tidak bisa mengunci akun pengguna asli dari IP lain.
 */
const JENDELA = 15 * 60 * 1000;
const MAKS_AKUN = 5;
const MAKS_IP = 20;

type Catatan = { n: number; sejak: number };
const g = globalThis as any;
const peta: Map<string, Catatan> = (g.__batas_login ??= new Map());

const aktif = (k: string): Catatan | null => {
    const c = peta.get(k);
    if (!c) return null;
    if (Date.now() - c.sejak > JENDELA) {
        peta.delete(k);
        return null;
    }
    return c;
};

const tambah = (k: string) => {
    const c = aktif(k);
    if (c) c.n++;
    else peta.set(k, { n: 1, sejak: Date.now() });
};

const TAK_DIKENAL = 'tak-dikenal';

/**
 * Alamat IP klien. Header X-Forwarded-For hanya dipercaya bila TRUST_PROXY=1 (aplikasi berjalan di belakang
 * reverse proxy yang menimpa header itu). Tanpa itu, klien bisa memalsukan IP di tiap percobaan dan
 * menghindari pembatas. Bila tidak dipercaya, IP dianggap tak dikenal dan batas per-IP tidak dipakai;
 * batas per-username (di bawah) tetap berlaku.
 */
export function ipKlien(h: Headers): string {
    if (process.env.TRUST_PROXY !== '1') return TAK_DIKENAL;
    // Entri paling kanan ditambahkan oleh proxy tepercaya; entri kiri bisa dipalsukan klien.
    const xff = h.get('x-forwarded-for')?.split(',').map((x) => x.trim()).filter(Boolean).pop();
    return xff || h.get('x-real-ip') || TAK_DIKENAL;
}

/** Batas gagal per username dari IP mana pun (menahan tebakan yang memutar IP). */
const MAKS_USER = 15;
const kunciUser = (user: string) => `u|${user.toLowerCase().slice(0, 100)}`;

const kunciAkun = (ip: string, user: string) => `a|${ip}|${user.toLowerCase().slice(0, 100)}`;
const kunciIp = (ip: string) => `i|${ip}`;

/** True bila percobaan login dari IP/username ini sedang diblokir. */
export function terblokir(ip: string, user: string): boolean {
    return (
        (aktif(kunciAkun(ip, user))?.n ?? 0) >= MAKS_AKUN ||
        (ip !== TAK_DIKENAL && (aktif(kunciIp(ip))?.n ?? 0) >= MAKS_IP) ||
        (aktif(kunciUser(user))?.n ?? 0) >= MAKS_USER
    );
}

export function catatGagal(ip: string, user: string) {
    if (peta.size > 5000) for (const k of Array.from(peta.keys())) aktif(k); // buang yang sudah kedaluwarsa
    tambah(kunciAkun(ip, user));
    tambah(kunciUser(user));
    if (ip !== TAK_DIKENAL) tambah(kunciIp(ip));
}

/** Login berhasil: hapus hitungan akun ini (hitungan IP tetap berjalan sampai kedaluwarsa). */
export function catatBerhasil(ip: string, user: string) {
    peta.delete(kunciAkun(ip, user));
    peta.delete(kunciUser(user));
}
