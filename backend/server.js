const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'appdb'
};
let pool;

const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:6379`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function initServices() {
    await redisClient.connect();
    console.log("Connected to Redis.");

    pool = mysql.createPool(dbConfig);
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Database initialized successfully.");
    } catch (err) {
        console.error("Database initialization failed:", err);
    }
}
initServices();

app.get('/api/time', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS currentTime');
        res.json({ time: rows[0].currentTime });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/visits', async (req, res) => {
    try {
        const cachedVisits = await redisClient.get('totalVisits');
        
        if (cachedVisits) {
            return res.json({ totalVisits: parseInt(cachedVisits), source: 'Redis Cache' });
        }

        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM visits');
        const total = rows[0].total;

        await redisClient.setEx('totalVisits', 60, total.toString());

        res.json({ totalVisits: total, source: 'MySQL Database' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/visit', async (req, res) => {
    try {
        await pool.query('INSERT INTO visits () VALUES ()');
        await redisClient.del('totalVisits');
        res.json({ success: true, message: "Visit recorded and cache cleared." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});