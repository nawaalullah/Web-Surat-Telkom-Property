'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { catatSurat, type HasilCatat } from '@/app/catat/actions';
import { formatNomor } from '@/lib/nomor';
import { JENIS_SURAT } from '@/lib/jenis';
import { card, inp, lbl, btnP, btnO } from '@/lib/ui';
import { ModalDasar } from './Modal';
import PesanModal from './PesanModal';
import { useSeret } from './useSeret';

type Isi = { jenis: string; sifat: string; perihal: string; dari: string; tanggal: string; kepada: string; alamat: string; lampiran: string };
type Props = {
  dariLama: string[]; alamat: { nama: string; alamat: string }[];
  format: string; tahun: number; hariIni: string; noBerikut: number; agendaBerikut: number; nomorUlang: boolean; maksMb: number; pdf: boolean; docx: boolean;
};
const KUNCI = 'draft-catat-surat';
const SIFAT = [['biasa', 'Biasa'], ['segera', 'Segera'], ['rahasia', 'Rahasia']] as const;

function Kepala({ ikon, judul, sub }: { ikon: string; judul: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-9 h-9 rounded-lg bg-brand-soft text-brandfg inline-flex items-center justify-center"><i className={'fa-solid ' + ikon} aria-hidden="true"></i></span>
      <div><h2 className="m-0 text-base font-bold">{judul}</h2><div className="text-[13px] text-muted">{sub}</div></div>
    </div>
  );
}
const jam = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

export default function CatatForm(p: Props) {
  const kosong: Isi = { jenis: '', sifat: 'biasa', perihal: '', dari: p.dariLama.length === 1 ? p.dariLama[0] : '', tanggal: p.hariIni, kepada: '', alamat: '', lampiran: '' };
  const [v, setV] = useState<Isi>(kosong), [file, setFile] = useState<File | null>(null), [pesan, setPesan] = useState(''), [hasil, setHasil] = useState<HasilCatat | null>(null);
  const [tersimpan, setTersimpan] = useState(''), [pending, mulai] = useTransition(), [muat, setMuat] = useState(false), pilih = useRef<HTMLInputElement>(null);
  const ubah = (k: keyof Isi, x: string) => setV((o) => ({ ...o, [k]: x }));
  const ext = [p.pdf && 'PDF', p.docx && 'DOCX'].filter(Boolean).join(' atau ');

  // Pulihkan draft form dari browser ini, lalu simpan otomatis setiap ada perubahan.
  useEffect(() => {
    try { const d = JSON.parse(localStorage.getItem(KUNCI) || 'null'); if (d?.isi) setV((o) => ({ ...o, ...d.isi, tanggal: o.tanggal })); if (d?.jam) setTersimpan(d.jam); } catch { /* abaikan */ }
    setMuat(true);
  }, []);
  function simpanDraft(tampil = true) { try { const j = jam(); localStorage.setItem(KUNCI, JSON.stringify({ isi: v, jam: j })); if (tampil) setTersimpan(j); } catch { /* abaikan */ } }
  useEffect(() => { if (!muat) return; const t = setTimeout(() => simpanDraft(), 800); return () => clearTimeout(t); }, [v, muat]); // eslint-disable-line react-hooks/exhaustive-deps

  function pilihFile(f?: File) {
    if (!f) return;
    const e = f.name.toLowerCase().match(/\.(pdf|docx)$/)?.[1];
    if (!e || (e === 'pdf' && !p.pdf) || (e === 'docx' && !p.docx)) return setPesan(`"${f.name}" tidak didukung. Gunakan ${ext}.`);
    if (f.size > p.maksMb * 1048576) return setPesan(`"${f.name}" lebih dari ${p.maksMb} MB.`);
    setFile(f);
  }
  const dz = useSeret((fl) => pilihFile(fl[0]), pending);

  const pratinjau = formatNomor(p.format, { no: p.noBerikut, kode: v.jenis || '[KODE]', tahun: p.tahun });

  function kirim(fd: FormData) {
    if (file) fd.set('draft', file); else fd.delete('draft');
    mulai(async () => {
      const h = await catatSurat(fd);
      if (!h.ok) return setPesan(h.pesan);
      try { localStorage.removeItem(KUNCI); } catch { /* abaikan */ }
      setHasil(h); setV(kosong); setFile(null); setTersimpan('');
    });
  }
  function pilihKepada(x: string) {
    ubah('kepada', x);
    const a = p.alamat.find((b) => b.nama.toLowerCase() === x.trim().toLowerCase());
    if (a?.alamat && !v.alamat) ubah('alamat', a.alamat);
  }

  return (
    <form action={kirim} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        <section className={card}>
          <Kepala ikon="fa-file-lines" judul="Informasi surat" sub="Jenis, sifat, dan perihal surat." />
          <label className={lbl + ' mb-4 block'}>Jenis surat
            <select name="jenis" required value={v.jenis} onChange={(e) => ubah('jenis', e.target.value)} className={inp}>
              <option value="">Pilih jenis</option>{JENIS_SURAT.map((j) => <option key={j.kode} value={j.kode}>{j.kode}</option>)}
            </select>
          </label>
          <fieldset className="border-0 p-0 m-0"><legend className={lbl + ' p-0'}>Sifat</legend>
            <div className="mt-1.5 grid grid-cols-3 gap-3">
              {SIFAT.map(([k, t]) => (
                <label key={k} className={'flex items-center gap-2 min-h-[44px] px-3 rounded-lg border text-sm font-semibold cursor-pointer ' + (v.sifat === k ? 'border-brand bg-brand-soft text-brandfg' : 'border-line-strong bg-surface')}>
                  <input type="radio" name="sifat" value={k} checked={v.sifat === k} onChange={() => ubah('sifat', k)} className="accent-[rgb(var(--brand))]" />{t}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={lbl + ' mt-4 block'}>Perihal
            <input name="perihal" required maxLength={200} value={v.perihal} onChange={(e) => ubah('perihal', e.target.value)} placeholder="Isi perihal surat" className={inp} />
          </label>
        </section>

        <section className={card}>
          <Kepala ikon="fa-users" judul="Pihak terkait" sub="Pengirim dan penerima surat." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={lbl}>Dari
              <input name="dari" required maxLength={120} list="daftar-unit" autoComplete="off" value={v.dari} onChange={(e) => ubah('dari', e.target.value)} placeholder="Unit atau pengirim surat" className={inp} />
              <datalist id="daftar-unit">{p.dariLama.map((n) => <option key={n} value={n} />)}</datalist>
            </label>
            <label className={lbl}>Tanggal surat
              <input name="tanggal" type="date" required min={`${p.tahun}-01-01`} max={`${p.tahun}-12-31`} value={v.tanggal} onChange={(e) => ubah('tanggal', e.target.value)} className={inp} />
            </label>
            <label className={lbl}>Kepada
              <input name="kepada" required maxLength={120} list="daftar-alamat" autoComplete="off" value={v.kepada} onChange={(e) => pilihKepada(e.target.value)} placeholder="Instansi atau pihak penerima" className={inp} />
              <datalist id="daftar-alamat">{p.alamat.map((a) => <option key={a.nama} value={a.nama} />)}</datalist>
            </label>
            <label className={lbl}>Alamat
              <input name="alamat" maxLength={300} value={v.alamat} onChange={(e) => ubah('alamat', e.target.value)} placeholder="Alamat lengkap penerima" className={inp} />
            </label>
          </div>
        </section>

        <section className={card}>
          <Kepala ikon="fa-paperclip" judul="Lampiran & draft" sub="Draft opsional, bisa diganti dengan surat final saat unggah." />
          <label className={lbl}>Lampiran
            <input name="lampiran" maxLength={100} value={v.lampiran} onChange={(e) => ubah('lampiran', e.target.value)} placeholder="Jumlah atau keterangan, mis. 1 berkas" className={inp} />
          </label>
          <div className={lbl + ' mt-4'}>Draft surat <span className="font-normal text-muted">(opsional)</span></div>
          <div {...dz.props} className={'mt-1.5 rounded-xl border border-dashed border-line-dash bg-well p-6 text-center ' + dz.kelas}>
            {file ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="min-w-0"><div className="text-sm font-bold truncate">{file.name}</div><div className="text-xs text-muted">{(file.size / 1048576).toFixed(1)} MB</div></div>
                <button type="button" onClick={() => setFile(null)} className={btnO + ' !min-h-[36px] !px-3'}>Hapus</button>
              </div>
            ) : (
              <button type="button" onClick={() => pilih.current?.click()} className="bg-transparent border-0 cursor-pointer w-full text-ink">
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-ink-2" aria-hidden="true"></i>
                <div className="mt-2 text-sm font-bold">Tarik file ke sini atau pilih dari perangkat</div>
                <div className="text-[13px] text-muted">{ext}, maksimal {p.maksMb} MB</div>
              </button>
            )}
            <input ref={pilih} type="file" accept={[p.pdf && '.pdf', p.docx && '.docx'].filter(Boolean).join(',')} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pilihFile(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </section>

        <div className={card + ' flex flex-wrap items-center gap-3'}>
          <span className="text-[13px] text-muted flex-1 min-w-[160px]">{tersimpan ? `Draft tersimpan otomatis pukul ${tersimpan}` : 'Draft form tersimpan otomatis di browser ini'}</span>
          <button type="button" onClick={() => simpanDraft()} className={btnO + ' gap-2'}><i className="fa-solid fa-floppy-disk" aria-hidden="true"></i>Simpan Draft</button>
          <button type="submit" disabled={pending} className={btnP + ' gap-2 disabled:opacity-60'}><i className="fa-solid fa-check" aria-hidden="true"></i>{pending ? 'Menerbitkan...' : 'Simpan & Terbitkan Nomor'}</button>
        </div>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <div className="rounded-xl bg-[rgb(17_18_20)] text-white p-5">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60"># Pratinjau nomor</div>
          <div className="mt-2 font-mono text-lg font-bold break-all" aria-live="polite">{pratinjau}</div>
          <div className="mt-2 text-xs text-white/70">No agenda: <span className="font-mono text-white">{p.agendaBerikut}</span></div>
          {p.nomorUlang && <div className="mt-2 text-xs text-white/70">Memakai kembali nomor dan no agenda surat yang dibatalkan.</div>}
          <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-warn-bg text-warn-fg"><span className="w-1.5 h-1.5 rounded-full bg-current" />Terbit saat disimpan</span>
        </div>
        <div className={card}>
          <h2 className="m-0 text-base font-bold mb-3">Alur surat</h2>
          <ol className="m-0 p-0 list-none flex flex-col gap-3 text-[13px]">
            {[['Catat surat', 'Isi data surat lalu simpan: nomor terbit otomatis (Reserved).'], ['Unggah surat', 'Unggah PDF final ke arsip.'], ['Terarsip', 'Surat tampil di arsip lengkap dengan filenya.']].map(([t, s], i) => (
              <li key={t} className="flex gap-3"><span className={'shrink-0 w-6 h-6 rounded-full text-xs font-bold inline-flex items-center justify-center ' + (i === 0 ? 'bg-brand text-white' : 'border border-line-strong text-ink-2')}>{i + 1}</span><div><div className="font-bold">{t}</div><div className="text-muted">{s}</div></div></li>
            ))}
          </ol>
        </div>
      </aside>

      {hasil?.ok && (
        <ModalDasar tipe="sukses" judul="Nomor naskah terbit" pesan={`${hasil.no_naskah}\nNo agenda: ${hasil.agenda}${hasil.dipakai_ulang ? '\nNomor dan no agenda ini bekas surat yang dibatalkan, dipakai kembali.' : ''}\nStatus Reserved: unggah surat final agar masuk arsip.`} onTutup={() => setHasil(null)}>
          <button type="button" data-awal onClick={() => setHasil(null)} className={btnO}>Catat surat lain</button>
          <Link href="/arsip" className={btnP}>Ke Arsip</Link>
        </ModalDasar>
      )}
      <PesanModal pesan={pesan} tipe="error" onTutup={() => setPesan('')} />
    </form>
  );
}
