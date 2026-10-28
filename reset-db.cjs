
const Database = require("better-sqlite3");
const readline = require("node:readline/promises");
const path = require("node:path");

async function main() {
  const dbPath = path.join(__dirname, "data", "app.db");
  const db = new Database(dbPath);

  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND lower(name) NOT IN (
        'migrations',
        'schema_migrations'
      )
    ORDER BY name
  `).all().map(row => row.name);

  console.log("Database:", dbPath);
  console.log("\nTabel yang akan dikosongkan:");
  tables.forEach(name => console.log("- " + name));

  console.log(
    "\nPERINGATAN: Semua data dalam tabel di atas akan dihapus."
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await rl.question(
    '\nKetik RESET untuk melanjutkan: '
  );
  rl.close();

  if (answer !== "RESET") {
    console.log("Reset dibatalkan. Database tidak diubah.");
    db.close();
    return;
  }

  try {
    db.pragma("foreign_keys = OFF");

    db.transaction(() => {
      for (const name of tables) {
        const quotedName = '"' + name.replace(/"/g, '""') + '"';
        db.exec(`DELETE FROM ${quotedName}`);
      }

      // Reset penghitung ID otomatis jika tersedia.
      const hasSequence = db.prepare(`
        SELECT 1
        FROM sqlite_master
        WHERE type = 'table' AND name = 'sqlite_sequence'
      `).get();

      if (hasSequence) {
        db.prepare("DELETE FROM sqlite_sequence").run();
      }
    })();

    console.log("\nReset berhasil.");
    console.log("Struktur tabel tetap dipertahankan.");
  } catch (error) {
    console.error("\nReset gagal:", error.message);
    console.error("Periksa database dan backup sebelum mencoba lagi.");
    process.exitCode = 1;
  } finally {
    db.pragma("foreign_keys = ON");
    db.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
