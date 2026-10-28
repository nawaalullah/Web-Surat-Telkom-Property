'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ItemMenu } from '@/lib/menus';

function Daftar({ menu }: { menu: ItemMenu[] }) {
  const p = usePathname();
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {menu.map((m) => {
        const on = p === m.href || p.startsWith(m.href + '/');
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={on ? 'page' : undefined}
            className={'flex items-center gap-3 h-11 px-3 rounded-[10px] no-underline ' + (on ? 'bg-brand-soft text-brandfg font-bold' : 'text-ink-2 font-semibold hover:bg-canvas')}
          >
            <i className={`fa-solid ${m.ikon} w-[18px] text-center`} aria-hidden="true" />
            <span className="flex-1">{m.teks}</span>
            {!!m.badge && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand text-white text-xs font-bold inline-flex items-center justify-center" aria-label={`${m.badge} surat belum diunggah`}>{m.badge > 99 ? '99+' : m.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ utama, pengaturan }: { utama: ItemMenu[]; pengaturan: ItemMenu[] }) {
  return (
    <>
      <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-widest text-muted">Menu</div>
      <Daftar menu={utama} />
      <div className="px-3 pt-6 pb-1 text-xs font-semibold uppercase tracking-widest text-muted">Pengaturan</div>
      <Daftar menu={pengaturan} />
    </>
  );
}
