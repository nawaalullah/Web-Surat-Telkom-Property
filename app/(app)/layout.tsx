import Shell from '@/components/Shell';
import { requireSession } from '@/lib/auth';

// Tanggal di kepala halaman dan data dari database harus dihitung tiap permintaan, bukan saat build.
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  return <Shell s={s}>{children}</Shell>;
}
