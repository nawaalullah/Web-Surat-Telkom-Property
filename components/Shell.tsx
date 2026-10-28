import Logo from '@/components/Logo';
import Sidebar from '@/components/Sidebar';
import TemaMenu from '@/components/TemaMenu';
import NotifGlobal from '@/components/NotifGlobal';
import Kerangka from '@/components/Kerangka';
import ProfilMenu from '@/components/Profilmenu';
import TombolBantuan from '@/components/PusatBantuan';
import { logout } from '@/app/actions';
import { db } from '@/lib/db';
import { menuUtama, menuPengaturan } from '@/lib/menus';
import { jumlahBelumDiunggah } from '@/lib/surat';

/** Kerangka halaman: sidebar + bar kanan atas (tema, bantuan, profil). */
export default function Shell({ s, children }: { s: { uid: number; nama: string }; children: React.ReactNode }) {
  const u = db.prepare('SELECT jabatan, foto FROM users WHERE id = ?').get(s.uid) as { jabatan?: string | null; foto?: string | null } | undefined;
  const belum = jumlahBelumDiunggah();
  const utama = menuUtama.map((m) => (m.href === '/belum-diunggah' ? { ...m, badge: belum } : m));
  const jabatan = (u?.jabatan || '').trim() || 'Sekretariat';
  return (
    <Kerangka
      sidebar={
        <>
          <div className="px-2 pb-6 pr-12 lg:pr-2">
            <div className="max-w-[200px] lg:max-w-none"><Logo className="w-full h-auto" alt="Telkom Property" /></div>
          </div>
          <Sidebar utama={utama} pengaturan={menuPengaturan} />
        </>
      }
      profil={
        <div className="flex items-center gap-2 min-w-0">
          <TemaMenu />
          <TombolBantuan belum={belum} />
          <div className="min-w-0">
            <ProfilMenu nama={s.nama} jabatan={jabatan} foto={u?.foto || undefined} hrefProfil="/profil" keluar={logout} />
          </div>
        </div>
      }
    >
      {children}
      <NotifGlobal />
    </Kerangka>
  );
}
