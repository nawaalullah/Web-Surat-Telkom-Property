// Daftar tema. Nilai warna tiap tema ada di app/globals.css ([data-tema="..."]).
export type Tema = { id: string; nama: string; grup: 'Telkom' | 'Tailwind'; mode: 'Terang' | 'Gelap'; ket: string };

export const KUNCI_TEMA = 'tema';
export const TEMA_DEFAULT = 'telkom-light';

export const daftarTema: Tema[] = [
  { id: 'telkom-light', nama: 'Light Telkom', grup: 'Telkom', mode: 'Terang', ket: 'Merah & putih bawaan' },
  { id: 'telkom-dark', nama: 'Dark Telkom', grup: 'Telkom', mode: 'Gelap', ket: 'Arang dengan aksen merah' },
  { id: 'ocean', nama: 'Ocean', grup: 'Tailwind', mode: 'Terang', ket: 'Blue 600' },
  { id: 'emerald', nama: 'Emerald', grup: 'Tailwind', mode: 'Terang', ket: 'Emerald 700' },
  { id: 'violet', nama: 'Violet', grup: 'Tailwind', mode: 'Terang', ket: 'Violet 600' },
  { id: 'sunset', nama: 'Sunset', grup: 'Tailwind', mode: 'Terang', ket: 'Orange 700' },
  { id: 'midnight', nama: 'Midnight', grup: 'Tailwind', mode: 'Gelap', ket: 'Indigo malam' },
  { id: 'forest', nama: 'Forest', grup: 'Tailwind', mode: 'Gelap', ket: 'Emerald malam' },
];

export const idTemaValid = (id: string | null | undefined): id is string => !!id && daftarTema.some((t) => t.id === id);

// Dijalankan di <head> sebelum halaman tampil, agar tidak berkedip dari terang ke gelap saat dimuat ulang.
export const skripTemaAwal = `try{var t=localStorage.getItem('${KUNCI_TEMA}');if(t&&${JSON.stringify(daftarTema.map((x) => x.id))}.indexOf(t)>-1)document.documentElement.setAttribute('data-tema',t)}catch(e){}`;
