'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Props = { nama: string; jabatan: string; foto?: string; hrefProfil: string; keluar: () => void | Promise<void> };

function inisial(nama: string) {
  const k = nama.trim().split(/\s+/).filter(Boolean);
  return ((k[0]?.[0] || '') + (k.length > 1 ? k[k.length - 1][0] : '')).toUpperCase() || '?';
}

export default function ProfilMenu({ nama, jabatan, foto, hrefProfil, keluar }: Props) {
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const klik = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setBuka(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false); };
    document.addEventListener('mousedown', klik);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', klik); document.removeEventListener('keydown', esc); };
  }, [buka]);

  const avatar = (ukuran: string) => foto ? (
    <img src={`/api/profil/foto?v=${foto}`} alt="" className={`${ukuran} rounded-full object-cover bg-well shrink-0`} aria-hidden="true" />
  ) : (
    <span className={`${ukuran} rounded-full bg-brand text-white font-bold flex items-center justify-center shrink-0`} aria-hidden="true">{inisial(nama)}</span>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-haspopup="menu"
        aria-expanded={buka}
        className="flex items-center gap-2.5 max-w-full pl-1.5 pr-3 py-1.5 min-h-[44px] rounded-full bg-surface border border-line shadow-sm cursor-pointer hover:border-line-strong transition-colors"
      >
        {avatar('w-9 h-9 text-[13px]')}
        <span className="min-w-0 text-left leading-tight">
          <span className="block text-[13px] font-bold text-ink truncate max-w-[110px] min-[400px]:max-w-[170px] sm:max-w-[240px]">{nama}</span>
          <span className="block text-[11px] text-muted truncate max-w-[110px] min-[400px]:max-w-[170px] sm:max-w-[240px]">{jabatan}</span>
        </span>
        <svg className={'w-4 h-4 shrink-0 text-muted transition-transform ' + (buka ? 'rotate-180' : '')} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
      </button>

      {buka && (
        <div role="menu" className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center gap-3 p-4">
            {avatar('w-11 h-11 text-sm')}
            <div className="min-w-0">
              <div className="text-sm font-bold text-ink truncate">{nama}</div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-soft text-brandfg text-[11px] font-bold">{jabatan}</span>
            </div>
          </div>
          <div className="border-t border-line-soft p-1.5 pb-0">
            <Link href={hrefProfil} role="menuitem" onClick={() => setBuka(false)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-ink no-underline hover:bg-brand-soft">
              <i className="fa-solid fa-user-pen w-4 text-center text-muted" aria-hidden="true"></i>
              Profil Saya
            </Link>
          </div>
          <form action={keluar} className="p-1.5">
            <button type="submit" role="menuitem" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-brandfg bg-transparent border-0 cursor-pointer text-left hover:bg-brand-soft">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h3M13 14l4-4-4-4M17 10H8" /></svg>
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
