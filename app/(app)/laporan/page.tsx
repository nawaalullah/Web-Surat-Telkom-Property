import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { fmtWaktu } from '@/lib/waktu';
import { card, th, td, btnO } from '@/lib/ui';
import { AKSI_KELAS, bacaFilter, logAudit, queryString, ringkasan, suratPerPengirim, type Param } from '@/lib/laporan';
import FilterLaporan from '@/components/FilterLaporan';
import AutoCetak from '@/components/AutoCetak';

export const metadata = { title: 'Laporan & Audit - Arsip Surat Keluar' };
export const dynamic = 'force-dynamic';
const PER_HALAMAN = 15, MAKS_CETAK = 300;

export default async function Page({ searchParams }: { searchParams: Param }) {
  await requireSession();
  const f = bacaFilter(searchParams), cetak = searchParams.cetak === '1';
  const hal = Math.max(1, Number(searchParams.hal) || 1);
  const daftarTahun = Array.from(new Set([bacaFilter({}).tahun, ...(db.prepare('SELECT DISTINCT tahun FROM surat').all() as { tahun: number }[]).map((x) => x.tahun)])).sort((a, b) => b - a);

  const r = ringkasan(f), perUnit = suratPerPengirim(f), maksUnit = Math.max(1, ...perUnit.map((u) => u.n));
  const log = cetak ? logAudit(f, MAKS_CETAK) : logAudit(f, PER_HALAMAN, (hal - 1) * PER_HALAMAN);
  const dari = log.total ? (cetak ? 1 : (hal - 1) * PER_HALAMAN + 1) : 0, sampai = (cetak ? 0 : (hal - 1) * PER_HALAMAN) + log.baris.length;
  const href = (h: number) => '/laporan?' + queryString(f, { hal: String(h) });
  const nav = 'min-h-[40px] px-4 inline-flex items-center rounded-lg border border-line-strong bg-surface text-sm font-bold text-ink no-underline ';
  const kartu = [
    { t: 'Reserved', n: r.reserved, ket: 'nomor terbit, menunggu surat diunggah', titik: 'bg-warn-accent' },
    { t: 'Terarsip', n: r.terarsip, ket: `sepanjang ${f.tahun}`, titik: 'bg-ok-fg' },
    { t: 'Dibatalkan', n: r.dibatalkan, ket: 'nomor dibatalkan', titik: 'bg-muted' },
    { t: 'Belum diunggah', n: r.belum, ket: 'belum ada file surat', titik: 'bg-brand' },
  ];
  const ringkasFilter = [`Tahun ${f.tahun}`, f.status ? f.status : 'Semua status'].join(' · ');
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const dua = (n: number) => String(n).padStart(2, '0');

  const konten = (
      <div className="max-w-[1280px] mx-auto">
        {/* Kop laporan: hanya tampil saat dicetak. Logo di kiri, tanggal cetak di kanan. */}
        <div className="hidden print:flex items-end justify-between gap-4 pb-3 mb-4 border-b-2 border-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="Telkom Property by Telkom Indonesia" className="h-12 w-auto" />
          <div className="text-right text-xs leading-snug text-muted"><div className="font-bold text-ink-2">Arsip Surat Keluar</div><div>Dicetak {tanggal}</div></div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted print:hidden">{tanggal}</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Laporan &amp; Audit</h1>
            <p className="mt-1 text-sm text-muted">Rekap surat keluar dan jejak perubahan data.</p>
            <p className="mt-1 text-xs text-muted hidden print:block">{ringkasFilter}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <a href={'/api/laporan/excel?' + queryString(f)} className={btnO + ' gap-2'}><i className="fa-solid fa-file-excel text-ok-fg" aria-hidden="true"></i>Excel</a>
            <a href={'/laporan?' + queryString(f, { cetak: '1' })} target="_blank" rel="noopener" className={btnO + ' gap-2'}><i className="fa-solid fa-file-pdf" aria-hidden="true"></i>PDF</a>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <FilterLaporan tahun={f.tahun} status={f.status} daftarTahun={daftarTahun} />

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:break-inside-avoid jaga-utuh" aria-label="Ringkasan">
            {kartu.map((k) => (
              <div key={k.t} className={card}>
                <div className="flex items-center gap-2 text-[13px] font-bold"><span className={'w-2 h-2 rounded-full ' + k.titik} aria-hidden="true"></span>{k.t}</div>
                <div className="mt-2 text-4xl font-extrabold tracking-tight">{dua(k.n)}</div>
                <div className="mt-1 text-[13px] text-muted">{k.ket}</div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start print:block">
            <section className={card + ' !p-0 overflow-hidden print:overflow-visible'}>
              <h2 className="m-0 px-5 py-4 text-base font-bold flex items-center gap-2.5"><i className="fa-solid fa-clock-rotate-left text-brandfg" aria-hidden="true"></i>Log audit</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[640px]">
                  <thead className="bg-well"><tr>{['WAKTU', 'AKSI', 'NO NASKAH', 'PERIHAL'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {log.baris.map((b) => (
                      <tr key={b.id}>
                        <td className={td + ' whitespace-nowrap'}>{fmtWaktu(b.waktu)}</td>
                        <td className={td}><span className={'inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ' + (AKSI_KELAS[b.aksi] ?? 'bg-inactive text-muted')}>{b.aksi}</span></td>
                        <td className={td + ' font-mono text-xs'}><Link href={`/arsip/${b.surat_id}`} className="text-ink no-underline hover:underline">{b.no_naskah}</Link></td>
                        <td className={td}>{b.perihal}</td>
                      </tr>
                    ))}
                    {!log.baris.length && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted">Belum ada aktivitas surat untuk filter ini.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] text-muted">{log.total ? `Menampilkan ${dari}-${sampai} dari ${log.total} aktivitas` : '0 aktivitas'}{cetak && log.total > MAKS_CETAK ? ` (cetak dibatasi ${MAKS_CETAK} terbaru)` : ''}</span>
                {!cetak && (
                  <div className="flex gap-2 print:hidden">
                    {hal > 1 ? <Link href={href(hal - 1)} className={nav}>‹ Sebelumnya</Link> : <span className={nav + 'opacity-50'}>‹ Sebelumnya</span>}
                    {sampai < log.total ? <Link href={href(hal + 1)} className={nav}>Berikutnya ›</Link> : <span className={nav + 'opacity-50'}>Berikutnya ›</span>}
                  </div>
                )}
              </div>
            </section>

            <section className={card + ' print:mt-4 print:break-inside-avoid jaga-utuh'} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <h2 className="m-0 text-base font-bold">Surat per pengirim</h2>
              <div className="mt-4 flex flex-col gap-4">
                {perUnit.map((u) => (
                  <div key={u.nama}>
                    <div className="flex justify-between gap-3 text-[13px] font-bold"><span className="truncate">{u.nama}</span><span>{u.n}</span></div>
                    <div className="mt-1.5 h-2 rounded-full bg-line-soft overflow-hidden" role="presentation"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (u.n / maksUnit) * 100)}%` }} /></div>
                  </div>
                ))}
                {!perUnit.length && <div className="text-sm text-muted">Belum ada surat untuk filter ini.</div>}
              </div>
            </section>
          </div>
        </div>
      </div>
  );

  // Saat cetak, margin halaman dibuat lewat thead/tfoot yang berulang di tiap halaman (@page margin 0 menghilangkan URL & tanggal bawaan browser).
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6 print:p-0">
      {cetak && <AutoCetak />}
      {cetak ? (
        <table className="w-full">
          <thead><tr><td className="h-[14mm] p-0" /></tr></thead>
          <tbody><tr><td className="p-0 px-[13mm] align-top">{konten}</td></tr></tbody>
          <tfoot><tr><td className="h-[14mm] p-0" /></tr></tfoot>
        </table>
      ) : konten}
    </main>
  );
}
