/** Fungsi murni untuk format nomor naskah (aman dipakai di server maupun client). */
export const TOKEN_NOMOR = ['[NO]', '[KODE]', '[TAHUN]'] as const;
export const FORMAT_BAWAAN = '[NO]/[KODE].000/GSD-065-04/[TAHUN]';
const PANJANG_NO = 3; // nomor urut ditulis 001, 002, ...

export type BahanNomor = { no: number; kode: string; tahun: number };

export function formatNomor(format: string, v: BahanNomor): string {
  return format
    .split('[NO]').join(String(v.no).padStart(PANJANG_NO, '0'))
    .split('[KODE]').join(v.kode)
    .split('[TAHUN]').join(String(v.tahun));
}

/** Mengembalikan pesan kesalahan, atau null bila format valid. */
export function cekFormatNomor(format: string, resetTahunan: boolean): string | null {
  const f = format.trim();
  if (!f) return 'Format nomor naskah wajib diisi.';
  if (f.length > 100) return 'Format nomor maksimal 100 karakter.';
  const token = f.match(/\[[^\]]*\]/g) ?? [];
  const asing = token.find((t) => !(TOKEN_NOMOR as readonly string[]).includes(t));
  if (asing) return `Token ${asing} tidak dikenal. Gunakan: ${TOKEN_NOMOR.join(', ')}.`;
  if (/[\[\]]/.test(f.replace(/\[(NO|KODE|TAHUN)\]/g, ''))) return 'Tanda kurung siku hanya untuk token.';
  if (!f.includes('[NO]')) return 'Format harus memuat token [NO].';
  if (resetTahunan && !f.includes('[TAHUN]')) return 'Urutan direset tiap tahun, jadi format harus memuat [TAHUN] agar nomor tidak kembar.';
  if (!/^[A-Za-z0-9\[\]\/.\-_ ]+$/.test(f)) return 'Format hanya boleh berisi huruf, angka, dan karakter / . - _ spasi.';
  return null;
}
