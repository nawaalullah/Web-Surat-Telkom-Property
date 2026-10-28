/**
 * Jenis surat tetap. Kodenya dipakai pada nomor naskah lewat token [KODE] (mis. 005/UM/2026).
 * Untuk menambah jenis baru atau memberi nama (mis. { kode: 'UM', nama: 'Umum' }), cukup ubah daftar ini.
 */
export const JENIS_SURAT: readonly { kode: string }[] = [{ kode: 'UM' }, { kode: 'HK' }, { kode: 'PS' }, { kode: 'LG' }];
export const adalahJenis = (k: unknown): k is string => typeof k === 'string' && JENIS_SURAT.some((j) => j.kode === k);
