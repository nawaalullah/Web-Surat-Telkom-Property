'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resetDataAplikasi, type Hasil } from '@/app/pengaturan/actions';
import { card, inp, lbl, btnP, btnO } from '@/lib/ui';
import { ModalDasar } from './Modal';
import InputPassword from './InputPassword';
import PesanModal from './PesanModal';

/** Zona berbahaya di Pengaturan: kembalikan data ke keadaan aplikasi baru (akun tidak berubah). */
export default function ResetData({ diizinkan, jumlahSurat }: { diizinkan: boolean; jumlahSurat: number }) {
  const r = useRouter(), [buka, setBuka] = useState(false), [pesan, setPesan] = useState<Hasil | null>(null), [pending, mulai] = useTransition();
  const [kon, setKon] = useState(''), [pw, setPw] = useState(''), [simpan, setSimpan] = useState(true);
  const tutup = () => { if (!pending) { setBuka(false); setKon(''); setPw(''); } };

  return (
    <section id="reset" className={card + ' scroll-mt-4 !border-danger-line'}>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 rounded-lg bg-danger-soft text-danger inline-flex items-center justify-center"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
        <div><h2 className="m-0 text-base font-bold text-danger">Reset Data</h2><div className="text-[13px] text-muted">Kembalikan aplikasi seperti baru dibuat.</div></div>
      </div>
      <p className="m-0 text-sm text-ink-2">Mengosongkan <b>{jumlahSurat} surat</b>, penomoran (kembali mulai dari 001 dan agenda 1), dan log audit. File surat di <span className="font-mono">uploads/</span> dipindahkan. Akun login tidak berubah. Salinan data lama disimpan di <span className="font-mono">data/cadangan/</span> sebelum dikosongkan.</p>
      <div className="mt-4">
        {diizinkan
          ? <button type="button" onClick={() => setBuka(true)} className={btnO + ' gap-2 !text-danger !border-danger-line'}><i className="fa-solid fa-trash" aria-hidden="true"></i>Reset Data...</button>
          : <p className="m-0 text-[13px] font-semibold text-muted">Reset data dikunci di server ini (RESET_DATA=off di .env).</p>}
      </div>

      {buka && (
        <ModalDasar tipe="peringatan" judul="Reset semua data?" pesan="Semua surat, nomor, dan log audit akan dikosongkan. Tindakan ini tidak bisa dibatalkan dari aplikasi; salinan data lama hanya ada di folder data/cadangan/ di server." onTutup={tutup}>
          <form id="form-reset" className="w-full flex flex-col gap-3 text-left" action={(fd) => mulai(async () => { const h = await resetDataAplikasi(fd); setPesan(h); if (h.ok) { setBuka(false); setKon(''); setPw(''); r.refresh(); } })}>
            <label className={lbl}>Password akun Anda<InputPassword name="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inp} /></label>
            <label className={lbl}>Ketik <span className="font-mono">RESET</span> untuk melanjutkan<input name="konfirmasi" data-awal value={kon} onChange={(e) => setKon(e.target.value)} autoComplete="off" spellCheck={false} className={inp + ' font-mono'} /></label>
            <label className="flex items-start gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" name="simpan_pengaturan" value="1" checked={simpan} onChange={(e) => setSimpan(e.target.checked)} className="mt-0.5 w-[18px] h-[18px] accent-[rgb(var(--brand))]" />
              <span>Pertahankan pengaturan<span className="block font-normal text-muted">Format nomor, batas file, dan pengingat tidak ikut direset.</span></span>
            </label>
            <div className="flex gap-3 justify-end mt-1 max-sm:flex-col-reverse max-sm:[&>*]:w-full">
              <button type="button" onClick={tutup} disabled={pending} className={btnO}>Batal</button>
              <button type="submit" disabled={pending || kon.trim() !== 'RESET' || !pw} className={btnP + ' disabled:opacity-50'}>{pending ? 'Mereset...' : 'Reset Data'}</button>
            </div>
          </form>
        </ModalDasar>
      )}
      <PesanModal pesan={pesan?.pesan} tipe={pesan?.ok ? 'sukses' : 'error'} onTutup={() => setPesan(null)} />
    </section>
  );
}
