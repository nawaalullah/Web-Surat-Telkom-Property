/** Isi Pusat Bantuan (data murni, tanpa akses database, aman diimpor komponen client). */

export type LangkahBantuan = {
  id: string; judul: string; ikon: string; ringkas: string; isi: string;
  butir?: string[]; href: string; aksi: string; kata: string;
};

export const LANGKAH: LangkahBantuan[] = [
  {
    id: 'catat', judul: 'Catat surat baru', ikon: 'fa-file-circle-plus', href: '/catat', aksi: 'Catat sekarang',
    ringkas: 'Isi data surat, nomor terbit otomatis.',
    isi: 'Isi 3 bagian: Informasi surat (Sifat dan Perihal), Pihak terkait (Dari, Tanggal surat, Kepada, Alamat), serta Lampiran dan draft. Lalu klik "Simpan & Terbitkan Nomor": nomor naskah dan no agenda terbit otomatis dengan status Reserved.',
    butir: [
      'Pratinjau nomor di sisi kanan menunjukkan nomor yang akan terbit.',
      'Isian form tersimpan otomatis di browser ini, jadi aman jika halaman tertutup.',
      'Draft surat (PDF atau DOCX) boleh dilampirkan sekarang, atau nanti saat unggah surat final.',
    ],
    kata: 'catat buat baru nomor naskah agenda terbit reserved perihal sifat kepada dari lampiran draft form',
  },
  {
    id: 'unggah', judul: 'Unggah surat final', ikon: 'fa-cloud-arrow-up', href: '/belum-diunggah', aksi: 'Buka Belum Diunggah',
    ringkas: 'Lengkapi file agar surat masuk arsip.',
    isi: 'Surat yang nomornya sudah terbit tetapi filenya belum ada tampil di menu Belum Diunggah (lencana angka di sidebar). Klik "Unggah Surat", pilih file surat final, tambah catatan bila perlu, lalu simpan. Status berubah dari Reserved menjadi Terarsip.',
    butir: [
      'Tombol Unggah Surat juga ada di kolom paling kanan halaman Arsip Surat Keluar.',
      'Format dan ukuran file mengikuti Pengaturan > Unggah & File.',
      'Surat yang melewati batas hari pengingat ditandai terlambat.',
    ],
    kata: 'unggah upload file pdf docx belum diunggah reserved terarsip final scan terlambat pengingat',
  },
  {
    id: 'arsip', judul: 'Cari & buka arsip', ikon: 'fa-box-archive', href: '/arsip', aksi: 'Buka Arsip',
    ringkas: 'Cari surat berdasarkan tahun, status, atau kata kunci.',
    isi: 'Halaman Arsip Surat Keluar adalah buku agenda. Pilih tahun, saring berdasarkan status (Semua, Belum diunggah, Sudah diunggah), atau ketik no. agenda, no. naskah, perihal, atau tujuan di kolom cari. Klik nomor naskah untuk membuka detail dan file surat.',
    kata: 'arsip cari filter tahun status detail buku agenda daftar nomor surat',
  },
  {
    id: 'koreksi', judul: 'Koreksi: edit, ganti file, batalkan', ikon: 'fa-pen-to-square', href: '/arsip', aksi: 'Pilih surat di Arsip',
    ringkas: 'Perbaiki data atau batalkan nomor yang tidak jadi dipakai.',
    isi: 'Buka detail surat, lalu pakai panel Tindakan. "Edit Data" mengubah perihal, sifat, tanggal, pihak terkait, dan lampiran. "Ganti File" menimpa file dengan versi baru. "Batalkan nomor" dipakai bila nomor tidak jadi dipakai.',
    butir: [
      'Nomor naskah dan no agenda tidak bisa diubah.',
      'Pembatalan wajib disertai alasan dan tidak bisa dikembalikan. Nomor dan no agendanya dipakai kembali oleh surat berikutnya.',
      'Semua perubahan tercatat di log audit.',
    ],
    kata: 'edit ubah ganti file batalkan batal nomor alasan salah ketik koreksi dibatalkan hapus',
  },
  {
    id: 'laporan', judul: 'Laporan & ekspor', ikon: 'fa-chart-column', href: '/laporan', aksi: 'Buka Laporan',
    ringkas: 'Rekap per periode, log audit, Excel, dan PDF.',
    isi: 'Di Laporan & Audit, pilih tahun dan status untuk melihat ringkasan (terarsip, reserved, dibatalkan, belum diunggah), log audit, dan jumlah surat per pengirim. Unduh rekap lewat tombol Excel, atau PDF lewat dialog cetak.',
    kata: 'laporan audit log excel pdf ekspor export rekap cetak ringkasan pengirim',
  },
  {
    id: 'atur', judul: 'Atur penomoran & aturan file', ikon: 'fa-gear', href: '/pengaturan', aksi: 'Buka Pengaturan',
    ringkas: 'Format nomor, tipe file, pengingat, dan cadangan.',
    isi: 'Di Pengaturan, atur format nomor naskah, reset urutan, nomor mulai dari, tipe dan ukuran file, kewajiban unggah, serta pengingat surat yang belum diunggah. Bagian Cadangan & Ekspor menyimpan salinan database.',
    butir: [
      'Folder uploads/ (file surat) tidak ikut cadangan database dan perlu disalin manual.',
    ],
    kata: 'pengaturan format nomor reset urutan mulai dari tipe ukuran file maksimal wajib unggah pengingat cadangan backup',
  },
];

export type StatusBantuan = { id: 'reserved' | 'terarsip' | 'dibatalkan'; nama: string; kelas: string; arti: string; lanjut: string };

export const STATUS: StatusBantuan[] = [
  { id: 'reserved', nama: 'Reserved', kelas: 'bg-warn-bg text-warn-fg', arti: 'Nomor sudah terbit, tetapi file surat final belum diunggah.', lanjut: 'Unggah surat di menu Belum Diunggah, atau batalkan nomor bila tidak dipakai.' },
  { id: 'terarsip', nama: 'Terarsip', kelas: 'bg-ok-bg text-ok-fg', arti: 'Surat lengkap: nomor, data, dan file sudah tersimpan di arsip.', lanjut: 'Data bisa diedit dan file bisa diganti kapan saja.' },
  { id: 'dibatalkan', nama: 'Dibatalkan', kelas: 'bg-line-soft text-ink-2', arti: 'Nomor tidak jadi dipakai. Surat dicoret di arsip dan nomor serta no agendanya dipakai kembali oleh surat berikutnya.', lanjut: 'Tidak ada tindakan lanjutan. Alasan pembatalan tercatat di log audit.' },
];

export const TANYA: { t: string; j: string }[] = [
  { t: 'Salah isi perihal atau tujuan setelah nomor terbit. Bagaimana?', j: 'Buka detail surat, klik Edit Data. Perihal, sifat, tanggal, dari, kepada, alamat, dan lampiran bisa diubah. Hanya nomor naskah dan no agenda yang terkunci.' },
  { t: 'Nomor tidak jadi dipakai, apakah bisa dihapus?', j: 'Nomor tidak dihapus, tetapi dibatalkan: klik Batalkan nomor, isi alasan. Suratnya tetap tercatat dan dicoret di arsip, sedangkan nomor naskah dan no agendanya dipakai kembali oleh surat berikutnya (bukan nomor baru). Pembatalan tidak bisa dikembalikan.' },
  { t: 'File apa yang boleh diunggah?', j: 'Secara bawaan PDF dan DOCX, maksimal 10 MB. Tipe dan batas ukuran bisa diubah di Pengaturan > Unggah & File.' },
  { t: 'Salah mengunggah file. Bagaimana menggantinya?', j: 'Di Arsip atau halaman detail, klik ikon Ganti File pada surat yang bersangkutan, pilih file yang benar, lalu simpan.' },
  { t: 'Isian form Catat Surat hilang atau pindah perangkat?', j: 'Draft form disimpan di browser perangkat ini saja, jadi tidak ikut pindah ke perangkat lain. Draft dibersihkan otomatis setelah nomor terbit.' },
  { t: 'Mengapa ada surat yang ditandai terlambat?', j: 'Surat berstatus Reserved yang belum diunggah melewati batas hari pengingat. Atur di Pengaturan > Pengingat.' },
  { t: 'Bagaimana mengubah format atau awal nomor?', j: 'Pengaturan > Penomoran. Format memakai [NO], [KODE], dan [TAHUN] ditambah teks tetap, dan urutan bisa direset tiap tahun.' },
  { t: 'Bagaimana mengunduh rekap surat?', j: 'Buka Laporan & Audit, pilih tahun dan status, lalu klik Excel untuk berkas rekap atau PDF untuk dicetak.' },
  { t: 'Bagaimana mencadangkan data?', j: 'Pengaturan > Cadangan & Ekspor untuk database. File surat ada di folder uploads/ pada server dan perlu disalin manual.' },
  { t: 'Bagaimana mengganti tema tampilan?', j: 'Klik tombol palet warna di kanan atas, lalu pilih tema. Pilihan tersimpan di browser ini.' },
];

export const KUNCI_PAHAM = 'bantuan-paham';
