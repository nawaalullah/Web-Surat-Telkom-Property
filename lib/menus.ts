export type ItemMenu = { teks: string; href: string; ikon: string; badge?: number };

export const menuUtama: ItemMenu[] = [
  { teks: 'Arsip Surat Keluar', href: '/arsip', ikon: 'fa-box-archive' },
  { teks: 'Catat Surat Baru', href: '/catat', ikon: 'fa-file-circle-plus' },
  { teks: 'Belum Diunggah', href: '/belum-diunggah', ikon: 'fa-cloud-arrow-up' },
  { teks: 'Laporan & Audit', href: '/laporan', ikon: 'fa-chart-column' },
];

export const menuPengaturan: ItemMenu[] = [
  { teks: 'Pengaturan', href: '/pengaturan', ikon: 'fa-gear' },
];
