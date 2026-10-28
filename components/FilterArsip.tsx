'use client';
import { useRouter } from 'next/navigation';
import { inp } from '@/lib/ui';

const TAB = [['semua', 'Semua'], ['belum', 'Belum diunggah'], ['sudah', 'Sudah diunggah']] as const;

/** Tab status, pencarian, dan pilihan tahun untuk daftar arsip (parameter disimpan di URL). */
export default function FilterArsip({ status, q, tahun, daftarTahun }: { status: string; q: string; tahun: number; daftarTahun: number[] }) {
  const r = useRouter();
  const ke = (o: Record<string, string>) => {
    const p = new URLSearchParams({ status, tahun: String(tahun), ...(q ? { q } : {}), ...o });
    if (!p.get('q')) p.delete('q'); if (p.get('status') === 'semua') p.delete('status');
    r.push('/arsip' + (p.toString() ? '?' + p : ''));
  };
  return (
    <div className="p-4 flex flex-wrap items-center gap-3">
      <div role="tablist" className="flex gap-1 p-1 rounded-xl bg-well border border-line-soft">
        {TAB.map(([k, t]) => <button key={k} role="tab" aria-selected={status === k} type="button" onClick={() => ke({ status: k })}
          className={'px-3.5 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer whitespace-nowrap ' + (status === k ? 'bg-surface text-ink shadow-sm' : 'bg-transparent text-muted')}>{t}</button>)}
      </div>
      <form className="flex-1 min-w-[220px] relative" onSubmit={(e) => { e.preventDefault(); ke({ q: String(new FormData(e.currentTarget).get('q') || '').trim() }); }}>
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm" aria-hidden="true"></i>
        <input name="q" defaultValue={q} key={q} aria-label="Cari surat" placeholder="Cari no. agenda, no. naskah, perihal, tujuan" className={inp + ' !mt-0 pl-10 font-normal'} />
      </form>
      <select aria-label="Tahun" value={tahun} onChange={(e) => ke({ tahun: e.target.value })} className={inp + ' !mt-0 !w-auto'}>
        {daftarTahun.map((t) => <option key={t} value={t}>Tahun {t}</option>)}
      </select>
    </div>
  );
}
