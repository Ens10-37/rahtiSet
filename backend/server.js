const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'mysql-service',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'appdb'
};

let pool;

async function initDB() {
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
initDB();

app.get('/api/time', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS currentTime');
        res.json({ time: rows[0].currentTime });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/visit', async (req, res) => {
    try {
        await pool.query('INSERT INTO visits () VALUES ()');
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM visits');
        res.json({ totalVisits: rows[0].total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});