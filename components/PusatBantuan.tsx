'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KUNCI_PAHAM, LANGKAH, STATUS, TANYA } from '@/lib/bantuan';
import { btnP, pillCls } from '@/lib/ui';

type Tab = 'alur' | 'status' | 'tanya';
const TAB: { id: Tab; teks: string; ikon: string }[] = [
  { id: 'alur', teks: 'Alur', ikon: 'fa-route' },
  { id: 'status', teks: 'Status', ikon: 'fa-signal' },
  { id: 'tanya', teks: 'Tanya Jawab', ikon: 'fa-comments' },
];
const cocok = (teks: string, q: string) => q.split(/\s+/).filter(Boolean).every((k) => teks.toLowerCase().includes(k));

/** Isi bantuan: pencarian, tab Alur / Status / Tanya Jawab, dan kemajuan belajar (disimpan di browser ini). */
export function IsiBantuan({ belum = 0, onNavigasi, fokusCari = false, tanpaKepala = false }: { belum?: number; onNavigasi?: () => void; fokusCari?: boolean; tanpaKepala?: boolean }) {
  const [tab, setTab] = useState<Tab>('alur');
  const [q, setQ] = useState('');
  const [paham, setPaham] = useState<string[]>([]);
  const [buka, setBuka] = useState<string>(LANGKAH[0].id);
  const [tanya, setTanya] = useState<number | null>(null);
  const cari = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KUNCI_PAHAM) || '[]');
      if (Array.isArray(d)) {
        const ok = d.filter((x) => LANGKAH.some((l) => l.id === x));
        setPaham(ok);
        const next = LANGKAH.find((l) => !ok.includes(l.id));
        if (next) setBuka(next.id);
      }
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => { if (fokusCari) cari.current?.focus(); }, [fokusCari]);

  const tandai = (id: string) => {
    const baru = paham.includes(id) ? paham.filter((x) => x !== id) : [...paham, id];
    setPaham(baru);
    try { localStorage.setItem(KUNCI_PAHAM, JSON.stringify(baru)); } catch { /* abaikan */ }
    if (!paham.includes(id)) {
      const next = LANGKAH.find((l) => !baru.includes(l.id));
      if (next) setBuka(next.id);
    }
  };

  const kata = q.trim().toLowerCase();
  const langkah = useMemo(() => LANGKAH.filter((l) => !kata || cocok(`${l.judul} ${l.ringkas} ${l.isi} ${l.kata} ${(l.butir || []).join(' ')}`, kata)), [kata]);
  const status = useMemo(() => STATUS.filter((s) => !kata || cocok(`${s.nama} ${s.arti} ${s.lanjut}`, kata)), [kata]);
  const faq = useMemo(() => TANYA.map((x, i) => ({ ...x, i })).filter((x) => !kata || cocok(`${x.t} ${x.j}`, kata)), [kata]);
  const persen = Math.round((paham.length / LANGKAH.length) * 100);
  const jumlah: Record<Tab, number> = { alur: langkah.length, status: status.length, tanya: faq.length };
  const kosong = kata && !langkah.length && !status.length && !faq.length;

  return (
    <div className="flex flex-col min-h-0">
      <div className={tanpaKepala ? '' : 'px-5 pt-4 pb-4 bg-brand-soft'}>
        <label className="relative block">
          <span className="sr-only">Cari bantuan</span>
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm" aria-hidden="true"></i>
          <input
            ref={cari}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari bantuan, misalnya: unggah, batalkan, excel..."
            className="w-full min-h-[48px] rounded-full border border-brand bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-faint focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand"
          />
        </label>
        <div role="tablist" aria-label="Bagian bantuan" className="mt-3 grid grid-cols-3 gap-2.5">
          {TAB.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => setTab(t.id)}
                className={'min-h-[44px] rounded-full px-2 inline-flex items-center justify-center gap-1.5 text-[13px] font-bold border cursor-pointer transition-colors ' + (on ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line hover:border-line-strong')}
              >
                <i className={'fa-solid ' + t.ikon + ' text-xs'} aria-hidden="true"></i>{t.teks}
                {!!kata && <span className={'text-[11px] ' + (on ? 'text-white/80' : 'text-muted')}>({jumlah[t.id]})</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {kosong && (
          <div className="rounded-xl border border-dashed border-line-dash bg-well p-6 text-center text-sm text-muted">
            <i className="fa-regular fa-face-frown text-2xl mb-2 block" aria-hidden="true"></i>
            Tidak ada hasil untuk &ldquo;{q}&rdquo;. Coba kata lain, misalnya <button type="button" onClick={() => setQ('unggah')} className="bg-transparent border-0 p-0 cursor-pointer font-bold text-brandfg">unggah</button>.
          </div>
        )}

        {!kosong && tab === 'alur' && (
          <>
            {!kata && (
              <div>
                <div className="flex items-center justify-between text-[13px]"><span className="text-muted">Kemajuan belajar</span><span className="font-bold text-ink-2">{persen}%</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-line-soft overflow-hidden" role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100} aria-label="Kemajuan belajar">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: persen + '%' }} />
                </div>
              </div>
            )}
            {langkah.map((l) => {
              const no = LANGKAH.indexOf(l) + 1, on = buka === l.id, selesai = paham.includes(l.id);
              return (
                <section key={l.id} className={'rounded-xl border transition-colors ' + (on ? 'border-brand bg-surface' : 'border-line bg-surface hover:border-line-strong')}>
                  <button type="button" aria-expanded={on} aria-controls={'b-' + l.id} onClick={() => setBuka(on ? '' : l.id)} className="w-full flex items-center gap-3 p-3.5 bg-transparent border-0 cursor-pointer text-left text-ink">
                    <span className={'shrink-0 w-11 h-11 rounded-full inline-flex items-center justify-center text-lg ' + (selesai ? 'bg-ok-bg text-ok-fg' : on ? 'bg-brand text-white' : 'bg-well text-ink-2 border border-line')}>
                      <i className={'fa-solid ' + (selesai ? 'fa-check' : l.ikon)} aria-hidden="true"></i>
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block text-xs text-muted">Langkah {no}</span>
                      <span className="block mt-0.5 text-base font-bold">{l.judul}</span>
                    </span>
                    <i className={'fa-solid fa-chevron-down text-xs text-muted transition-transform ' + (on ? 'rotate-180' : '')} aria-hidden="true"></i>
                  </button>
                  {on && (
                    <div id={'b-' + l.id} className="px-4 pb-4 -mt-0.5">
                      <p className="m-0 text-sm leading-relaxed text-ink-2">{l.isi}</p>
                      {!!l.butir?.length && (
                        <ul className="mt-2.5 mb-0 pl-0 list-none flex flex-col gap-1.5">
                          {l.butir.map((b) => <li key={b} className="flex gap-2 text-[13px] leading-snug text-muted"><i className="fa-solid fa-circle-info mt-0.5 text-brandfg" aria-hidden="true"></i><span>{b}</span></li>)}
                        </ul>
                      )}
                      <div className="mt-3.5 flex flex-wrap gap-2.5">
                        <Link href={l.href} onClick={onNavigasi} className={btnP + ' gap-2 !min-h-[40px] !px-4 !text-[13px] !rounded-full'}>{l.aksi}<i className="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i></Link>
                        <button type="button" onClick={() => tandai(l.id)} aria-pressed={selesai} className={'min-h-[40px] px-4 rounded-full inline-flex items-center gap-2 text-[13px] font-bold border cursor-pointer ' + (selesai ? 'bg-ok-bg text-ok-fg border-ok-line' : 'bg-surface text-ink border-line-strong hover:bg-well')}>
                          <i className={'fa-' + (selesai ? 'solid fa-circle-check' : 'regular fa-circle') + ' text-sm'} aria-hidden="true"></i>{selesai ? 'Sudah paham' : 'Tandai paham'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}

        {!kosong && tab === 'status' && (
          <>
            <p className="m-0 text-[13px] text-muted">Setiap nomor surat melewati status berikut. Surat Reserved yang belum diunggah saat ini: <Link href="/belum-diunggah" onClick={onNavigasi} className="font-bold text-brandfg no-underline">{belum} surat</Link>.</p>
            {status.map((s) => (
              <div key={s.id} className="rounded-xl border border-line bg-surface p-4">
                <span className={pillCls + s.kelas}>{s.nama}</span>
                <p className="m-0 mt-2 text-sm leading-relaxed text-ink">{s.arti}</p>
                <p className="m-0 mt-1.5 text-[13px] leading-snug text-muted"><i className="fa-solid fa-arrow-right text-[11px] mr-1.5" aria-hidden="true"></i>{s.lanjut}</p>
              </div>
            ))}
            {!kata && (
              <div className="rounded-xl bg-well border border-line-soft p-4 text-[13px] text-muted flex items-center gap-2.5 flex-wrap font-semibold">
                <span className={pillCls + STATUS[0].kelas}>Reserved</span><i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true"></i>
                <span className={pillCls + STATUS[1].kelas}>Terarsip</span><span className="text-faint">atau</span>
                <span className={pillCls + STATUS[2].kelas}>Dibatalkan</span>
              </div>
            )}
          </>
        )}

        {!kosong && tab === 'tanya' && faq.map((x) => {
          const on = tanya === x.i;
          return (
            <div key={x.i} className="rounded-xl border border-line bg-surface">
              <button type="button" aria-expanded={on} onClick={() => setTanya(on ? null : x.i)} className="w-full flex items-start gap-3 p-3.5 bg-transparent border-0 cursor-pointer text-left text-ink">
                <span className="flex-1 text-sm font-bold leading-snug">{x.t}</span>
                <i className={'fa-solid fa-chevron-down text-xs text-muted mt-1 transition-transform ' + (on ? 'rotate-180' : '')} aria-hidden="true"></i>
              </button>
              {on && <p className="m-0 px-3.5 pb-3.5 text-sm leading-relaxed text-ink-2">{x.j}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Tombol "?" di bar atas + panel Pusat Bantuan di sisi kanan. Tombol keyboard "?" membukanya, Esc menutup. */
export default function TombolBantuan({ belum }: { belum: number }) {
  const [buka, setBuka] = useState(false);
  const [siap, setSiap] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);
  const p = usePathname();
  useEffect(() => setSiap(true), []);
  useEffect(() => { setBuka(false); }, [p]);

  useEffect(() => {
    const kunci = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && buka) { setBuka(false); return; }
      const t = e.target as HTMLElement | null;
      const mengetik = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === '?' && !mengetik && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setBuka((b) => !b); }
    };
    document.addEventListener('keydown', kunci);
    return () => document.removeEventListener('keydown', kunci);
  }, [buka]);

  useEffect(() => {
    if (!buka) return;
    const lama = document.body.style.overflow, asal = tombol.current;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = lama; asal?.focus(); };
  }, [buka]);

  return (
    <>
      <button
        ref={tombol}
        type="button"
        onClick={() => setBuka(true)}
        aria-haspopup="dialog"
        aria-expanded={buka}
        aria-label="Bantuan"
        title="Bantuan (tekan ?)"
        className="w-11 h-11 rounded-full bg-surface border border-line text-brandfg flex items-center justify-center shadow-sm cursor-pointer hover:border-line-strong transition-colors shrink-0"
      >
        <i className="fa-solid fa-circle-question text-xl" aria-hidden="true" />
      </button>

      {siap && buka && createPortal(
        <div className="fixed inset-0 z-[950] bg-ink/55 print:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setBuka(false); }}>
          <aside role="dialog" aria-modal="true" aria-label="Pusat Bantuan" className="absolute right-0 inset-y-0 w-[484px] max-w-full flex flex-col bg-canvas text-ink font-sans border-l border-line shadow-[-12px_0_32px_rgba(0,0,0,.25)]">
            <div className="flex items-center gap-3 px-5 pt-5 pb-3 bg-brand-soft">
              <span className="w-12 h-12 rounded-xl bg-surface border border-line text-brandfg inline-flex items-center justify-center text-2xl shrink-0"><i className="fa-solid fa-life-ring" aria-hidden="true"></i></span>
              <div className="flex-1 min-w-0 leading-tight">
                <h2 className="m-0 text-xl font-extrabold">Pusat Bantuan</h2>
                <div className="text-[13px] text-muted mt-0.5">Mau ngapain hari ini?</div>
              </div>
              <button type="button" onClick={() => setBuka(false)} aria-label="Tutup bantuan" className="w-11 h-11 rounded-lg bg-transparent border-0 cursor-pointer text-ink-2 inline-flex items-center justify-center hover:bg-surface">
                <i className="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <IsiBantuan belum={belum} onNavigasi={() => setBuka(false)} fokusCari />
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-line bg-surface text-xs text-muted">
              <span>Tekan <kbd className="mx-0.5 px-1.5 py-0.5 rounded border border-line-strong bg-well font-mono text-ink-2">?</kbd> kapan saja untuk membuka bantuan</span>
              <span className="shrink-0"><kbd className="mx-0.5 px-1.5 py-0.5 rounded border border-line-strong bg-well font-mono text-ink-2">Esc</kbd> tutup</span>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
