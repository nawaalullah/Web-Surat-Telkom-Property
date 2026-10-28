import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { MASTER, adalahTab, type TabMaster } from '@/lib/master';
import MasterData, { type Baris } from '@/components/MasterData';

export const metadata = { title: 'Master Data - Arsip Surat Keluar' };
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  await requireSession();
  const tab: TabMaster = adalahTab(searchParams.tab) ? searchParams.tab : 'alamat';
  const q = (searchParams.q || '').trim().slice(0, 60);
  const m = MASTER[tab];

  const where = q ? `WHERE ${m.cari.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(' OR ')}` : '';
  const like = `%${q.replace(/[\\%_]/g, (x) => '\\' + x)}%`;
  const baris = db.prepare(`SELECT * FROM ${m.tabel} ${where} ORDER BY aktif DESC, ${m.cari[0]} COLLATE NOCASE`).all(...m.cari.filter(() => q).map(() => like)) as Baris[];
  const total = (db.prepare(`SELECT COUNT(*) n FROM ${m.tabel}`).get() as { n: number }).n;

  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">{tanggal}</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Master Data</h1>
        <p className="mt-1 text-sm text-muted">Data acuan yang dipakai pada form Catat Surat Baru.</p>
        <div className="mt-6"><MasterData tab={tab} q={q} baris={baris} total={total} /></div>
      </div>
    </main>
  );
}
