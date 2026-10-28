import ExcelJS from 'exceljs';
import { getSession } from '@/lib/auth';
import { catat } from '@/lib/db';
import { bacaFilter, logAudit, rekapSurat } from '@/lib/laporan';
import { fmtTanggal, fmtWaktu } from '@/lib/waktu';

export const runtime = 'nodejs';
const MAKS_LOG = 5000;
// Sel yang diawali = + - @ dianggap rumus oleh Excel; beri apostrof agar isi dari pengguna tidak dieksekusi.
const aman = (v: string | null | undefined) => (v && /^[=+\-@\t\r]/.test(v) ? "'" + v : v ?? '');

/** Unduh rekap surat + log audit sesuai filter laporan sebagai file .xlsx. */
export async function GET(req: Request) {
  const ses = await getSession();
  if (!ses) return new Response('Belum login', { status: 401 });
  const f = bacaFilter(Object.fromEntries(new URL(req.url).searchParams));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Arsip Surat Keluar';
  const kepala = (ws: ExcelJS.Worksheet) => { ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; };

  const rekap = wb.addWorksheet('Rekap Surat');
  rekap.columns = [
    { header: 'No', key: 'no', width: 6 }, { header: 'Tanggal', key: 'tgl', width: 14 }, { header: 'No Agenda', key: 'agenda', width: 11 },
    { header: 'No Naskah', key: 'naskah', width: 30 }, { header: 'Sifat', key: 'sifat', width: 10 },
    { header: 'Dari', key: 'dari', width: 24 }, { header: 'Kepada', key: 'kepada', width: 28 }, { header: 'Alamat', key: 'alamat', width: 36 },
    { header: 'Perihal', key: 'perihal', width: 40 }, { header: 'Lampiran', key: 'lampiran', width: 18 }, { header: 'Status', key: 'status', width: 12 },
    { header: 'File', key: 'file', width: 28 }, { header: 'Diarsipkan', key: 'arsip', width: 20 },
  ];
  for (const s of rekapSurat(f)) rekap.addRow({ no: s.no_urut, tgl: fmtTanggal(s.tanggal), agenda: s.agenda, naskah: aman(s.no_naskah), sifat: s.sifat, dari: aman(s.dari), kepada: aman(s.kepada), alamat: aman(s.alamat), perihal: aman(s.perihal), lampiran: aman(s.lampiran), status: s.status, file: aman(s.file_nama), arsip: s.diarsipkan_at ? fmtWaktu(s.diarsipkan_at) : '' });
  kepala(rekap);

  const audit = wb.addWorksheet('Log Audit');
  audit.columns = [{ header: 'Waktu', key: 'waktu', width: 22 }, { header: 'Aksi', key: 'aksi', width: 18 }, { header: 'No Naskah', key: 'naskah', width: 30 }, { header: 'Perihal', key: 'perihal', width: 48 }];
  for (const l of logAudit(f, MAKS_LOG).baris) audit.addRow({ waktu: fmtWaktu(l.waktu), aksi: l.aksi, naskah: aman(l.no_naskah), perihal: aman(l.perihal) });
  kepala(audit);

  const buf = await wb.xlsx.writeBuffer();
  catat(ses.uid, 'Ekspor laporan Excel', `Tahun ${f.tahun}`);
  return new Response(new Uint8Array(buf as ArrayBuffer), { headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="laporan-surat-keluar-${f.tahun}.xlsx"`,
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}
