import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import ProfilForm from '@/components/ProfilForm';

export const metadata = { title: 'Profil Saya - Arsip Surat Keluar' };

export default async function Profil() {
  const s = await requireSession();
  const u: any = db.prepare('SELECT username, nama, jabatan, foto FROM users WHERE id = ?').get(s.uid);
  return (
    <main className="px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-5">
        <div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight">Profil Saya</h1>
          <div className="text-sm text-muted mt-1">Ubah foto, nama, dan password akun Anda.</div>
        </div>
        <ProfilForm nama={u?.nama || s.nama} username={u?.username || ''} jabatan={(u?.jabatan || '').trim() || 'Sekretariat'} foto={u?.foto || undefined} />
      </div>
    </main>
  );
}
