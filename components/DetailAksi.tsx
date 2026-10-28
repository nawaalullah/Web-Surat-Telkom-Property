'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ubahSurat, batalkanSurat, type Hasil } from '@/app/arsip/actions';
import { card, inp, lbl, btnP, btnO } from '@/lib/ui';
import { ModalDasar } from './Modal';
import PesanModal from './PesanModal';
import { kirimPesan } from './NotifGlobal';
import UnggahSurat, { type AturanFile } from './UnggahSurat';

type S = { id: number; no_naskah: string; perihal: string; sifat: string; dari: string; kepada: string; alamat: string; lampiran: string; tanggal: string; status: 'reserved' | 'terarsip' | 'dibatalkan'; tahun: number; dipakai_ulang_oleh: number | null };

/** Panel Tindakan di halaman detail: unggah/ganti file, edit data, batalkan nomor. */
export default function DetailAksi({ surat: s, aturan }: { surat: S; aturan: AturanFile }) {
  const r = useRouter(), [edit, setEdit] = useState(false), [batal, setBatal] = useState(false), [alasan, setAlasan] = useState(''), [pesan, setPesan] = useState<Hasil | null>(null), [pending, mulai] = useTransition();
  if (s.status === 'dibatalkan') return <section className={card}><h2 className="m-0 text-base font-bold">Tindakan</h2><p className="mt-2 mb-0 text-sm text-muted">{s.dipakai_ulang_oleh
      ? <>Nomor dan no agenda ini sudah dibatalkan dan kini dipakai kembali oleh <Link href={`/arsip/${s.dipakai_ulang_oleh}`} className="font-bold text-brandfg">surat lain</Link>.</>
      : 'Nomor dan no agenda ini sudah dibatalkan dan akan dipakai kembali oleh surat berikutnya.'}</p></section>;

  return (
    <section className={card + ' flex flex-col gap-3'}>
      <h2 className="m-0 text-base font-bold">Tindakan</h2>
      <UnggahSurat id={s.id} noNaskah={s.no_naskah} perihal={s.perihal} status={s.status} aturan={aturan} varian="utama" />
      <button type="button" onClick={() => setEdit(true)} className={btnO + ' w-full gap-2 !text-ink'}><i className="fa-solid fa-pen" aria-hidden="true"></i>Edit Data</button>
      <button type="button" onClick={() => setBatal(true)} className="bg-transparent border-0 cursor-pointer min-h-[40px] text-sm font-bold text-danger"><i className="fa-solid fa-ban mr-2" aria-hidden="true"></i>Batalkan Nomor</button>

      {edit && (
        <ModalDasar tipe="info" judul="Edit data surat" pesan={`${s.no_naskah} (nomor naskah dan no agenda tidak bisa diubah)`} onTutup={() => setEdit(false)}>
          <form id="form-edit" className="w-full flex flex-col gap-3 text-left" action={(fd) => mulai(async () => { const h = await ubahSurat(s.id, fd); if (h.ok) { setEdit(false); kirimPesan(h.pesan); r.refresh(); } else setPesan(h); })}>
            <label className={lbl}>Perihal<input name="perihal" required maxLength={200} defaultValue={s.perihal} className={inp} /></label>
            <label className={lbl}>Sifat<select name="sifat" defaultValue={s.sifat} className={inp}><option value="biasa">Biasa</option><option value="segera">Segera</option><option value="rahasia">Rahasia</option></select></label>
            <label className={lbl}>Tanggal surat<input name="tanggal" type="date" required min={`${s.tahun}-01-01`} max={`${s.tahun}-12-31`} defaultValue={s.tanggal} className={inp} /></label>
            <label className={lbl}>Dari<input name="dari" required maxLength={120} defaultValue={s.dari} className={inp} /></label>
            <label className={lbl}>Kepada<input name="kepada" required maxLength={120} defaultValue={s.kepada} className={inp} /></label>
            <label className={lbl}>Alamat<input name="alamat" maxLength={300} defaultValue={s.alamat} className={inp} /></label>
            <label className={lbl}>Lampiran<input name="lampiran" maxLength={100} defaultValue={s.lampiran} className={inp} /></label>
            <div className="flex gap-3 justify-end mt-1 max-sm:flex-col-reverse max-sm:[&>*]:w-full">
              <button type="button" onClick={() => setEdit(false)} className={btnO}>Batal</button>
              <button type="submit" disabled={pending} className={btnP + ' disabled:opacity-60'}>{pending ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </ModalDasar>
      )}
      {batal && (
        <ModalDasar tipe="peringatan" judul="Batalkan nomor?" pesan={`${s.no_naskah} akan dicoret di arsip dan nomor dan no agendanya dipakai kembali oleh surat berikutnya. Pembatalan tidak bisa dikembalikan.`} onTutup={() => setBatal(false)}>
          <label className={lbl + ' w-full text-left'}>Alasan pembatalan<input data-awal value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={200} placeholder="Mis. salah ketik tujuan" className={inp} /></label>
          <button type="button" onClick={() => setBatal(false)} className={btnO}>Kembali</button>
          <button type="button" disabled={pending} className={btnP + ' disabled:opacity-60'} onClick={() => mulai(async () => { const h = await batalkanSurat(s.id, alasan); if (h.ok) { setBatal(false); setAlasan(''); kirimPesan(h.pesan); r.refresh(); } else setPesan(h); })}>{pending ? 'Memproses...' : 'Batalkan Nomor'}</button>
        </ModalDasar>
      )}
      <PesanModal pesan={pesan?.pesan} tipe="error" onTutup={() => setPesan(null)} />
    </section>
  );
}
