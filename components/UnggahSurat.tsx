'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { inp, lbl, btnP, btnO } from '@/lib/ui';
import { kirimPesan } from './NotifGlobal';
import { useSeret } from './useSeret';

export type AturanFile = { maksMb: number; pdf: boolean; docx: boolean; wajib: boolean };
type Props = { id: number; noNaskah: string; perihal: string; status: 'reserved' | 'terarsip'; aturan: AturanFile; varian?: 'tabel' | 'ikon' | 'utama' };

const ukuran = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

/** Tombol + dialog Unggah Surat (Reserved -> Terarsip) atau Ganti File (Terarsip). Mengirim lewat XHR agar ada progres. */
export default function UnggahSurat({ id, noNaskah, perihal, status, aturan, varian = 'tabel' }: Props) {
  const r = useRouter(), pilih = useRef<HTMLInputElement>(null), kotak = useRef<HTMLDivElement>(null);
  const [buka, setBuka] = useState(false), [siap, setSiap] = useState(false), [file, setFile] = useState<File | null>(null), [catatan, setCatatan] = useState('');
  const [persen, setPersen] = useState(0), [kirim, setKirim] = useState(false), [galat, setGalat] = useState('');
  const ganti = status === 'terarsip', ext = [aturan.pdf && 'PDF', aturan.docx && 'DOCX'].filter(Boolean).join(' atau ');
  useEffect(() => setSiap(true), []);

  function tutup() { if (kirim) return; setBuka(false); setFile(null); setCatatan(''); setPersen(0); setGalat(''); }
  useEffect(() => {
    if (!buka) return;
    const asal = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') tutup(); };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = asal; };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function pilihFile(f?: File) {
    if (!f) return;
    const e = f.name.toLowerCase().match(/\.(pdf|docx)$/)?.[1];
    if (!e || (e === 'pdf' && !aturan.pdf) || (e === 'docx' && !aturan.docx)) return setGalat(`"${f.name}" tidak didukung. Gunakan ${ext}.`);
    if (f.size > aturan.maksMb * 1048576) return setGalat(`"${f.name}" lebih dari ${aturan.maksMb} MB.`);
    setGalat(''); setFile(f); setPersen(0);
  }
  const dz = useSeret((fl) => pilihFile(fl[0]), kirim);

  function simpan() {
    if (!file && (aturan.wajib || ganti)) return setGalat('Pilih file surat terlebih dahulu.');
    const fd = new FormData(); if (file) fd.append('file', file); fd.append('catatan', catatan);
    const x = new XMLHttpRequest(); x.open('POST', `/api/surat/${id}/file`);
    x.upload.onprogress = (e) => e.lengthComputable && setPersen(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      let j: any = {}; try { j = JSON.parse(x.responseText); } catch { /* abaikan */ }
      setKirim(false);
      if (x.status >= 200 && x.status < 300) { setBuka(false); setFile(null); setCatatan(''); kirimPesan(ganti ? 'File surat berhasil diganti.' : 'Surat berhasil diunggah dan masuk arsip.'); r.refresh(); }
      else setGalat(j.error || 'Gagal mengunggah file.');
    };
    x.onerror = () => { setKirim(false); setGalat('Gagal terhubung ke server.'); };
    setKirim(true); setGalat(''); x.send(fd);
  }

  const trigger = varian === 'ikon'
    ? <button type="button" onClick={() => setBuka(true)} aria-label={`Ganti file ${noNaskah}`} title="Ganti file" className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-line-strong bg-surface cursor-pointer text-ink-2"><i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i></button>
    : varian === 'utama'
      ? <button type="button" onClick={() => setBuka(true)} className={btnP + ' w-full gap-2'}><i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>{ganti ? 'Ganti File' : 'Unggah Surat'}</button>
      : <button type="button" onClick={() => setBuka(true)} className="inline-flex items-center gap-2 min-h-[36px] px-3 rounded-lg border border-dashed border-danger-line bg-danger-soft text-danger text-[13px] font-bold cursor-pointer whitespace-nowrap"><i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i>Unggah surat</button>;

  const langkah = (n: number, t: string, selesai: boolean, aktif: boolean) => (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
      <span className={'w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ' + (selesai ? 'bg-ok-fg text-white' : aktif ? 'bg-brand text-white' : 'border border-line-strong text-muted')}>{selesai ? <i className="fa-solid fa-check" aria-hidden="true"></i> : n}</span>{t}
    </span>
  );

  return (
    <>
      {trigger}
      {siap && buka && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/55" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
          <div role="dialog" aria-modal="true" aria-label={ganti ? 'Ganti File Surat' : 'Unggah Surat'} className="font-sans text-ink bg-surface border border-line rounded-xl shadow-[0_12px_32px_rgba(27,38,35,.18)] w-[620px] max-w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="m-0 text-xl font-bold">{ganti ? 'Ganti File Surat' : 'Unggah Surat'}</h2><div className="mt-0.5 text-[13px] text-muted break-all"><span className="font-mono">{noNaskah}</span> · {perihal}</div></div>
              <span className={'shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ' + (ganti ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg')}>{ganti ? 'Terarsip' : 'Reserved'}</span>
            </div>
            <div className="mt-4 flex items-center gap-3 flex-wrap">{langkah(1, 'Reserved', true, false)}<span className="h-0.5 w-8 bg-brand" />{langkah(2, 'Unggah surat', ganti, !ganti)}<span className={'h-0.5 w-8 ' + (ganti ? 'bg-brand' : 'bg-line')} />{langkah(3, 'Terarsip', ganti, false)}</div>
            <div ref={kotak} {...dz.props} className={'mt-4 rounded-xl border border-dashed border-line-dash bg-well p-6 text-center ' + dz.kelas}>
              <button type="button" disabled={kirim} onClick={() => pilih.current?.click()} className="bg-transparent border-0 cursor-pointer w-full text-ink disabled:opacity-60">
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-ink-2" aria-hidden="true"></i>
                <div className="mt-2 text-sm font-bold">Tarik file ke sini atau pilih dari perangkat</div>
                <div className="text-[13px] text-muted">{ext}, maksimal {aturan.maksMb} MB</div>
              </button>
              <input ref={pilih} type="file" accept={[aturan.pdf && '.pdf', aturan.docx && '.docx'].filter(Boolean).join(',')} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pilihFile(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            {file && (
              <div className="mt-3 rounded-lg border border-ok-line bg-ok-bg p-3 text-ok-fg">
                <div className="flex justify-between gap-3 text-sm font-bold"><span className="truncate">{file.name}</span><span className="shrink-0 text-xs font-semibold">{ukuran(file.size)}{kirim ? ` · ${persen}%` : persen === 100 ? ' · selesai' : ''}</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden"><div className="h-full bg-ok-fg transition-all" style={{ width: (kirim ? persen : 100) + '%' }} /></div>
              </div>
            )}
            {galat && <div role="alert" className="mt-3 text-sm font-semibold text-danger">{galat}</div>}
            <label className={lbl + ' mt-4 block'}>Catatan <span className="font-normal text-muted">(opsional)</span>
              <input value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={200} disabled={kirim} placeholder="Mis. salinan bertanda tangan basah" className={inp} />
            </label>
            <div className="mt-5 flex gap-3 justify-end max-sm:flex-col-reverse max-sm:[&>*]:w-full">
              <button type="button" onClick={tutup} disabled={kirim} className={btnO + ' disabled:opacity-60'}>Batal</button>
              <button type="button" onClick={simpan} disabled={kirim} className={btnP + ' gap-2 disabled:opacity-60'}><i className="fa-solid fa-paper-plane" aria-hidden="true"></i>{kirim ? 'Mengunggah...' : 'Simpan ke Arsip'}</button>
            </div>
          </div>
        </div>, document.body)}
    </>
  );
}
