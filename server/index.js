// İLK İŞ: Herhangi bir kod çalışmadan önce .env dosyasındaki değişkenleri yükle.
require('dotenv').config(); 

// Gerekli kütüphaneleri import ediyoruz
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Veritabanı yapılandırmamızı import ediyoruz
const db = require('./config/db');

// Veritabanı bağlantısını test etmek için bir fonksiyon
const testDbConnection = async () => {
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Veritabanı bağlantısı başarılı.');
  } catch (error) {
    console.error('❌ Veritabanına bağlanırken hata oluştu:', error);
  }
};

const app = express();
app.use(cors());
app.use(express.json());


// --- YETKİLENDİRME MIDDLEWARE'LERİ ---

// Token'ı doğrulayan middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'Yetkisiz erişim: Token bulunamadı.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş token.' });
        req.user = user;
        next();
    });
};

// Kullanıcının rolünün 'admin' olup olmadığını kontrol eden middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Erişim reddedildi: Bu işlem için admin yetkisi gerekir.' });
    }
    next();
};

// Kullanıcının rolünün 'business' olup olmadığını kontrol eden middleware
const isBusiness = (req, res, next) => {
    if (req.user.role !== 'business') {
        return res.status(403).json({ message: 'Erişim reddedildi: Bu işlem için işletme yetkisi gerekir.' });
    }
    next();
};


// --- API ENDPOINT'LERİ ---

// KULLANICI KAYIT ENDPOINT'İ (/api/register)
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-posta ve şifre alanları zorunludur.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at, role",
      [email, hashedPassword]
    );
    res.status(201).json({ 
      message: 'Kullanıcı başarıyla oluşturuldu.',
      user: newUser.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
    }
    console.error('Kayıt sırasında hata:', error);
    res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
  }
});

// KULLANICI GİRİŞ ENDPOINT'İ (/api/login)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.status(200).json({
            message: 'Giriş başarılı!',
            token: token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Giriş sırasında hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
});

// KORUMALI PROFİL YOLU (Her giriş yapan erişebilir)
app.get('/api/profile', verifyToken, (req, res) => {
    res.json({ message: 'Profil bilgileri başarıyla alındı.', user: req.user });
});

// --- ADMIN'E ÖZEL YOLLAR ---
app.get('/api/admin/users', [verifyToken, isAdmin], async (req, res) => {
    try {
        const result = await db.query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Kullanıcılar listelenirken hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
});

// --- İŞLETMEYE ÖZEL YOLLAR ---
app.get('/api/business/dashboard', [verifyToken, isBusiness], (req, res) => {
    res.json({ message: `Hoş geldin, İşletme Sahibi: ${req.user.email}`});
});

// YENİ: ETKİNLİK OLUŞTURMA YOLU
app.post('/api/events', [verifyToken, isBusiness], async (req, res) => {
    const pool = db.getPool();
    const client = await pool.connect();

    try {
        const { name, description, event_date, location, category, ticket_types } = req.body;
        const organizer_id = req.user.id; 
        
        await client.query('BEGIN');

        const eventInsertQuery = `
            INSERT INTO events (name, description, event_date, location, category, organizer_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;
        const eventValues = [name, description, event_date, location, category, organizer_id];
        const newEvent = await client.query(eventInsertQuery, eventValues);
        const eventId = newEvent.rows[0].id;

        for (const type of ticket_types) {
            const ticketTypeInsertQuery = `
                INSERT INTO ticket_types (name, price, capacity, event_id)
                VALUES ($1, $2, $3, $4);
            `;
            const ticketTypeValues = [type.name, type.price, type.capacity, eventId];
            await client.query(ticketTypeInsertQuery, ticketTypeValues);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Etkinlik ve bilet türleri başarıyla oluşturuldu.', eventId: eventId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Etkinlik oluşturma sırasında hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    } finally {
        client.release();
    }
});


// Basit bir test route'u
app.get('/api', (req, res) => {
  res.json({ message: 'Eventix Backend API Çalışıyor!' });
});

const PORT = process.env.PORT || 5000;
testDbConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Sunucu ${PORT} portunda başarıyla başlatıldı.`);
    });
});