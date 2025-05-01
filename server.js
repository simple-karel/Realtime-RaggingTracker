const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON
app.use(express.json());

// Ensure data directory and reports.json exist
const reportsFilePath = path.join(__dirname, 'data', 'reports.json');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(reportsFilePath)) {
  fs.writeFileSync(reportsFilePath, JSON.stringify([], null, 2));
}

// API to get reports
app.get('/api/reports', (req, res) => {
  fs.readFile(reportsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading reports:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(JSON.parse(data));
  });
});

// API to submit a new report
app.post('/api/reports', (req, res) => {
  const newReport = {
    id: Date.now(),
    university: req.body.university,
    raggingType: req.body.raggingType,
    perpetrator: req.body.perpetrator || 'Anonymous',
    details: req.body.details,
    timestamp: new Date().toISOString()
  };

  fs.readFile(reportsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading reports:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const reports = JSON.parse(data);
    reports.push(newReport);

    fs.writeFile(reportsFilePath, JSON.stringify(reports, null, 2), (err) => {
      if (err) {
        console.error('Error writing reports:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Emit the new report to all connected clients
      io.emit('newReport', newReport);
      res.status(201).json(newReport);
    });
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
