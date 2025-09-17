// İLK İŞ: Herhangi bir kod çalışmadan önce .env dosyasındaki değişkenleri yükle.
require('dotenv').config(); 

// Gerekli kütüphaneleri import ediyoruz
const express = require('express');
const cors = require('cors');

// Veritabanı yapılandırmamızı import ediyoruz
const db = require('./config/db');

// Veritabanı bağlantısını test etmek için bir fonksiyon
const testDbConnection = async () => {
  try {
    // Veritabanından şu anki zamanı isteyerek basit bir sorgu çalıştırıyoruz
    await db.query('SELECT NOW()');
    console.log('✅ Veritabanı bağlantısı başarılı.');
  } catch (error) {
    console.error('❌ Veritabanına bağlanırken hata oluştu:', error);
  }
};

// Express uygulamasını oluşturuyoruz
const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json());

// Basit bir test route'u
app.get('/api', (req, res) => {
  res.json({ message: 'Eventix Backend API Çalışıyor!' });
});

// Port numarasını .env dosyasından al, eğer yoksa varsayılan olarak 5000 kullan
const PORT = process.env.PORT || 5000;

// Sunucuyu başlatmadan önce veritabanı bağlantısını test et
testDbConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Sunucu ${PORT} portunda başarıyla başlatıldı.`);
    });
});