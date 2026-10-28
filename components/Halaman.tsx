/** Kepala + isi halaman standar. Layar yang belum dikerjakan menampilkan penanda tahap. */
export default function Halaman({ judul, sub, tahap, children }: { judul: string; sub: string; tahap?: number; children?: React.ReactNode }) {
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">{tanggal}</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{judul}</h1>
        <p className="mt-1 text-sm text-muted">{sub}</p>
        <div className="mt-6">
          {children ?? (
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm text-sm text-muted">
              Halaman ini dikerjakan pada Tahap {tahap}.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
