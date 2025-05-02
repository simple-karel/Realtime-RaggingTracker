const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

let reports = fs.existsSync('reports.json') ? fs.readJSONSync('reports.json') : [];

app.get('/api/reports', (req, res) => {
  res.json(reports);
});

app.post('/api/reports', (req, res) => {
  const report = { ...req.body, id: uuidv4(), timestamp: new Date() };
  reports.push(report);
  fs.writeJSONSync('reports.json', reports);
  io.emit('newReport', report);
  res.status(200).json({ message: 'Report submitted', report });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
