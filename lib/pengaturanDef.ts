/** Definisi pengaturan tanpa akses database (aman diimpor komponen client). */
import { FORMAT_BAWAAN } from './nomor';

export type Pengaturan = {
  format_nomor: string;
  reset_urutan: 'tahunan' | 'tidak';
  agenda_mulai: number;
  tipe_pdf: boolean;
  tipe_docx: boolean;
  maks_mb: number;
  wajib_unggah: boolean;
  ingatkan: boolean;
  ingatkan_hari: number;
};

export const BAWAAN: Pengaturan = {
  format_nomor: FORMAT_BAWAAN, reset_urutan: 'tahunan', agenda_mulai: 1,
  tipe_pdf: true, tipe_docx: true, maks_mb: 10, wajib_unggah: true, ingatkan: true, ingatkan_hari: 3,
};

export const MAKS_MB_BATAS = 10; // batas atas yang ditawarkan di Pengaturan

export function tahunSekarang(): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date()));
}

