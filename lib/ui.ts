// Kelas Tailwind yang dipakai bersama di halaman baru (mengikuti gaya halaman yang sudah ada).
export const card = 'bg-surface border border-line rounded-xl p-4 sm:p-5';
export const th = 'text-left text-xs text-muted px-3 py-2.5 border-b border-line whitespace-nowrap';
export const td = 'px-3 py-3.5 border-b border-line-soft';
export const inp = 'border border-line-strong rounded-lg px-3.5 py-2.5 text-sm w-full min-h-[44px] mt-1.5 bg-surface font-semibold placeholder:font-normal placeholder:text-faint';
export const lbl = 'block text-[13px] font-bold';
export const lk = 'text-brandfg font-bold no-underline';
export const bl = 'bg-transparent border-0 p-0 cursor-pointer text-sm font-bold text-brandfg';
const b = 'min-h-[44px] px-5 inline-flex items-center justify-center rounded-lg font-bold text-sm border border-brand no-underline cursor-pointer ';
export const btnP = b + 'bg-brand text-white';
export const btnO = b + 'bg-surface text-brandfg';
export const h1 = 'm-0 text-[22px] sm:text-[26px] font-bold';
export const sub = 'text-sm text-muted mt-1';
export const pillCls = 'inline-block px-2.5 py-1 rounded-full text-xs font-bold ';
export const pillRole: Record<string, [string, string]> = { staff: ['Staff', 'bg-info-bg text-info-fg'], admin: ['Admin', 'bg-warn-bg2 text-warn-fg'] };
