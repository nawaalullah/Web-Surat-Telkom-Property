const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** 'YYYY-MM-DD' -> '27 Okt 2026'. */
export function fmtTanggal(t: string | null | undefined): string {
  const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : '-';
}

/** Stempel waktu SQLite (UTC, 'YYYY-MM-DD HH:MM:SS') -> '26 Okt 2026, 09.14' (WIB). */
export function fmtWaktu(t: string | null | undefined): string {
  if (!t) return '-';
  const d = new Date(t.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return '-';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day} ${BULAN[Number(p.month) - 1]} ${p.year}, ${p.hour}.${p.minute}`;
}

/** Selisih hari kalender (bulat) antara stempel SQLite dan sekarang. */
export const umurHari = (t: string | null | undefined): number => {
  const d = new Date(String(t || '').replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / 86400000);
};
