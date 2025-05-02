// This server file serves dual purpose:
// 1. Acts as a regular Express server for local development
// 2. Exports handlers for Netlify Functions

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const serverless = require('serverless-http');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Create Express app
const app = express();

// Setup for local development (ignored by Netlify Functions)
let server;
let io;
if (process.env.NODE_ENV !== 'production') {
  server = http.createServer(app);
  io = socketIo(server);
  
  // Socket.io connection for local development
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility function to get data file path - only used in local development
const getDataFilePath = () => {
  const dataDir = path.join(__dirname, 'data');
  const filePath = path.join(dataDir, 'reports.json');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Ensure reports.json exists
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
  
  return filePath;
};

// Data storage - changes based on environment
const saveReport = async (report) => {
  if (process.env.NETLIFY) {
    // In Netlify, use FaunaDB or another database service
    // This is just a placeholder - you need to implement FaunaDB logic
    console.log("Would save to FaunaDB:", report);
    return report;
  } else {
    // In local development, use file system
    const filePath = getDataFilePath();
    const reports = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    reports.push(report);
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
    return report;
  }
};

const getReports = async () => {
  if (process.env.NETLIFY) {
    // In Netlify, use FaunaDB or another database service
    // This is just a placeholder - you need to implement FaunaDB logic
    console.log("Would fetch from FaunaDB");
    return [];
  } else {
    // In local development, use file system
    const filePath = getDataFilePath();
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
};

// API Routes
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await getReports();
    res.json(reports);
  } catch (err) {
    console.error('Error reading reports:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const newReport = {
      id: uuidv4(),
      university: req.body.university,
      raggingType: req.body.raggingType,
      perpetrator: req.body.perpetrator || 'Anonymous',
      details: req.body.details,
      timestamp: new Date().toISOString()
    };

    await saveReport(newReport);

    // Emit the new report to all connected clients (local development only)
    if (io) {
      io.emit('newReport', newReport);
    }

    res.status(201).json(newReport);
  } catch (err) {
    console.error('Error writing reports:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// For Netlify Functions, export the handler
const handler = serverless(app);
module.exports = { handler };
