'use client';
import { useEffect } from 'react';

/** Membuka dialog cetak sekali saat halaman laporan dibuka dengan ?cetak=1 (pilih "Simpan sebagai PDF"). */
export default function AutoCetak() {
  useEffect(() => { const t = setTimeout(() => window.print(), 400); return () => clearTimeout(t); }, []);
  return null;
}
