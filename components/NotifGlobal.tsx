'use client';
import { useEffect, useState } from 'react';
import PesanModal from './PesanModal';

/** Pesan sukses lintas komponen: baris tabel bisa berganti bentuk setelah data berubah, jadi pesannya tidak boleh hidup di baris itu. */
export const kirimPesan = (pesan: string) => window.dispatchEvent(new CustomEvent('pesan-app', { detail: pesan }));

export default function NotifGlobal() {
  const [pesan, setPesan] = useState('');
  useEffect(() => { const f = (e: Event) => setPesan(String((e as CustomEvent).detail || '')); window.addEventListener('pesan-app', f); return () => window.removeEventListener('pesan-app', f); }, []);
  return <PesanModal pesan={pesan} tipe="sukses" onTutup={() => setPesan('')} />;
}
