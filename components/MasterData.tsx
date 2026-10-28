'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { simpanMaster, hapusMaster, type Hasil } from '@/app/master/actions';
import { MASTER, TAB_URUT, type TabMaster } from '@/lib/master';
import { card, th, td, inp, lbl, btnP, btnO } from '@/lib/ui';
import { ModalDasar } from './Modal';
import PesanModal from './PesanModal';

export type Baris = { id: number; aktif: number; [k: string]: string | number };

const ikonBtn = 'w-9 h-9 inline-flex items-center justify-center rounded-lg border border-line-strong bg-surface cursor-pointer text-ink-2 disabled:opacity-60';

function Status({ aktif }: { aktif: number }) {
  return aktif
    ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-ok-bg text-ok-fg"><span className="w-1.5 h-1.5 rounded-full bg-current" />Aktif</span>
    : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-inactive text-muted"><span className="w-1.5 h-1.5 rounded-full bg-current" />Nonaktif</span>;
}

/** Dialog ubah data (Esc / klik latar menutup). */
function DialogUbah({ tab, baris, onTutup, onHasil }: { tab: TabMaster; baris: Baris; onTutup: () => void; onHasil: (h: Hasil) => void }) {
  const m = MASTER[tab], [pending, mulai] = useTransition(), [siap, setSiap] = useState(false), kotak = useRef<HTMLDivElement>(null);
  useEffect(() => setSiap(true), []);
  useEffect(() => {
    if (!siap) return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    kotak.current?.querySelector<HTMLElement>('input')?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup(); };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = asal; };
  }, [siap]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!siap) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/55" onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup(); }}>
      <form ref={kotak as any} role="dialog" aria-modal="true" aria-label={`Ubah ${m.tunggal}`}
        className="font-sans text-ink bg-surface border border-line rounded-xl shadow-[0_12px_32px_rgba(27,38,35,.18)] w-[460px] max-w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 flex flex-col gap-3"
        action={(fd) => mulai(async () => { const h = await simpanMaster(tab, fd); if (h.ok) onTutup(); onHasil(h); })}>
        <h2 className="m-0 text-[17px] font-bold">Ubah {m.tunggal}</h2>
        <input type="hidden" name="id" value={baris.id} />
        {m.kolom.map((c) => (
          <label key={c.k} className={lbl}>{c.label}{c.opsional && <span className="font-normal text-muted"> (opsional)</span>}
            <input name={c.k} defaultValue={String(baris[c.k] ?? '')} required={!c.opsional} maxLength={c.maks} placeholder={c.ph} className={inp + (c.kode ? ' font-mono uppercase' : '')} />
          </label>
        ))}
        <label className={lbl}>Status
          <select name="aktif" defaultValue={baris.aktif ? '1' : '0'} className={inp}><option value="1">Aktif</option><option value="0">Nonaktif (tidak muncul di form surat)</option></select>
        </label>
        <div className="flex gap-3 justify-end mt-2 max-sm:flex-col-reverse max-sm:[&>*]:w-full">
          <button type="button" onClick={onTutup} className={btnO}>Batal</button>
          <button type="submit" disabled={pending} className={btnP + ' disabled:opacity-60'}>{pending ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>, document.body);
}

export default function MasterData({ tab, q, baris, total }: { tab: TabMaster; q: string; baris: Baris[]; total: number }) {
  const r = useRouter(), m = MASTER[tab], formTambah = useRef<HTMLFormElement>(null);
  const [pesan, setPesan] = useState<Hasil | null>(null), [ubah, setUbah] = useState<Baris | null>(null), [hapus, setHapus] = useState<Baris | null>(null);
  const [pendingTambah, mulaiTambah] = useTransition(), [pendingHapus, mulaiHapus] = useTransition();
  const adaKode = m.kolom[0].kode, utama = (b: Baris) => String(b[adaKode ? 'nama' : m.kolom[0].k]);
  const label = (b: Baris) => (adaKode ? `${b.kode} - ${b.nama}` : utama(b));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <section className={card + ' !p-0 overflow-hidden'}>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <nav className="flex gap-1 p-1 rounded-xl bg-well border border-line-soft overflow-x-auto" aria-label="Jenis data">
            {TAB_URUT.map((t) => (
              <Link key={t} href={`/master?tab=${t}`} aria-current={t === tab ? 'page' : undefined}
                className={'px-3.5 py-2 rounded-lg text-sm font-semibold no-underline whitespace-nowrap ' + (t === tab ? 'bg-surface text-ink shadow-sm' : 'text-muted')}>{MASTER[t].judul}</Link>
            ))}
          </nav>
          <form method="get" className="flex-1 min-w-[200px] relative">
            <input type="hidden" name="tab" value={tab} />
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm" aria-hidden="true"></i>
            <input name="q" defaultValue={q} key={tab + q} placeholder={`Cari ${m.cari.join(' atau ')}`} aria-label="Cari" className={inp + ' !mt-0 pl-10 font-normal'} />
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-well"><tr>
              {m.kolom.map((c) => <th key={c.k} className={th}>{c.label.toUpperCase()}</th>)}
              <th className={th}>STATUS</th><th className={th + ' text-right'}>AKSI</th>
            </tr></thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.id} className={b.aktif ? '' : 'text-muted'}>
                  {m.kolom.map((c, i) => <td key={c.k} className={td + (c.kode ? ' font-mono' : i === 0 || (adaKode && c.k === 'nama') ? ' font-bold' : '')}>{String(b[c.k] || '-')}</td>)}
                  <td className={td}><Status aktif={b.aktif} /></td>
                  <td className={td + ' text-right whitespace-nowrap'}>
                    <span className="inline-flex gap-2">
                      <button type="button" onClick={() => setUbah(b)} className={ikonBtn} aria-label={`Ubah ${label(b)}`}><i className="fa-solid fa-pen" aria-hidden="true"></i></button>
                      <button type="button" onClick={() => setHapus(b)} className={ikonBtn + ' text-danger'} aria-label={`Hapus ${label(b)}`}><i className="fa-solid fa-trash" aria-hidden="true"></i></button>
                    </span>
                  </td>
                </tr>
              ))}
              {!baris.length && <tr><td colSpan={m.kolom.length + 2} className="px-4 py-10 text-center text-muted">{q ? `Tidak ada ${m.tunggal} yang cocok dengan "${q}".` : `Belum ada ${m.tunggal}. Tambahkan lewat form di samping.`}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3.5 text-[13px] text-muted">{baris.length ? `Menampilkan ${baris.length} dari ${total} ${m.tunggal}` : `${total} ${m.tunggal} tersimpan`}</div>
      </section>

      <form ref={formTambah} className={card + ' flex flex-col gap-3'} action={(fd) => mulaiTambah(async () => { const h = await simpanMaster(tab, fd); setPesan(h); if (h.ok) { formTambah.current?.reset(); r.refresh(); } })}>
        <div><h2 className="m-0 text-base font-bold">Tambah {m.tunggal}</h2></div>
        {m.kolom.map((c) => (
          <label key={c.k} className={lbl}>{c.label}{c.opsional && <span className="font-normal text-muted"> (opsional)</span>}
            <input name={c.k} required={!c.opsional} maxLength={c.maks} placeholder={c.ph} className={inp + (c.kode ? ' font-mono uppercase' : '')} />
          </label>
        ))}
        <button type="submit" disabled={pendingTambah} className={btnP + ' w-full gap-2 disabled:opacity-60'}><i className="fa-solid fa-plus" aria-hidden="true"></i>{pendingTambah ? 'Menyimpan...' : 'Simpan'}</button>
      </form>

      {ubah && <DialogUbah tab={tab} baris={ubah} onTutup={() => setUbah(null)} onHasil={(h) => { setPesan(h); if (h.ok) r.refresh(); }} />}
      {hapus && (
        <ModalDasar tipe="peringatan" judul={`Hapus ${m.tunggal}?`} pesan={`"${label(hapus)}" akan dihapus permanen. Bila hanya tidak ingin dipakai lagi, nonaktifkan lewat tombol ubah.`} onTutup={() => setHapus(null)}>
          <button type="button" data-awal onClick={() => setHapus(null)} className={btnO}>Batal</button>
          <button type="button" disabled={pendingHapus} className={btnP + ' disabled:opacity-60'}
            onClick={() => mulaiHapus(async () => { const h = await hapusMaster(tab, hapus.id); setHapus(null); setPesan(h); r.refresh(); })}>{pendingHapus ? 'Menghapus...' : 'Hapus'}</button>
        </ModalDasar>
      )}
      <PesanModal pesan={pesan?.pesan} tipe={pesan?.ok ? 'sukses' : 'error'} onTutup={() => setPesan(null)} />
    </div>
  );
}
