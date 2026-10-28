'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const KELUAR = 512;      // sisi gambar hasil (px)
const ZOOM_MAKS = 4;
const btn = 'min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-lg border border-brand text-brandfg font-bold text-sm bg-surface cursor-pointer disabled:opacity-60';
const btnUtama = 'min-h-[44px] px-[18px] inline-flex items-center justify-center gap-2 rounded-lg border border-brand bg-brand text-white font-bold text-sm cursor-pointer disabled:opacity-60';

/**
 * Dialog potong foto profil: geser dan zoom di dalam bingkai bulat, pratinjau langsung,
 * lalu "Gunakan Foto" menghasilkan JPG persegi 512x512.
 */
export default function FotoCrop({ file, onSelesai, onBatal }: { file: File; onSelesai: (blob: Blob) => void; onBatal: () => void }) {
  const bingkai = useRef<HTMLDivElement>(null);
  const batalRef = useRef(onBatal); batalRef.current = onBatal;
  const [im, setIm] = useState<HTMLImageElement | null>(null);
  const [url, setUrl] = useState('');
  const [galat, setGalat] = useState(false);
  const [S, setS] = useState(300);                  // sisi bingkai (px), mengikuti lebar layar
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });   // pergeseran pusat gambar dari pusat bingkai (px)
  const [siap, setSiap] = useState(false);
  const [proses, setProses] = useState(false);
  const geser = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => setSiap(true), []);

  // Muat gambar dari file (orientasi EXIF sudah diterapkan browser).
  useEffect(() => {
    // `batal` mencegah callback gambar lama (mis. efek yang dijalankan dua kali di mode dev / StrictMode)
    // mengubah state setelah URL-nya dicabut, yang sebelumnya memunculkan galat palsu.
    let batal = false;
    const u = URL.createObjectURL(file);
    setUrl(u); setIm(null); setGalat(false);
    const i = new Image();
    i.onload = () => { if (!batal) setIm(i); };
    i.onerror = () => { if (!batal) setGalat(true); };
    i.src = u;
    return () => { batal = true; i.onload = null; i.onerror = null; URL.revokeObjectURL(u); };
  }, [file]);

  // Ukuran bingkai mengikuti layar; Esc membatalkan; scroll halaman dikunci selama dialog terbuka.
  useEffect(() => {
    if (!siap) return;
    const hitung = () => setS(Math.max(220, Math.min(320, window.innerWidth - 64)));
    hitung(); window.addEventListener('resize', hitung);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); batalRef.current(); } };
    document.addEventListener('keydown', esc);
    const lama = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const sebelum = document.activeElement as HTMLElement | null;
    return () => { window.removeEventListener('resize', hitung); document.removeEventListener('keydown', esc); document.body.style.overflow = lama; sebelum?.focus?.(); };
  }, [siap]);

  const dasar = im ? S / Math.min(im.naturalWidth, im.naturalHeight) : 1;   // skala agar gambar menutup bingkai
  const skala = dasar * zoom;
  const lebar = im ? im.naturalWidth * skala : 0, tinggi = im ? im.naturalHeight * skala : 0;
  const jepit = (o: { x: number; y: number }, sk = skala) => {
    if (!im) return o;
    const mx = Math.max(0, (im.naturalWidth * sk - S) / 2), my = Math.max(0, (im.naturalHeight * sk - S) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  };
  const ubahZoom = (z: number) => {
    const nz = Math.min(ZOOM_MAKS, Math.max(1, z));
    setZoom(nz); setOff((o) => jepit(o, dasar * nz));
  };

  function turun(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    geser.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
  }
  function gerak(e: React.PointerEvent) {
    const g = geser.current; if (!g) return;
    setOff(jepit({ x: g.ox + e.clientX - g.x, y: g.oy + e.clientY - g.y }));
  }
  const lepas = () => { geser.current = null; };
  function tombol(e: React.KeyboardEvent) {
    const d = 12; const m: Record<string, [number, number]> = { ArrowLeft: [d, 0], ArrowRight: [-d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
    if (m[e.key]) { e.preventDefault(); setOff((o) => jepit({ x: o.x + m[e.key][0], y: o.y + m[e.key][1] })); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); ubahZoom(zoom + 0.2); }
    else if (e.key === '-') { e.preventDefault(); ubahZoom(zoom - 0.2); }
  }
  function roda(e: React.WheelEvent) { ubahZoom(zoom - Math.sign(e.deltaY) * 0.15); }

  async function gunakan() {
    if (!im) return;
    setProses(true);
    const sisi = S / skala;                                   // sisi area sumber (px gambar asli)
    const sx = (im.naturalWidth * skala / 2 - S / 2 - off.x) / skala;
    const sy = (im.naturalHeight * skala / 2 - S / 2 - off.y) / skala;
    const out = Math.round(Math.min(KELUAR, sisi));
    const c = document.createElement('canvas'); c.width = c.height = Math.max(64, out);
    const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, sx, sy, sisi, sisi, 0, 0, c.width, c.height);
    c.toBlob((b) => { setProses(false); if (b) onSelesai(b); else setGalat(true); }, 'image/jpeg', 0.9);
  }

  if (!siap) return null;
  // Pratinjau kecil memakai perhitungan yang sama, hanya diperkecil.
  const P = 72, r = P / S;
  return createPortal(
    <div className="modal-latar fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/55" onMouseDown={(e) => { if (e.target === e.currentTarget && !proses) onBatal(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="crop-judul" className="modal-kotak font-sans text-ink bg-surface border border-line rounded-xl shadow-[0_12px_32px_rgba(27,38,35,.25)] w-[420px] max-w-full max-h-[94vh] overflow-y-auto">
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div>
            <h2 id="crop-judul" className="m-0 text-[17px] font-bold">Atur Foto Profil</h2>
            <p className="m-0 mt-1 text-sm text-muted">Geser foto dan atur zoom sampai posisinya pas di dalam lingkaran.</p>
          </div>

          {galat ? (
            <div className="rounded-lg bg-danger-soft text-danger text-sm px-4 py-3">Foto tidak dapat dibaca. Coba file lain.</div>
          ) : (
            <>
              <div className="flex justify-center">
                <div
                  ref={bingkai} tabIndex={0} role="img" aria-label="Area potong foto. Gunakan tombol panah untuk menggeser, plus dan minus untuk zoom."
                  data-awal
                  onPointerDown={turun} onPointerMove={gerak} onPointerUp={lepas} onPointerCancel={lepas} onWheel={roda} onKeyDown={tombol}
                  style={{ width: S, height: S, touchAction: 'none' }}
                  className="relative overflow-hidden rounded-lg bg-ink select-none cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {im && <img src={url} alt="" draggable={false} style={{ position: 'absolute', left: S / 2 + off.x - lebar / 2, top: S / 2 + off.y - tinggi / 2, width: lebar, height: tinggi, maxWidth: 'none' }} />}
                  {!im && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80"><i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true"></i>Memuat...</div>}
                  {/* Topeng bulat: area di luar lingkaran digelapkan */}
                  <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: '0 0 0 999px rgba(0,0,0,.55)', border: '2px solid rgba(255,255,255,.9)' }} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => ubahZoom(zoom - 0.25)} aria-label="Perkecil" className="w-9 h-9 shrink-0 rounded-lg border border-line-strong bg-surface text-ink cursor-pointer"><i className="fa-solid fa-minus" aria-hidden="true"></i></button>
                <input type="range" min={1} max={ZOOM_MAKS} step={0.01} value={zoom} onChange={(e) => ubahZoom(parseFloat(e.target.value))} aria-label="Zoom" className="flex-1 min-w-0 accent-brand" />
                <button type="button" onClick={() => ubahZoom(zoom + 0.25)} aria-label="Perbesar" className="w-9 h-9 shrink-0 rounded-lg border border-line-strong bg-surface text-ink cursor-pointer"><i className="fa-solid fa-plus" aria-hidden="true"></i></button>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-well border border-line-soft px-3 py-2.5">
                <div className="relative overflow-hidden rounded-full shrink-0 bg-ink" style={{ width: P, height: P }} aria-hidden="true">
                  {im && <img src={url} alt="" draggable={false} style={{ position: 'absolute', left: P / 2 + off.x * r - lebar * r / 2, top: P / 2 + off.y * r - tinggi * r / 2, width: lebar * r, height: tinggi * r, maxWidth: 'none' }} />}
                </div>
                <div className="text-xs text-muted leading-snug">Pratinjau avatar seperti yang tampil di header dan profil Anda.</div>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3 flex-wrap justify-end px-5 sm:px-6 py-4 bg-well border-t border-line-soft max-sm:flex-col-reverse max-sm:[&>button]:w-full">
          <button type="button" onClick={onBatal} disabled={proses} className={btn}>Batal</button>
          {!galat && <button type="button" onClick={gunakan} disabled={!im || proses} className={btnUtama}><i className={'fa-solid ' + (proses ? 'fa-spinner fa-spin' : 'fa-check')} aria-hidden="true"></i>{proses ? 'Memproses...' : 'Gunakan Foto'}</button>}
        </div>
      </div>
    </div>, document.body);
}
