// İLK İŞ: Herhangi bir kod çalışmadan önce .env dosyasındaki değişkenleri yükle.
require('dotenv').config(); 

// Gerekli kütüphaneleri import ediyoruz
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Erişim reddedildi: Bu işlem için admin yetkisi gerekir.' });
    }
    next();
};

const isBusiness = (req, res, next) => {
    if (req.user.role !== 'business') {
        return res.status(403).json({ message: 'Erişim reddedildi: Bu işlem için işletme yetkisi gerekir.' });
    }
    next();
};

const isEndUser = (req, res, next) => {
    if (req.user.role !== 'end_user') {
        return res.status(403).json({ message: 'Erişim reddedildi: Bu işlem için kullanıcı yetkisi gerekir.' });
    }
    next();
};


// --- API ENDPOINT'LERİ ---

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'E-posta ve şifre alanları zorunludur.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at, role", [email, hashedPassword]);
    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu.', user: newUser.rows[0]});
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
    console.error('Kayıt sırasında hata:', error);
    res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
  }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Giriş başarılı!', token: token, user: { id: user.id, email: user.email, role: user.role }});
    } catch (error) {
        console.error('Giriş sırasında hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
});

app.get('/api/profile', verifyToken, (req, res) => {
    res.json({ message: 'Profil bilgileri başarıyla alındı.', user: req.user });
});

app.get('/api/events', async (req, res) => {
    try {
        const query = `SELECT events.*, users.email as organizer_email FROM events JOIN users ON events.organizer_id = users.id WHERE events.status = 'scheduled' ORDER BY events.event_date ASC;`;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Etkinlikler listelenirken hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
});

app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const eventQuery = `SELECT events.*, users.email as organizer_email, users.commission_rate FROM events JOIN users ON events.organizer_id = users.id WHERE events.id = $1;`;
        const eventResult = await db.query(eventQuery, [id]);
        if (eventResult.rows.length === 0) return res.status(404).json({ message: 'Etkinlik bulunamadı.' });
        const event = eventResult.rows[0];
        const commission_rate = parseFloat(event.commission_rate);
        const ticketTypesQuery = "SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY price ASC;";
        const ticketTypesResult = await db.query(ticketTypesQuery, [id]);
        
        const ticket_types_with_final_price = ticketTypesResult.rows.map(ticket => {
            const net_price = parseFloat(ticket.price);
            const service_fee = net_price * commission_rate;
            const final_price = net_price + service_fee;
            return {
                ...ticket,
                service_fee: service_fee.toFixed(2),
                final_price: final_price.toFixed(2)
            };
        });
        
        res.status(200).json({ ...event, ticket_types: ticket_types_with_final_price });
    } catch (error) {
        console.error('Etkinlik detayı alınırken hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
});

app.post('/api/tickets', [verifyToken, isEndUser], async (req, res) => {
    const pool = db.getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { ticket_type_id } = req.body;
        const user_id = req.user.id;
        const ticketTypeRes = await db.query("SELECT event_id, price FROM ticket_types WHERE id = $1", [ticket_type_id]);
        if (ticketTypeRes.rows.length === 0) throw new Error('Bilet türü bulunamadı.');
        const { event_id, price } = ticketTypeRes.rows[0];
        const eventRes = await db.query("SELECT organizer_id FROM events WHERE id = $1", [event_id]);
        const organizer_id = eventRes.rows[0].organizer_id;
        const organizerRes = await db.query("SELECT commission_rate FROM users WHERE id = $1", [organizer_id]);
        const commission_rate = parseFloat(organizerRes.rows[0].commission_rate);
        const qr_code = crypto.randomBytes(16).toString('hex');
        const ticketInsertQuery = `INSERT INTO tickets (qr_code, user_id, event_id, ticket_type_id) VALUES ($1, $2, $3, $4) RETURNING id;`;
        const ticketValues = [qr_code, user_id, event_id, ticket_type_id];
        const newTicket = await client.query(ticketInsertQuery, ticketValues);
        const ticket_id = newTicket.rows[0].id;
        const net_amount = parseFloat(price);
        const commission_amount = net_amount * commission_rate;
        const gross_amount = net_amount + commission_amount;
        const transactionInsertQuery = `INSERT INTO transactions (ticket_id, organizer_id, gross_amount, commission_rate, commission_amount, net_amount) VALUES ($1, $2, $3, $4, $5, $6);`;
        const transactionValues = [ticket_id, organizer_id, gross_amount, commission_rate, commission_amount, net_amount];
        await client.query(transactionInsertQuery, transactionValues);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Bilet başarıyla oluşturuldu ve işlem kaydedildi!', ticket: { id: ticket_id, qr_code }});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Bilet oluşturma sırasında hata:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    } finally {
        client.release();
    }
});

// --- ADMİN'E ÖZEL YOLLAR ---
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
app.post('/api/events', [verifyToken, isBusiness], async (req, res) => {
    const pool = db.getPool();
    const client = await pool.connect();
    try {
        const { name, description, event_date, location, category, ticket_types } = req.body;
        const organizer_id = req.user.id; 
        await client.query('BEGIN');
        const eventInsertQuery = `INSERT INTO events (name, description, event_date, location, category, organizer_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;
        const eventValues = [name, description, event_date, location, category, organizer_id];
        const newEvent = await client.query(eventInsertQuery, eventValues);
        const eventId = newEvent.rows[0].id;
        for (const type of ticket_types) {
            const ticketTypeInsertQuery = `INSERT INTO ticket_types (name, price, capacity, event_id) VALUES ($1, $2, $3, $4);`;
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

// --- BASİT TEST YOLU ---
app.get('/api', (req, res) => {
  res.json({ message: 'Eventix Backend API Çalışıyor!' });
});

const PORT = process.env.PORT || 5000;
testDbConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Sunucu ${PORT} portunda başarıyla başlatıldı.`);
    });
});