/** Jenis file dari byte awalnya (bukan dari File.type atau nama file, yang bisa dipalsukan). */
export type JenisFile = 'pdf' | 'png' | 'jpg' | 'zip';

export function jenisFile(b: Buffer): JenisFile | null {
  if (b.length > 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5) && (b[3] === 4 || b[3] === 6)) return 'zip'; // DOCX adalah ZIP
  return null;
}

/** Cocokkan ekstensi nama file (pdf/docx) dengan isi sebenarnya. Mengembalikan ekstensi, atau null bila tidak cocok. */
export function ekstensiSurat(nama: string, b: Buffer): 'pdf' | 'docx' | null {
  const e = nama.toLowerCase().match(/\.(pdf|docx)$/)?.[1];
  const j = jenisFile(b);
  if (e === 'pdf' && j === 'pdf') return 'pdf';
  if (e === 'docx' && j === 'zip' && b.includes(Buffer.from('word/'))) return 'docx';
  return null;
}
