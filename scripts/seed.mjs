// Membuat satu-satunya akun. Contoh:
//   AKUN_PASSWORD='password-panjang-anda' npm run seed
// Opsional: AKUN_USERNAME (bawaan: admin), AKUN_NAMA, AKUN_JABATAN. Aman diulang: bila akun sudah ada, tidak diubah.
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const pw = process.env.AKUN_PASSWORD || '';
if (pw.length < 10) {
  console.error("Set AKUN_PASSWORD (minimal 10 karakter), mis.: AKUN_PASSWORD='...' npm run seed");
  process.exit(1);
}
const username = (process.env.AKUN_USERNAME || 'admin').trim();
const nama = (process.env.AKUN_NAMA || 'Sekretariat').trim();
const jabatan = (process.env.AKUN_JABATAN || 'Sekretariat').trim();

const dir = path.join(process.cwd(), 'data');
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, 'app.db'));
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));

if (db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  console.log('Akun sudah ada, tidak ada yang diubah. Ganti password lewat halaman Profil Saya.');
} else {
  db.prepare('INSERT INTO users(username, nama, password_hash, jabatan) VALUES(?, ?, ?, ?)').run(username, nama, bcrypt.hashSync(pw, 12), jabatan);
  console.log(`Seed selesai: akun "${username}" dibuat.`);
}
