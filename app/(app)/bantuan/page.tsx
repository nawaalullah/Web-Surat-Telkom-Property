import Halaman from '@/components/Halaman';
import { IsiBantuan } from '@/components/PusatBantuan';
import { jumlahBelumDiunggah } from '@/lib/surat';

export const metadata = { title: 'Bantuan - Arsip Surat Keluar' };

export default function Page() {
  return (
    <Halaman judul="Bantuan" sub="Panduan singkat mengelola arsip surat keluar. Tekan ? di halaman mana pun untuk membuka panel bantuan.">
      <div className="max-w-[640px] rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        <IsiBantuan belum={jumlahBelumDiunggah()} />
      </div>
    </Halaman>
  );
}
