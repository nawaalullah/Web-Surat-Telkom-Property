import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPengaturan, tahunSekarang } from '@/lib/pengaturan';
import { STATUS, ukuranTeks, type Surat } from '@/lib/surat';
import { fmtTanggal } from '@/lib/waktu';
import { card, th, td, btnP } from '@/lib/ui';
import FilterArsip from '@/components/FilterArsip';
import UnggahSurat from '@/components/UnggahSurat';
import BatalkanNomor from '@/components/BatalkanNomor';

export const metadata = { title: 'Arsip Surat Keluar - Arsip Surat Keluar' };
export const dynamic = 'force-dynamic';
const PER_HALAMAN = 10;

export default async function Page({ searchParams }: { searchParams: { status?: string; q?: string; tahun?: string; hal?: string } }) {
  await requireSession();
  const set = getPengaturan(), aturan = { maksMb: set.maks_mb, pdf: set.tipe_pdf, docx: set.tipe_docx, wajib: set.wajib_unggah };
  const status = ['belum', 'sudah'].includes(searchParams.status || '') ? searchParams.status! : 'semua';
  const q = (searchParams.q || '').trim().slice(0, 80);
  const daftarTahun = Array.from(new Set([tahunSekarang(), ...(db.prepare('SELECT DISTINCT tahun FROM surat').all() as { tahun: number }[]).map((x) => x.tahun)])).sort((a, b) => b - a);
  const tahun = daftarTahun.includes(Number(searchParams.tahun)) ? Number(searchParams.tahun) : daftarTahun[0];

  const kond = ['s.tahun = ?'], arg: (string | number)[] = [tahun];
  if (status === 'belum') kond.push("s.status = 'reserved'");
  if (status === 'sudah') kond.push("s.status = 'terarsip'");
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (x) => '\\' + x)}%`;
    kond.push("(s.no_naskah LIKE ? ESCAPE '\\' OR CAST(s.agenda AS TEXT) = ? OR s.perihal LIKE ? ESCAPE '\\' OR s.kepada LIKE ? ESCAPE '\\' OR s.alamat LIKE ? ESCAPE '\\' OR s.dari LIKE ? ESCAPE '\\')");
    arg.push(like, q, like, like, like, like);
  }
  const where = kond.join(' AND ');
  const total = (db.prepare(`SELECT COUNT(*) n FROM surat s WHERE ${where}`).get(...arg) as { n: number }).n;
  const halaman = Math.min(Math.max(1, Number(searchParams.hal) || 1), Math.max(1, Math.ceil(total / PER_HALAMAN)));
  const baris = db.prepare(`SELECT s.* FROM surat s WHERE ${where} ORDER BY s.tanggal DESC, s.no_urut DESC LIMIT ? OFFSET ?`).all(...arg, PER_HALAMAN, (halaman - 1) * PER_HALAMAN) as Surat[];
  const dari = total ? (halaman - 1) * PER_HALAMAN + 1 : 0, sampai = (halaman - 1) * PER_HALAMAN + baris.length;
  const href = (h: number) => '/arsip?' + new URLSearchParams({ ...(status !== 'semua' ? { status } : {}), ...(q ? { q } : {}), tahun: String(tahun), hal: String(h) });
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const nav = 'min-h-[40px] px-4 inline-flex items-center rounded-lg border border-line-strong bg-surface text-sm font-bold text-ink no-underline ';

  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">{tanggal}</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Arsip Surat Keluar</h1>
            <p className="mt-1 text-sm text-muted">Buku agenda surat keluar. Unggah salinan surat di kolom paling kanan (PDF atau DOCX, maks. {set.maks_mb} MB).</p>
          </div>
          <Link href="/catat" className={btnP + ' gap-2'}><i className="fa-solid fa-plus" aria-hidden="true"></i>Catat Surat Baru</Link>
        </div>

        <section className={card + ' !p-0 overflow-hidden mt-6'}>
          <FilterArsip status={status} q={q} tahun={tahun} daftarTahun={daftarTahun} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[1040px]">
              <thead className="bg-well"><tr>{['NO', 'TANGGAL', 'NO AGENDA', 'DARI', 'KEPADA - ALAMAT', 'NO NASKAH', 'PERIHAL', 'UNGGAH SURAT'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {baris.map((b) => {
                  const batal = b.status === 'dibatalkan';
                  return (
                    <tr key={b.id} className={batal ? 'text-muted' : ''}>
                      <td className={td}>{b.no_urut}</td>
                      <td className={td + ' whitespace-nowrap'}>{fmtTanggal(b.tanggal)}</td>
                      <td className={td + ' font-mono text-xs'}>{b.agenda}</td>
                      <td className={td}>{b.dari}</td>
                      <td className={td}><div className="font-bold">{b.kepada}</div>{b.alamat && <div className="text-xs text-muted">{b.alamat}</div>}</td>
                      <td className={td + ' font-mono text-xs'}><Link href={`/arsip/${b.id}`} className={'text-ink ' + (batal ? 'line-through' : 'no-underline hover:underline')}>{b.no_naskah}</Link></td>
                      <td className={td}><Link href={`/arsip/${b.id}`} className="text-ink no-underline hover:underline">{b.perihal}</Link>{b.sifat !== 'biasa' && <span className="ml-2 text-[11px] font-bold uppercase text-brandfg">{b.sifat}</span>}</td>
                      <td className={td}>
                        {batal ? <span className={'inline-block px-2.5 py-1 rounded-full text-xs font-bold ' + STATUS.dibatalkan.kelas}>Dibatalkan</span>
                          : b.status === 'reserved' ? <div className="flex items-center gap-2"><UnggahSurat id={b.id} noNaskah={b.no_naskah} perihal={b.perihal} status="reserved" aturan={aturan} /><BatalkanNomor id={b.id} noNaskah={b.no_naskah} /></div>
                          : (
                            <div className="flex items-center gap-2">
                              {b.file
                                ? <a href={`/api/surat/${b.id}/file`} target="_blank" rel="noopener" className="min-w-0 max-w-[170px] rounded-lg bg-ok-bg text-ok-fg px-2.5 py-1.5 no-underline"><div className="text-[13px] font-bold truncate">{b.file_nama}</div><div className="text-[11px]">{ukuranTeks(b.file_ukuran)}</div></a>
                                : <span className="rounded-lg bg-ok-bg text-ok-fg px-2.5 py-1.5 text-[13px] font-bold">Terarsip</span>}
                              <UnggahSurat id={b.id} noNaskah={b.no_naskah} perihal={b.perihal} status="terarsip" aturan={aturan} varian="ikon" />
                              <BatalkanNomor id={b.id} noNaskah={b.no_naskah} />
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
                {!baris.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">{q || status !== 'semua' ? 'Tidak ada surat yang cocok dengan filter ini.' : `Belum ada surat pada tahun ${tahun}. Mulai dengan Catat Surat Baru.`}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] text-muted">{total ? `Menampilkan ${dari}-${sampai} dari ${total} surat` : '0 surat'}</span>
            <div className="flex gap-2">
              {halaman > 1 ? <Link href={href(halaman - 1)} className={nav}>‹ Sebelumnya</Link> : <span className={nav + 'opacity-50'}>‹ Sebelumnya</span>}
              {sampai < total ? <Link href={href(halaman + 1)} className={nav}>Berikutnya ›</Link> : <span className={nav + 'opacity-50'}>Berikutnya ›</span>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
