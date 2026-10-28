'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { simpanSemuaPengaturan, type Hasil } from '@/app/pengaturan/actions';
import { formatNomor, TOKEN_NOMOR } from '@/lib/nomor';
import { MAKS_MB_BATAS, type Pengaturan } from '@/lib/pengaturanDef';
import { card, inp, lbl, btnP, btnO } from '@/lib/ui';
import PesanModal from './PesanModal';

function Kepala({ ikon, judul, sub }: { ikon: string; judul: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-9 h-9 rounded-lg bg-brand-soft text-brandfg inline-flex items-center justify-center"><i className={'fa-solid ' + ikon} aria-hidden="true"></i></span>
      <div><h2 className="m-0 text-base font-bold">{judul}</h2><div className="text-[13px] text-muted">{sub}</div></div>
    </div>
  );
}

function Sakelar({ nama, nilai, onUbah, label, ket }: { nama: string; nilai: boolean; onUbah: (v: boolean) => void; label: string; ket: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><div className="text-sm font-bold">{label}</div><div className="text-[13px] text-muted">{ket}</div></div>
      <input type="hidden" name={nama} value={nilai ? '1' : '0'} />
      <button type="button" role="switch" aria-checked={nilai} aria-label={label} onClick={() => onUbah(!nilai)}
        className={'shrink-0 w-12 h-7 rounded-full border-0 cursor-pointer relative transition-colors ' + (nilai ? 'bg-brand' : 'bg-line-strong')}>
        <span className={'absolute top-1 w-5 h-5 rounded-full bg-white transition-all ' + (nilai ? 'left-6' : 'left-1')} />
      </button>
    </div>
  );
}

export default function PengaturanForm({ awal, tahun, terakhir, agendaTerakhir }: { awal: Pengaturan; tahun: number; terakhir: number; agendaTerakhir: number }) {
  const r = useRouter(), form = useRef<HTMLFormElement>(null);
  const nomorAwal = terakhir + 1;
  const [p, setP] = useState(awal), [nomorMulai, setNomorMulai] = useState<string>(String(nomorAwal)), [pesan, setPesan] = useState<Hasil | null>(null), [pending, mulai] = useTransition();
  const ubah = <K extends keyof Pengaturan>(k: K, v: Pengaturan[K]) => setP((x) => ({ ...x, [k]: v }));
  const nomorBerikut = formatNomor(p.format_nomor, { no: Math.max(1, Number(nomorMulai) || nomorAwal), tahun });
  const agendaBerikut = Math.max(agendaTerakhir + 1, Number(p.agenda_mulai) || 1);

  return (
    <form ref={form}
      action={(fd) => mulai(async () => { const h = await simpanSemuaPengaturan(fd); setPesan(h); if (h.ok) r.refresh(); })}>
      <div className="flex flex-col gap-4 min-w-0">
        <section id="penomoran" className={card + ' scroll-mt-4'}>
          <Kepala ikon="fa-hashtag" judul="Penomoran" sub="Format nomor naskah dan urutannya." />
          <label className={lbl}>Format nomor naskah
            <input name="format_nomor" value={p.format_nomor} onChange={(e) => ubah('format_nomor', e.target.value)} maxLength={100} required spellCheck={false} className={inp + ' font-mono'} />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">Token:
            {TOKEN_NOMOR.map((t) => <button key={t} type="button" onClick={() => ubah('format_nomor', p.format_nomor + t)} title={`Tambahkan ${t}`} className="font-mono px-2 py-1 rounded-md bg-well border border-line cursor-pointer text-ink-2">{t}</button>)}
          </div>
          <p className="m-0 mt-2 text-xs text-muted">Teks tetap boleh ditulis langsung, mis. <span className="font-mono">[NO]/UM-000/GSD-065-04/[TAHUN]</span>.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className={lbl}>Reset urutan
              <select name="reset_urutan" value={p.reset_urutan} onChange={(e) => ubah('reset_urutan', e.target.value as Pengaturan['reset_urutan'])} className={inp}>
                <option value="tahunan">Setiap tahun baru (1 Januari)</option><option value="tidak">Tidak pernah direset</option>
              </select>
            </label>
            <label className={lbl}>Nomor terakhir aktif
              <input readOnly aria-readonly="true" value={terakhir ? String(terakhir).padStart(3, '0') : 'Belum ada'} className={inp + ' bg-locked text-muted font-mono'} />
              <span className="mt-1 block text-xs font-normal text-muted">Terisi otomatis, tidak bisa diedit.</span>
            </label>
            <label className={lbl}>Nomor naskah mulai dari
              <input name="nomor_mulai" type="number" min={terakhir + 1} step={1} required value={nomorMulai} onChange={(e) => setNomorMulai(e.target.value)} className={inp + ' font-mono'} />
              <input type="hidden" name="nomor_awal" value={nomorAwal} />
              <span className="mt-1 block text-xs font-normal text-muted">Nomor surat berikutnya. Isi untuk melanjutkan buku agenda lama; hanya bisa dinaikkan.</span>
            </label>
            <label className={lbl}>No agenda mulai dari
              <input name="agenda_mulai" type="number" min={1} step={1} required value={p.agenda_mulai} onChange={(e) => ubah('agenda_mulai', e.target.value as any)} className={inp} />
            </label>
          </div>
          <div className="mt-4 rounded-xl bg-[rgb(17_18_20)] text-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60"># Pratinjau nomor berikutnya</div>
            <div className="mt-1.5 font-mono text-lg font-bold break-all">{nomorBerikut}</div>
            <div className="mt-1 text-xs text-white/60">No agenda: <span className="font-mono text-white">{agendaBerikut}</span></div>
          </div>
        </section>

        <section id="unggah" className={card + ' scroll-mt-4'}>
          <Kepala ikon="fa-file" judul="Unggah & File" sub="Aturan file surat yang diunggah." />
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            {([['tipe_pdf', 'PDF'], ['tipe_docx', 'DOCX']] as const).map(([k, t]) => (
              <label key={k} className="flex items-center gap-2 text-sm font-semibold min-h-[44px] cursor-pointer">
                <input type="checkbox" name={k} value="1" checked={p[k]} onChange={(e) => ubah(k, e.target.checked)} className="w-[18px] h-[18px] accent-[rgb(var(--brand))]" />{t}
              </label>
            ))}
            <label className={lbl}>Ukuran maksimal (MB)
              <input name="maks_mb" type="number" min={1} max={MAKS_MB_BATAS} step={1} required value={p.maks_mb} onChange={(e) => ubah('maks_mb', e.target.value as any)} className={inp + ' !w-36'} />
            </label>
          </div>
          <div className="mt-4 pt-4 border-t border-line-soft"><Sakelar nama="wajib_unggah" nilai={p.wajib_unggah} onUbah={(v) => ubah('wajib_unggah', v)} label="Wajib unggah sebelum diarsipkan" ket="Surat tidak bisa diarsipkan tanpa file." /></div>
        </section>

        <section id="pengingat" className={card + ' scroll-mt-4'}>
          <Kepala ikon="fa-bell" judul="Pengingat" sub="Notifikasi surat yang belum lengkap." />
          <Sakelar nama="ingatkan" nilai={p.ingatkan} onUbah={(v) => ubah('ingatkan', v)} label="Ingatkan surat yang belum diunggah" ket="Muncul di menu Belum Diunggah." />
          <label className={lbl + ' mt-4 block'}>Ingatkan setelah (hari)
            <input name="ingatkan_hari" type="number" min={1} max={60} step={1} required disabled={!p.ingatkan} value={p.ingatkan_hari} onChange={(e) => ubah('ingatkan_hari', e.target.value as any)} className={inp + ' !w-36 disabled:opacity-60'} />
          </label>
          {!p.ingatkan && <><input type="hidden" name="ingatkan_hari" value={p.ingatkan_hari} /><p className="m-0 mt-1.5 text-xs text-muted">Aktifkan pengingat di atas untuk mengubah jumlah hari.</p></>}
        </section>

        <section id="cadangan" className={card + ' scroll-mt-4'}>
          <Kepala ikon="fa-database" judul="Cadangan & Ekspor" sub="Salinan database dan rekap data." />
          <div className="flex flex-wrap gap-3">
            <a href="/api/cadangan" className={btnO + ' gap-2'}><i className="fa-solid fa-database" aria-hidden="true"></i>Unduh cadangan database</a>
            <a href={`/api/laporan/excel?tahun=${tahun}`} className={btnO + ' gap-2'}><i className="fa-solid fa-file-excel" aria-hidden="true"></i>Ekspor rekap {tahun} (Excel)</a>
          </div>
          <p className="m-0 mt-3 text-[13px] text-muted">Cadangan hanya berisi database (data surat dan pengaturan). Folder <span className="font-mono">uploads/</span> berisi file surat dan tetap perlu disalin manual. Cadangan harian otomatis menyusul di Tahap 7.</p>
        </section>

        <div className={card + ' flex justify-end gap-3 max-sm:flex-col-reverse max-sm:[&>*]:w-full'}>
          <button type="button" onClick={() => { setP(awal); setNomorMulai(String(nomorAwal)); form.current?.reset(); }} className={btnO}>Batal</button>
          <button type="submit" disabled={pending} className={btnP + ' gap-2 disabled:opacity-60'}><i className="fa-solid fa-check" aria-hidden="true"></i>{pending ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </div>
      </div>
      <PesanModal pesan={pesan?.pesan} tipe={pesan?.ok ? 'sukses' : 'error'} onTutup={() => setPesan(null)} />
    </form>
  );
}
