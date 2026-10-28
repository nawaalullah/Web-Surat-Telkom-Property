/**
 * Reset data aplikasi TANPA menyentuh akun.
 *
 * Dikosongkan : surat, nomor_urut (nomor kembali mulai 001), log_aktivitas, dan tabel lain selain yang dikecualikan.
 *               File surat di folder uploads/ ikut dihapus (draft dan final).
 * Dipertahankan: users (username, nama, password, jabatan, foto), meta, dan tabel migrasi.
 *               Foto profil di data/avatar/ juga tidak disentuh.
 * Opsi         : --simpan-pengaturan  tabel pengaturan (format nomor, batas ukuran file, pengingat) tidak ikut dikosongkan.
 *
 * Sebelum menghapus, salinan database dibuat otomatis di data/cadangan-sebelum-reset-<waktu>.db.
 * Hentikan aplikasi (pm2 stop / Ctrl+C) sebelum menjalankan:   node reset-data.cjs
 */
const Database = require("better-sqlite3");
const readline = require("node:readline/promises");
const path = require("node:path");
const fs = require("node:fs");

const simpanPengaturan = process.argv.includes("--simpan-pengaturan");
const DIPERTAHANKAN = new Set(["users", "meta", "migrations", "schema_migrations", ...(simpanPengaturan ? ["pengaturan"] : [])]);

async function main() {
  const dbPath = path.join(__dirname, "data", "app.db");
  if (!fs.existsSync(dbPath)) {
    console.error("Database tidak ditemukan:", dbPath);
    process.exitCode = 1;
    return;
  }
  const uploads = path.join(__dirname, "uploads");
  const db = new Database(dbPath);

  const semua = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all().map((r) => r.name);
  const dikosongkan = semua.filter((n) => !DIPERTAHANKAN.has(n.toLowerCase()));
  const dipertahankan = semua.filter((n) => DIPERTAHANKAN.has(n.toLowerCase()));
  const q = (n) => '"' + n.replace(/"/g, '""') + '"';
  const jumlah = (n) => db.prepare(`SELECT COUNT(*) AS n FROM ${q(n)}`).get().n;

  console.log("Database:", dbPath);
  console.log("\nTabel yang akan DIKOSONGKAN:");
  dikosongkan.forEach((n) => console.log(`- ${n} (${jumlah(n)} baris)`));
  console.log("\nTabel yang DIPERTAHANKAN:");
  dipertahankan.forEach((n) => console.log(`- ${n} (${jumlah(n)} baris)`));
  console.log(`\nFolder uploads/ (file surat) ${fs.existsSync(uploads) ? "akan DIHAPUS isinya." : "tidak ada, dilewati."}`);
  console.log("\nPERINGATAN: data di atas tidak bisa dikembalikan, kecuali dari salinan cadangan yang dibuat otomatis.");

  if (!dipertahankan.includes("users") || jumlah("users") === 0) {
    console.error("\nTabel users kosong atau tidak ada. Dibatalkan supaya Anda tidak kehilangan akses.");
    db.close();
    process.exitCode = 1;
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const jawab = await rl.question("\nKetik RESET untuk melanjutkan: ");
  rl.close();
  if (jawab !== "RESET") {
    console.log("Reset dibatalkan. Database tidak diubah.");
    db.close();
    return;
  }

  try {
    const stempel = new Date().toISOString().replace(/[:.]/g, "-");
    const cadangan = path.join(__dirname, "data", `cadangan-sebelum-reset-${stempel}.db`);
    await db.backup(cadangan);
    console.log("\nCadangan dibuat:", cadangan);

    db.pragma("foreign_keys = OFF");
    db.transaction(() => {
      for (const n of dikosongkan) db.exec(`DELETE FROM ${q(n)}`);
      // Hanya penghitung ID milik tabel yang dikosongkan yang direset; milik users tidak disentuh.
      if (db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence'`).get()) {
        const hapus = db.prepare("DELETE FROM sqlite_sequence WHERE name = ?");
        for (const n of dikosongkan) hapus.run(n);
      }
    })();

    if (fs.existsSync(uploads)) {
      fs.rmSync(uploads, { recursive: true, force: true });
      console.log("Isi uploads/ dihapus.");
    }
    db.exec("VACUUM");
    console.log("\nReset berhasil. Akun login tidak berubah.");
    console.log("Struktur tabel tetap dipertahankan.");
  } catch (error) {
    console.error("\nReset gagal:", error.message);
    console.error("Database asli ada di", dbPath, "dan salinan cadangan (bila sudah dibuat) ada di folder data/.");
    process.exitCode = 1;
  } finally {
    try { db.pragma("foreign_keys = ON"); db.close(); } catch { /* sudah tertutup */ }
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
