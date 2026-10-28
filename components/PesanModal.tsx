'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GAYA_MODAL, ModalDasar, TipeModal, tipeOtomatis, tombolUtama } from './Modal';

/**
 * Pengganti banner alert: menampilkan pesan dalam modal.
 * - Halaman server: <PesanModal pesan={q.err} hapusParam={['err']} /> (parameter URL dibersihkan saat ditutup
 *   supaya modal tidak muncul lagi ketika halaman dimuat ulang).
 * - Komponen client: <PesanModal pesan={msg} onTutup={() => setMsg('')} />.
 * Jika pesan kosong, tidak menampilkan apa pun.
 */
export default function PesanModal({ pesan, tipe, judul, hapusParam, onTutup }: { pesan?: string | null; tipe?: TipeModal; judul?: string; hapusParam?: string[]; onTutup?: () => void }) {
  const r = useRouter(), [buka, setBuka] = useState(true);
  useEffect(() => setBuka(true), [pesan]);
  if (!pesan || !buka) return null;
  const t = tipe ?? tipeOtomatis(pesan);
  function tutup() {
    setBuka(false);
    if (hapusParam?.length) {
      const u = new URL(window.location.href);
      hapusParam.forEach((k) => u.searchParams.delete(k));
      r.replace(u.pathname + u.search + u.hash, { scroll: false });
    }
    onTutup?.();
  }
  return (<ModalDasar tipe={t} judul={judul ?? GAYA_MODAL[t].judul} pesan={pesan} onTutup={tutup}>
    <button type="button" data-awal onClick={tutup} className={tombolUtama + ' min-w-[120px]'}>OK</button>
  </ModalDasar>);
}
