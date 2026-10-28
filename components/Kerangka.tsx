'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import HakCipta from './HakCipta';

/**
 * Kerangka halaman: sidebar bisa dibuka/ditutup di semua layar. Di layar lebar (>= lg) ia menyusut/muncul di samping konten, di layar kecil berubah menjadi
 * laci (drawer) dengan tombol menu di layar HP/tablet.
 */
export default function Kerangka({ sidebar, profil, children }: { sidebar: React.ReactNode; profil: React.ReactNode; children: React.ReactNode }) {
  const [buka, setBuka] = useState(false);       // laci (layar < lg)
  const [kolaps, setKolaps] = useState(false);    // sidebar disembunyikan (layar >= lg)
  const p = usePathname();

  // Ingat pilihan buka/tutup sidebar. Default: tertutup di iPad/tablet sentuh, terbuka di desktop.
  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebar-kolaps');
      if (v !== null) setKolaps(v === '1');
      else setKolaps(window.matchMedia('(pointer: coarse) and (max-width: 1366px)').matches);
    } catch { /* abaikan */ }
  }, []);
  const ubahKolaps = (v: boolean) => { setKolaps(v); try { localStorage.setItem('sidebar-kolaps', v ? '1' : '0'); } catch { /* abaikan */ } };
  const klikMenu = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) ubahKolaps(!kolaps);
    else setBuka(true);
  };

  // Tutup laci saat pindah halaman.
  useEffect(() => { setBuka(false); }, [p]);

  // Esc menutup laci; scroll halaman dikunci selama laci terbuka.
  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false); };
    document.addEventListener('keydown', esc);
    const lama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = lama; };
  }, [buka]);

  return (
    <div className="flex min-h-screen">
      {buka && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setBuka(false)} aria-hidden="true" />}

      <aside
        id="menu-utama"
        className={
          'print:hidden bg-surface border-r border-line px-3.5 py-6 flex flex-col gap-1 overflow-y-auto ' +
          'fixed inset-y-0 left-0 z-50 w-[268px] max-w-[85vw] transition-[transform,visibility] duration-200 ' +
          'lg:static lg:z-auto lg:w-[232px] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:visible ' +
          (kolaps ? 'lg:hidden ' : '') +
          (buka ? 'translate-x-0 visible' : '-translate-x-full invisible')
        }
      >
        <button
          type="button"
          onClick={() => setBuka(false)}
          aria-label="Tutup menu"
          className="lg:hidden absolute top-3 right-3 w-11 h-11 rounded-lg flex items-center justify-center text-ink-2 bg-transparent border-0 cursor-pointer hover:bg-canvas"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
        </button>
        {sidebar}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="print:hidden relative z-30 px-4 sm:px-6 lg:px-10 pt-3 lg:pt-5 flex items-center justify-between justify-between gap-3">
          <button
            type="button"
            onClick={klikMenu}
            aria-label="Buka/tutup menu"
            aria-controls="menu-utama"
            aria-expanded={buka || !kolaps}
            className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center bg-surface border border-line text-ink cursor-pointer shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
          </button>
          {profil}
        </header>
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 pt-4 pb-8 flex flex-col gap-5 sm:gap-6">{children}</main>
        <HakCipta className="px-4 pb-5 print:hidden" />
      </div>
    </div>
  );
}
