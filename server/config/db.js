// Gerekli pg kütüphanesinden Pool'u import ediyoruz.
const { Pool } = require('pg');

// .env dosyasındaki veritabanı URL'sini kullanarak yeni bir havuz (pool) oluşturuyoruz.
// SSL ayarı, Supabase gibi bulut veritabanlarına güvenli bağlanmak için gereklidir.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Bu havuzu (pool) başka dosyalarda kullanabilmek için export ediyoruz.
module.exports = {
  query: (text, params) => pool.query(text, params),
};