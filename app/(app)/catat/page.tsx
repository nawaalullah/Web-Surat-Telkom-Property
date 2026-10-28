import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPengaturan, tahunSekarang } from '@/lib/pengaturan';
import { nomorBerikut } from '@/lib/penomoran';
import CatatForm from '@/components/CatatForm';

export const metadata = { title: 'Catat Surat Baru - Arsip Surat Keluar' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireSession();
  const set = getPengaturan(), tahun = tahunSekarang(), nb = nomorBerikut(tahun, set);
  const dariLama = (db.prepare("SELECT dari FROM surat WHERE status != 'dibatalkan' GROUP BY dari COLLATE NOCASE ORDER BY MAX(id) DESC LIMIT 50").all() as { dari: string }[]).map((x) => x.dari);
  // Saran "Kepada" + alamat terakhir yang dipakai, dari surat yang tidak dibatalkan.
  const alamat = db.prepare("SELECT kepada AS nama, alamat FROM surat WHERE id IN (SELECT MAX(id) FROM surat WHERE status != 'dibatalkan' GROUP BY kepada COLLATE NOCASE) ORDER BY kepada COLLATE NOCASE LIMIT 300").all() as { nama: string; alamat: string }[];
  const hariIni = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-xs text-muted"><a href="/arsip" className="text-muted no-underline">Arsip Surat Keluar</a> › Catat surat baru</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Catat Surat Baru</h1>
        <p className="mt-1 text-sm text-muted">Isi data surat. Nomor naskah dan no agenda terbit otomatis saat surat disimpan.</p>
        <div className="mt-6">
          <CatatForm dariLama={dariLama} alamat={alamat} format={set.format_nomor} tahun={tahun} hariIni={hariIni}
            noBerikut={nb.no} agendaBerikut={nb.agenda} nomorUlang={nb.ulangDariId !== null} maksMb={set.maks_mb} pdf={set.tipe_pdf} docx={set.tipe_docx} />
        </div>
      </div>
    </main>
  );
}
