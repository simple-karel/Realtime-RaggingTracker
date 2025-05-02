const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  user: 'deployuser',
  host: 'localhost',
  database: 'ragging_radar',
  password: 'yourpassword',
  port: 5432,
});

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      university TEXT,
      raggingType TEXT,
      perpetrator TEXT,
      details TEXT,
      timestamp TIMESTAMP
    )
  `);
})();

app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

app.post('/api/reports', async (req, res) => {
  const report = { ...req.body, id: uuidv4(), timestamp: new Date() };
  try {
    await pool.query(
      'INSERT INTO reports (id, university, raggingType, perpetrator, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      [report.id, report.university, report.raggingType, report.perpetrator, report.details, report.timestamp]
    );
    io.emit('newReport', report);
    res.status(200).json({ message: 'Report submitted', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting report' });
  }
});

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
