'use client';
import { useState } from 'react';
/** Kolom password dengan tombol ikon mata (Font Awesome) untuk menampilkan atau menyembunyikan isinya. */
export default function InputPassword({ className = '', ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [tampil, setTampil] = useState(false);
  return (<div className="relative">
    <input {...rest} type={tampil ? 'text' : 'password'} className={className + ' pr-11'} />
    <button type="button" onClick={() => setTampil((v) => !v)} aria-label={tampil ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={tampil}
      className="absolute right-0 bottom-0 h-[44px] w-11 flex items-center justify-center bg-transparent border-0 text-muted cursor-pointer">
      <i className={'fa-solid ' + (tampil ? 'fa-eye-slash' : 'fa-eye')} aria-hidden="true"></i></button></div>);
}
