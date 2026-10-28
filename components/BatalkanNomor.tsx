'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { batalkanSurat, type Hasil } from '@/app/arsip/actions';
import { inp, lbl, btnP, btnO } from '@/lib/ui';
import { ModalDasar } from './Modal';
import PesanModal from './PesanModal';
import { kirimPesan } from './NotifGlobal';

/** Tombol ikon di daftar arsip: ubah status nomor menjadi Dibatalkan (nomor tidak terpakai) dengan alasan wajib. */
export default function BatalkanNomor({ id, noNaskah }: { id: number; noNaskah: string }) {
  const r = useRouter(), [buka, setBuka] = useState(false), [alasan, setAlasan] = useState(''), [pesan, setPesan] = useState<Hasil | null>(null), [pending, mulai] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setBuka(true)} title="Batalkan nomor (tidak terpakai)" aria-label={`Batalkan nomor ${noNaskah}`}
        className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-line-strong bg-surface cursor-pointer text-danger">
        <i className="fa-solid fa-ban" aria-hidden="true"></i>
      </button>
      {buka && (
        <ModalDasar tipe="peringatan" judul="Batalkan nomor?" pesan={`${noNaskah} akan dicoret di arsip dan tidak dipakai ulang. Tindakan ini tidak bisa dibatalkan.`} onTutup={() => setBuka(false)}>
          <label className={lbl + ' w-full text-left'}>Alasan pembatalan<input data-awal value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={200} placeholder="Mis. salah ketik tujuan" className={inp} /></label>
          <button type="button" onClick={() => setBuka(false)} className={btnO}>Kembali</button>
          <button type="button" disabled={pending} className={btnP + ' disabled:opacity-60'}
            onClick={() => mulai(async () => { const h = await batalkanSurat(id, alasan); if (h.ok) { setBuka(false); setAlasan(''); kirimPesan(h.pesan); r.refresh(); } else setPesan(h); })}>{pending ? 'Memproses...' : 'Batalkan Nomor'}</button>
        </ModalDasar>
      )}
      <PesanModal pesan={pesan?.pesan} tipe="error" onTutup={() => setPesan(null)} />
    </>
  );
}
