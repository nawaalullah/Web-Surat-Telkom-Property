import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPengaturan } from '@/lib/pengaturan';
import type { Surat } from '@/lib/surat';
import { fmtTanggal, umurHari } from '@/lib/waktu';
import { card, th, td } from '@/lib/ui';
import UnggahSurat from '@/components/UnggahSurat';

export const metadata = { title: 'Belum Diunggah - Arsip Surat Keluar' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireSession();
  const set = getPengaturan(), aturan = { maksMb: set.maks_mb, pdf: set.tipe_pdf, docx: set.tipe_docx, wajib: set.wajib_unggah };
  const baris = db.prepare("SELECT * FROM surat WHERE status = 'reserved' ORDER BY dibuat_at ASC, id ASC").all() as Surat[];
  const terlambat = (b: Surat) => set.ingatkan && umurHari(b.dibuat_at) >= set.ingatkan_hari;
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">{tanggal}</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Belum Diunggah</h1>
        <p className="mt-1 text-sm text-muted">Surat yang nomornya sudah terbit tetapi file suratnya belum diunggah.{set.ingatkan && ` Ditandai terlambat setelah ${set.ingatkan_hari} hari.`}</p>
        <section className={card + ' !p-0 overflow-hidden mt-6'}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[820px]">
              <thead className="bg-well"><tr>{['TANGGAL', 'NO NASKAH', 'PERIHAL', 'KEPADA', 'UMUR', 'UNGGAH SURAT'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {baris.map((b) => {
                  const hari = umurHari(b.dibuat_at);
                  return (
                    <tr key={b.id}>
                      <td className={td + ' whitespace-nowrap'}>{fmtTanggal(b.tanggal)}</td>
                      <td className={td + ' font-mono text-xs'}><Link href={`/arsip/${b.id}`} className="text-ink no-underline hover:underline">{b.no_naskah}</Link></td>
                      <td className={td}>{b.perihal}</td>
                      <td className={td + ' font-bold'}>{b.kepada}</td>
                      <td className={td + ' whitespace-nowrap'}>{hari === 0 ? 'Hari ini' : `${hari} hari`}{terlambat(b) && <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-danger-soft text-danger">Terlambat</span>}</td>
                      <td className={td}><UnggahSurat id={b.id} noNaskah={b.no_naskah} perihal={b.perihal} status="reserved" aturan={aturan} /></td>
                    </tr>
                  );
                })}
                {!baris.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted"><i className="fa-solid fa-circle-check text-ok-fg mr-2" aria-hidden="true"></i>Semua surat sudah diunggah.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3.5 text-[13px] text-muted">{baris.length} surat menunggu file</div>
        </section>
      </div>
    </main>
  );
}
