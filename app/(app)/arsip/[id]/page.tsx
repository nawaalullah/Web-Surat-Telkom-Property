import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPengaturan } from '@/lib/pengaturan';
import { getSurat, STATUS, ukuranTeks } from '@/lib/surat';
import { fmtTanggal, fmtWaktu } from '@/lib/waktu';
import { card } from '@/lib/ui';
import DetailAksi from '@/components/DetailAksi';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Detail Surat - Arsip Surat Keluar' };

const Data = ({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) => (
  <div className="min-w-0"><div className="text-[11px] font-semibold uppercase tracking-widest text-muted">{k}</div><div className={'mt-0.5 text-sm font-bold break-words ' + (mono ? 'font-mono' : '')}>{v || '-'}</div></div>
);

export default async function Page({ params }: { params: { id: string } }) {
  await requireSession();
  const s = getSurat(Number(params.id));
  if (!s) notFound();
  const set = getPengaturan();
  const riwayat = db.prepare('SELECT l.aksi, l.objek, l.waktu, u.nama FROM log_aktivitas l LEFT JOIN users u ON u.id = l.user_id WHERE l.surat_id = ? ORDER BY l.id').all(s.id) as { aksi: string; objek: string; waktu: string; nama: string | null }[];
  const st = STATUS[s.status], batal = s.status === 'dibatalkan', pdf = s.file?.endsWith('.pdf');
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-xs text-muted"><Link href="/arsip" className="text-muted no-underline">Arsip Surat Keluar</Link> › Detail surat</div>
        <div className="mt-1 flex flex-wrap items-center gap-3"><h1 className="m-0 text-3xl font-extrabold tracking-tight">{s.perihal}</h1><span className={'px-2.5 py-1 rounded-full text-xs font-bold ' + st.kelas}>{st.teks}</span></div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            <section className={card}>
              <h2 className="m-0 mb-4 text-base font-bold">Data surat</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Data k="No" v={s.no_urut} /><Data k="Tanggal" v={fmtTanggal(s.tanggal)} /><Data k="No agenda" v={s.agenda} />
                <Data k="Dari" v={s.dari} /><Data k="Kepada" v={s.kepada} /><Data k="Alamat" v={s.alamat} />
                <Data k="Jenis" v={s.jenis} /><Data k="Sifat" v={s.sifat[0].toUpperCase() + s.sifat.slice(1)} /><Data k="Lampiran" v={s.lampiran} />
                {s.catatan && <div className="col-span-full"><Data k="Catatan" v={s.catatan} /></div>}
                {batal && <div className="col-span-full"><Data k="Alasan pembatalan" v={s.alasan_batal} /></div>}
              </div>
            </section>
            <section className={card}>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="m-0 text-base font-bold">Surat</h2>
                {s.file ? <span className="text-xs text-muted">{s.file_nama} · {ukuranTeks(s.file_ukuran)}</span> : <span className="text-xs text-muted">Belum ada file</span>}
              </div>
              {s.file && pdf ? <iframe title="Pratinjau surat" src={`/api/surat/${s.id}/file`} className="w-full h-[640px] rounded-lg border border-line bg-well" />
                : s.file ? <div className="rounded-lg border border-line bg-well p-10 text-center text-sm text-muted">Pratinjau tidak tersedia untuk DOCX.<div className="mt-3"><a href={`/api/surat/${s.id}/file`} className="font-bold text-brandfg">Unduh {s.file_nama}</a></div></div>
                : <div className="rounded-lg border border-line bg-well p-10 text-center text-sm text-muted">[Pratinjau surat setelah diunggah]{s.draft_file && <div className="mt-3"><a href={`/api/surat/${s.id}/file?jenis=draft`} className="font-bold text-brandfg">Lihat draft: {s.draft_nama}</a></div>}</div>}
              {s.file && <div className="mt-3"><a href={`/api/surat/${s.id}/file?unduh=1`} className="text-sm font-bold text-brandfg"><i className="fa-solid fa-download mr-1.5" aria-hidden="true"></i>Unduh file</a></div>}
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-xl bg-[rgb(17_18_20)] text-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60"># No naskah</div>
              <div className={'mt-2 font-mono text-lg font-bold break-all ' + (batal ? 'line-through opacity-70' : '')}>{s.no_naskah}</div>
            </div>
            <DetailAksi surat={{ id: s.id, no_naskah: s.no_naskah, perihal: s.perihal, sifat: s.sifat, dari: s.dari, kepada: s.kepada, alamat: s.alamat, lampiran: s.lampiran, tanggal: s.tanggal, status: s.status, tahun: s.tahun, dipakai_ulang_oleh: s.dipakai_ulang_oleh }} aturan={{ maksMb: set.maks_mb, pdf: set.tipe_pdf, docx: set.tipe_docx, wajib: set.wajib_unggah }} />
            <section className={card}>
              <h2 className="m-0 mb-3 text-base font-bold">Riwayat</h2>
              <ol className="m-0 p-0 list-none flex flex-col gap-3 text-[13px]">
                {riwayat.map((r, i) => <li key={i}><div className="font-bold">{r.aksi}</div><div className="text-muted">{r.nama || '-'} · {fmtWaktu(r.waktu)}</div></li>)}
                {!riwayat.length && <li className="text-muted">Belum ada riwayat.</li>}
                {s.status === 'reserved' && <li><div className="font-bold text-muted">Terarsip</div><div className="text-muted">Belum ada file diunggah</div></li>}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
