'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ubahProfil, ubahPassword, type Hasil } from '@/app/profil/actions';
import { inp } from './Field';
import InputPassword from './InputPassword';
import PesanModal from './PesanModal';
import FotoCrop from './FotoCrop';
import { useSeret } from './useSeret';

const card = 'bg-surface border border-line rounded-xl p-4 sm:p-5 flex flex-col gap-3';
const btn = 'min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-lg border border-brand text-brandfg font-bold text-sm bg-surface cursor-pointer disabled:opacity-60';
const btnUtama = 'min-h-[44px] px-[18px] inline-flex items-center justify-center gap-2 rounded-lg border border-brand bg-brand text-white font-bold text-sm cursor-pointer disabled:opacity-60';
const FORMAT = 'PNG, JPG, atau JPEG';

const inisial = (nama: string) => {
  const k = nama.trim().split(/\s+/).filter(Boolean);
  return ((k[0]?.[0] || '') + (k.length > 1 ? k[k.length - 1][0] : '')).toUpperCase() || '?';
};

export default function ProfilForm({ nama, username, jabatan, foto }: { nama: string; username: string; jabatan: string; foto?: string }) {
  const router = useRouter(), pilih = useRef<HTMLInputElement>(null), formPw = useRef<HTMLFormElement>(null);
  const [pesan, setPesan] = useState<Hasil | null>(null), [busyFoto, setBusyFoto] = useState(false), [fileCrop, setFileCrop] = useState<File | null>(null);
  const [pendingNama, mulaiNama] = useTransition(), [pendingPw, mulaiPw] = useTransition();
  const dz = useSeret((fl) => gantiFoto(fl[0]), busyFoto);
  const urlFoto = foto ? `/api/profil/foto?v=${foto}` : '';

  // Pilih file -> dialog atur foto (geser/zoom) -> hasilnya diunggah.
  function gantiFoto(f?: File) {
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type) && !/\.(png|jpe?g)$/i.test(f.name)) return setPesan({ ok: false, pesan: `"${f.name}" tidak didukung. Gunakan ${FORMAT}.` });
    if (f.size > 15e6) return setPesan({ ok: false, pesan: 'Foto lebih dari 15 MB.' });
    setFileCrop(f);
  }
  async function unggahFoto(blob: Blob) {
    setFileCrop(null); setBusyFoto(true);
    try {
      const fd = new FormData(); fd.append('foto', new File([blob], 'profil.jpg', { type: 'image/jpeg' }));
      const r = await fetch('/api/profil/foto', { method: 'POST', body: fd }), j = await r.json().catch(() => ({}));
      setPesan(r.ok ? { ok: true, pesan: 'Foto profil berhasil diperbarui.' } : { ok: false, pesan: j.error || 'Gagal mengunggah foto.' });
      router.refresh();
    } catch { setPesan({ ok: false, pesan: 'Gagal terhubung ke server.' }); }
    setBusyFoto(false);
  }
  async function hapusFoto() {
    setBusyFoto(true);
    const r = await fetch('/api/profil/foto', { method: 'DELETE' });
    setPesan(r.ok ? { ok: true, pesan: 'Foto profil dihapus.' } : { ok: false, pesan: 'Gagal menghapus foto.' });
    setBusyFoto(false); router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div {...dz.props} className={card + ' lg:col-span-2 sm:flex-row sm:items-center sm:gap-5 ' + dz.kelas}>
        {urlFoto
          ? <img src={urlFoto} alt="Foto profil" className="w-24 h-24 rounded-full object-cover border border-line bg-well shrink-0" />
          : <span className="w-24 h-24 rounded-full bg-brand text-white text-3xl font-bold flex items-center justify-center shrink-0" aria-hidden="true">{inisial(nama)}</span>}
        <div className="flex flex-col gap-2 min-w-0">
          <div><h2 className="m-0 text-base font-bold truncate">{nama}</h2><div className="text-sm text-muted">{jabatan} · @{username}</div></div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" disabled={busyFoto} onClick={() => pilih.current?.click()} className={btnUtama}><i className="fa-solid fa-camera" aria-hidden="true"></i>{busyFoto ? 'Memproses...' : 'Ganti Foto'}</button>
            {urlFoto && <button type="button" disabled={busyFoto} onClick={hapusFoto} className={btn}>Hapus Foto</button>}
          </div>
          <span className="text-xs text-muted">Format didukung: {FORMAT}. Seret foto ke sini atau klik Ganti Foto. Anda bisa menggeser dan memperbesar foto sebelum disimpan.</span>
          <input ref={pilih} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { gantiFoto(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </div>

      <form className={card} action={(fd) => mulaiNama(async () => { const hasil = await ubahProfil(fd); setPesan(hasil); if (hasil.ok) router.refresh(); })}>
        <h2 className="m-0 text-base font-bold">Data Akun</h2>
        <label className="block text-[13px] font-bold">Nama lengkap
          <input name="nama" defaultValue={nama} required maxLength={100} className={inp + ' font-semibold'} /></label>
        <label className="block text-[13px] font-bold">Username
          <input name="username" defaultValue={username} required minLength={3} maxLength={30} pattern="[A-Za-z0-9._-]+" autoComplete="username" className={inp + ' font-semibold'} aria-describedby="username-hint" />
        </label>
        <p id="username-hint" className="-mt-2 m-0 text-xs text-muted">3–30 karakter; gunakan huruf, angka, titik, _ atau -.</p>
        <label className="block text-[13px] font-bold">Jabatan
          <input name="jabatan" defaultValue={jabatan} required maxLength={100} className={inp + ' font-semibold'} /></label>
        <button type="submit" disabled={pendingNama} className={btnUtama + ' w-full sm:w-auto sm:self-start'}>{pendingNama ? 'Menyimpan...' : 'Simpan Profil'}</button>
      </form>

      <form ref={formPw} className={card} action={(fd) => mulaiPw(async () => { const h = await ubahPassword(fd); setPesan(h); if (h.ok) formPw.current?.reset(); })}>
        <h2 className="m-0 text-base font-bold">Ganti Password</h2>
        <label className="block text-[13px] font-bold">Password lama
          <InputPassword name="lama" required autoComplete="current-password" className={inp} /></label>
        <label className="block text-[13px] font-bold">Password baru
          <InputPassword name="baru" required minLength={6} autoComplete="new-password" className={inp} /></label>
        <label className="block text-[13px] font-bold">Ulangi password baru
          <InputPassword name="ulang" required minLength={6} autoComplete="new-password" className={inp} /></label>
        <p className="m-0 text-xs text-muted">Minimal 10 karakter dan harus berbeda dari password lama.</p>
        <button type="submit" disabled={pendingPw} className={btnUtama + ' w-full sm:w-auto sm:self-start'}>{pendingPw ? 'Menyimpan...' : 'Ganti Password'}</button>
      </form>

      {fileCrop && <FotoCrop file={fileCrop} onSelesai={unggahFoto} onBatal={() => setFileCrop(null)} />}
      <PesanModal pesan={pesan?.pesan} tipe={pesan?.ok ? 'info' : 'error'} onTutup={() => setPesan(null)} />
    </div>
  );
}
