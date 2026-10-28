/** @type {import('tailwindcss').Config} */
// Warna mengacu ke variabel CSS tema (lihat app/globals.css), jadi seluruh UI ikut berganti saat tema diubah.
const v = (nama) => `rgb(var(--${nama}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: v('canvas'),      // latar halaman
        surface: v('surface'),    // kartu, sidebar, input
        well: v('well'),          // area cekung (dropzone)
        locked: v('locked'),      // kartu terkunci / hanya baca
        inactive: v('inactive'),  // tombol / langkah nonaktif
        line: { DEFAULT: v('line'), strong: v('line-strong'), soft: v('line-soft'), dash: v('line-dash'), mid: v('line-mid') },
        ink: { DEFAULT: v('ink'), 2: v('ink-2') },
        muted: v('muted'),
        faint: v('faint'),
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), soft2: v('brand-soft2'), strong: v('brand-strong') },
        brandfg: v('brand-fg'),   // brand untuk TEKS/ikon di atas surface (di tema gelap lebih terang)
        danger: { DEFAULT: v('danger'), soft: v('danger-soft'), line: v('danger-line') },
        ok: { fg: v('ok-fg'), bg: v('ok-bg'), line: v('ok-line') },
        info: { fg: v('info-fg'), bg: v('info-bg') },
        warn: { fg: v('warn-fg'), bg: v('warn-bg'), bg2: v('warn-bg2'), line: v('warn-line'), ink: v('warn-ink'), accent: v('warn-accent') },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
