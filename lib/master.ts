/** Definisi empat tabel master dan aturan validasinya (dipakai server action dan halaman). */
export type TabMaster = 'penandatangan' | 'alamat';
export type Kolom = { k: string; label: string; ph: string; maks: number; kode?: boolean; opsional?: boolean };

export const MASTER: Record<TabMaster, { tabel: string; judul: string; tunggal: string; kolom: Kolom[]; cari: string[] }> = {
  penandatangan: { tabel: 'penandatangan', judul: 'Penandatangan', tunggal: 'penandatangan', cari: ['nama', 'jabatan'],
    kolom: [{ k: 'nama', label: 'Nama', ph: 'Nama lengkap', maks: 120 }, { k: 'jabatan', label: 'Jabatan', ph: 'Mis. General Manager', maks: 120, opsional: true }] },
  alamat: { tabel: 'buku_alamat', judul: 'Buku Alamat', tunggal: 'alamat', cari: ['nama', 'alamat'],
    kolom: [{ k: 'nama', label: 'Instansi / penerima', ph: 'Nama instansi atau penerima', maks: 120 }, { k: 'alamat', label: 'Alamat', ph: 'Alamat lengkap', maks: 300, opsional: true }] },
};

export const TAB_URUT: TabMaster[] = ['alamat', 'penandatangan'];
export const adalahTab = (t: unknown): t is TabMaster => typeof t === 'string' && t in MASTER;

/** Rapikan dan periksa satu kolom; mengembalikan [nilai, pesanError]. */
export function cekKolom(c: Kolom, mentah: unknown): [string, string | null] {
  let v = String(mentah ?? '').trim().replace(/\s+/g, ' ');
  if (c.kode) v = v.toUpperCase();
  if (!v) return c.opsional ? ['', null] : ['', `${c.label} wajib diisi.`];
  if (v.length > c.maks) return [v, `${c.label} maksimal ${c.maks} karakter.`];
  // Kode dipakai di nomor naskah: tanpa garis miring, spasi, atau tanda kurung.
  if (c.kode && !/^[A-Z0-9][A-Z0-9.\-]*$/.test(v)) return [v, `${c.label} hanya boleh huruf, angka, titik, atau strip (tanpa spasi dan garis miring).`];
  return [v, null];
}
