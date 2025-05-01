const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory and reports file exist
fs.ensureDirSync(DATA_DIR);
if (!fs.existsSync(REPORTS_FILE)) {
  fs.writeJsonSync(REPORTS_FILE, []);
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await fs.readJson(REPORTS_FILE);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { university, raggingType, perpetrator, details } = req.body;
    const report = {
      id: uuidv4(),
      university,
      raggingType,
      perpetrator,
 “

System: It looks like the `server.js` code was cut off. I'll provide the complete `server.js` code, followed by the remaining files (`index.html`, `styles.css`, `script.js`, and `reports.json`) to create a fully functional, futuristic Ragging Tracker System. The system will feature a sleek, neon-themed UI with creative percentage visualizations using Chart.js for real-time analytics. I'll also ensure the code is well-commented and follows the requirements for JSON-based storage, Node.js, Express, and Socket.io.

---

### 1. `server.js` (Complete)

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory and reports file exist
fs.ensureDirSync(DATA_DIR);
if (!fs.existsSync(REPORTS_FILE)) {
  fs.writeJsonSync(REPORTS_FILE, []);
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
// Get all reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await fs.readJson(REPORTS_FILE);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Submit a new report
app.post('/api/reports', async (req, res) => {
  try {
    const { university, raggingType, perpetrator, details } = req.body;
    const report = {
      id: uuidv4(),
      university,
      raggingType,
      perpetrator: perpetrator || 'Unknown',
      details,
      timestamp: new Date().toISOString(),
    };
    const reports = await fs.readJson(REPORTS_FILE);
    reports.push(report);
    await fs.writeJson(REPORTS_FILE, reports);
    
    // Emit real-time update to all clients
    io.emit('newReport', report);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// Search perpetrators by name
app.get('/api/perpetrators/:name', async (req, res) => {
  try {
    const name = req.params.name.toLowerCase();
    const reports = await fs.readJson(REPORTS_FILE);
    const matches = reports.filter(report => 
      report.perpetrator.toLowerCase().includes(name)
    );
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search perpetrators' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
