'use client';
import { useEffect, useRef, useState } from 'react';
import { daftarTema, idTemaValid, KUNCI_TEMA, TEMA_DEFAULT } from '@/lib/tema';

/** Pratinjau mini. Atribut data-tema membuat variabel warna tema itu berlaku hanya di dalam kotak ini. */
function Pratinjau({ id }: { id: string }) {
  return (
    <span data-tema={id} aria-hidden="true" className="relative block h-[58px] rounded-lg overflow-hidden border border-line bg-canvas">
      <span className="absolute inset-y-0 left-0 w-[30%] bg-surface border-r border-line p-1.5 flex flex-col gap-1">
        <span className="block h-2 rounded bg-brand" />
        <span className="block h-2 rounded bg-line-strong" />
        <span className="block h-2 rounded bg-line-strong w-3/4" />
      </span>
      <span className="absolute left-[36%] right-2 top-2 bottom-2 flex flex-col gap-1.5">
        <span className="block rounded bg-surface border border-line p-1.5 flex flex-col gap-1">
          <span className="block h-1.5 w-2/3 rounded bg-ink" />
          <span className="block h-1.5 w-full rounded bg-muted/50" />
        </span>
        <span className="flex gap-1.5 items-center">
          <span className="block h-3 w-8 rounded bg-brand" />
          <span className="block h-3 w-6 rounded bg-ok-bg border border-ok-line" />
        </span>
      </span>
    </span>
  );
}

export default function TemaMenu() {
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState<string>(TEMA_DEFAULT);
  const ref = useRef<HTMLDivElement>(null);

  // Baca tema yang sudah dipasang oleh skrip awal di <head>, dan ikuti perubahan dari tab lain.
  useEffect(() => {
    const baca = () => {
      const t = document.documentElement.getAttribute('data-tema');
      setAktif(idTemaValid(t) ? t : TEMA_DEFAULT);
    };
    baca();
    const dariTabLain = (e: StorageEvent) => {
      if (e.key !== KUNCI_TEMA) return;
      if (idTemaValid(e.newValue)) document.documentElement.setAttribute('data-tema', e.newValue);
      else document.documentElement.removeAttribute('data-tema');
      baca();
    };
    window.addEventListener('storage', dariTabLain);
    return () => window.removeEventListener('storage', dariTabLain);
  }, []);

  useEffect(() => {
    if (!buka) return;
    const klik = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setBuka(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false); };
    document.addEventListener('mousedown', klik);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', klik); document.removeEventListener('keydown', esc); };
  }, [buka]);

  const pilih = (id: string) => {
    document.documentElement.setAttribute('data-tema', id);
    setAktif(id);
    try { localStorage.setItem(KUNCI_TEMA, id); } catch { /* abaikan: tetap berlaku selama halaman terbuka */ }
  };

  const kelompok = ['Telkom', 'Tailwind'] as const;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-haspopup="dialog"
        aria-expanded={buka}
        aria-label="Ganti tema tampilan"
        title="Tema tampilan"
        className="w-11 h-11 rounded-full flex items-center justify-center bg-surface border border-line text-brandfg shadow-sm cursor-pointer hover:border-line-strong transition-colors"
      >
        <i className="fa-solid fa-palette text-[17px]" aria-hidden="true"></i>
      </button>

      {buka && (
        <div
          role="dialog"
          aria-label="Pilih tema tampilan"
          className="fixed left-4 right-4 top-[68px] max-h-[calc(100dvh-84px)] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] sm:max-h-[calc(100dvh-90px)] bg-surface border border-line rounded-xl shadow-lg z-50 p-4"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-lg bg-brand-soft text-brandfg flex items-center justify-center"><i className="fa-solid fa-palette" aria-hidden="true"></i></span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink">Tema tampilan</div>
              <div className="text-[11px] text-muted">Tersimpan di browser ini</div>
            </div>
          </div>

          {kelompok.map((g) => (
            <div key={g} className="mb-3 last:mb-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted mb-2">{g === 'Telkom' ? 'Telkom Property' : 'Warna Lainnya'}</div>
              <div role="radiogroup" aria-label={g} className="grid grid-cols-2 gap-2.5">
                {daftarTema.filter((t) => t.grup === g).map((t) => {
                  const on = aktif === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => pilih(t.id)}
                      className={'text-left p-2 rounded-xl bg-surface cursor-pointer border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' + (on ? 'border-brand' : 'border-line hover:border-line-strong')}
                    >
                      <Pratinjau id={t.id} />
                      <span className="flex items-center justify-between gap-1.5 mt-2 px-0.5">
                        <span className="min-w-0 leading-tight">
                          <span className="block text-[13px] font-bold text-ink truncate">{t.nama}</span>
                          <span className="block text-[11px] text-muted truncate"><i className={'fa-solid ' + (t.mode === 'Gelap' ? 'fa-moon' : 'fa-sun') + ' mr-1'} aria-hidden="true"></i>{t.mode}</span>
                        </span>
                        <span className={'w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] ' + (on ? 'bg-brand text-white' : 'border border-line-strong text-transparent')} aria-hidden="true"><i className="fa-solid fa-check"></i></span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
