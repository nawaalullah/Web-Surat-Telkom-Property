import { requireSession } from '@/lib/auth';
import { getPengaturan, urutTerakhir, tahunSekarang } from '@/lib/pengaturan';
import PengaturanForm from '@/components/PengaturanForm';

export const metadata = { title: 'Pengaturan - Arsip Surat Keluar' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireSession();
  const tahun = tahunSekarang();
  const u = urutTerakhir(tahun);
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">{tanggal}</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted">Atur penomoran, unggahan, dan pengingat surat keluar.</p>
        <div className="mt-6">
          <PengaturanForm awal={getPengaturan()} tahun={tahun} terakhir={u.no} agendaTerakhir={u.agenda} />
        </div>
      </div>
    </main>
  );
}
