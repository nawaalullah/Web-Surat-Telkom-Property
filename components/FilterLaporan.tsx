'use client';
import { useRouter } from 'next/navigation';
import { inp, lbl } from '@/lib/ui';

/** Pilihan periode dan status; parameter disimpan di URL agar bisa dibagikan dan diekspor. */
export default function FilterLaporan({ tahun, status, daftarTahun }: { tahun: number; status: string; daftarTahun: number[] }) {
  const r = useRouter();
  const ke = (o: Record<string, string>) => {
    const p = new URLSearchParams({ tahun: String(tahun), status, ...o });
    if (!p.get('status')) p.delete('status');
    r.push('/laporan?' + p);
  };
  return (
    <section className="bg-surface border border-line rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
      <label className={lbl}>Periode
        <select value={tahun} onChange={(e) => ke({ tahun: e.target.value })} className={inp}>{daftarTahun.map((t) => <option key={t} value={t}>Tahun {t}</option>)}</select>
      </label>
      <label className={lbl}>Status
        <select value={status} onChange={(e) => ke({ status: e.target.value })} className={inp}>
          <option value="">Semua status</option><option value="reserved">Reserved</option><option value="terarsip">Terarsip</option><option value="dibatalkan">Dibatalkan</option>
        </select>
      </label>
    </section>
  );
}
