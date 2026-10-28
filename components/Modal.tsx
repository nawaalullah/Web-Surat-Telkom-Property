'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TipeModal = 'error' | 'sukses' | 'peringatan' | 'info';

export const GAYA_MODAL: Record<TipeModal, { ikon: string; judul: string; lingkar: string }> = {
  error: { ikon: 'fa-circle-exclamation', judul: 'Terjadi Kesalahan', lingkar: 'bg-danger-soft text-danger' },
  sukses: { ikon: 'fa-circle-check', judul: 'Berhasil', lingkar: 'bg-ok-bg text-ok-fg' },
  peringatan: { ikon: 'fa-triangle-exclamation', judul: 'Perhatian', lingkar: 'bg-warn-bg text-warn-fg' },
  info: { ikon: 'fa-circle-info', judul: 'Informasi', lingkar: 'bg-line-soft text-ink-2' },
};

/** Tebak jenis modal dari isi pesan (dipakai untuk pesan hasil server action / fetch). */
export function tipeOtomatis(pesan: string): TipeModal {
  return /tersimpan|berhasil|dihapus|diperbarui|diunggah/i.test(pesan) && !/gagal|tidak/i.test(pesan) ? 'sukses' : 'error';
}

/** Tombol modal memakai kelas tombol situs (lib/ui.ts) supaya identik dengan tombol di halaman. */
export { btnP as tombolUtama, btnO as tombolSekunder } from '@/lib/ui';

/**
 * Kerangka modal: overlay + dialog di tengah layar.
 * Esc / klik latar menutup, fokus terkunci di dalam dialog, scroll halaman dikunci,
 * dan fokus dikembalikan ke elemen semula saat ditutup.
 * Elemen dengan atribut data-awal akan menerima fokus pertama kali.
 */
export function ModalDasar({ tipe, judul, pesan, onTutup, children }: { tipe: TipeModal; judul: string; pesan: string; onTutup: () => void; children: React.ReactNode }) {
  const kotak = useRef<HTMLDivElement>(null), tutupRef = useRef(onTutup), id = useId();
  tutupRef.current = onTutup;
  const [siap, setSiap] = useState(false);
  useEffect(() => setSiap(true), []);

  useEffect(() => {
    if (!siap) return;
    const sebelum = document.activeElement as HTMLElement | null, overflowAsal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    kotak.current?.querySelector<HTMLElement>('[data-awal]')?.focus();
    function tombol(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tutupRef.current(); return; }
      if (e.key !== 'Tab') return;
      const el = Array.from(kotak.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
      if (!el.length) return;
      const a = el[0], z = el[el.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
    document.addEventListener('keydown', tombol);
    return () => { document.removeEventListener('keydown', tombol); document.body.style.overflow = overflowAsal; sebelum?.focus?.(); };
  }, [siap]);

  if (!siap) return null;
  const g = GAYA_MODAL[tipe];
  return createPortal(
    <div className="modal-latar fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-ink/55" onMouseDown={(e) => { if (e.target === e.currentTarget) tutupRef.current(); }}>
      <div ref={kotak} role={tipe === 'error' || tipe === 'peringatan' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={id + 'j'} aria-describedby={id + 'p'}
        className="modal-kotak font-sans text-ink bg-surface border border-line rounded-xl shadow-[0_12px_32px_rgba(27,38,35,.18)] w-[460px] max-w-full max-h-[90vh] overflow-y-auto">
        <div className="flex gap-4 items-start p-5 sm:p-6">
          <span className={'shrink-0 w-11 h-11 rounded-full inline-flex items-center justify-center text-xl ' + g.lingkar}><i className={'fa-solid ' + g.ikon} aria-hidden="true"></i></span>
          <div className="min-w-0 flex-1">
            <h2 id={id + 'j'} className="m-0 text-[17px] font-bold">{judul}</h2>
            <p id={id + 'p'} className="mt-2 mb-0 text-sm leading-relaxed text-ink-2 whitespace-pre-line">{pesan}</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-end px-5 sm:px-6 py-4 bg-well border-t border-line-soft max-sm:flex-col-reverse max-sm:[&>button]:w-full">{children}</div>
      </div>
    </div>, document.body);
}
