'use client';
import { useState, type DragEvent } from 'react';

/**
 * Drag & drop file ke sebuah area. Pakai: `const dz = useSeret((fl) => kirim(fl), busy);`
 * lalu `<div {...dz.props} className={'... ' + dz.kelas}>`.
 * `kelas` berisi sorotan visual saat file sedang diseret di atas area (kosong jika tidak).
 */
export function useSeret(onFiles: (fl: FileList) => void, nonaktif = false) {
  const [seret, setSeret] = useState(false);
  const adaFile = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
  return {
    seret,
    kelas: seret ? ' ring-2 ring-brand bg-brand-soft ' : '',
    props: {
      onDragOver: (e: DragEvent) => { if (nonaktif || !adaFile(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; if (!seret) setSeret(true); },
      onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSeret(false); },
      onDrop: (e: DragEvent) => {
        if (!adaFile(e)) return;
        e.preventDefault(); setSeret(false);
        if (!nonaktif && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      },
    },
  };
}
