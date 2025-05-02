const serverless = require('serverless-http');
const express = require('express');
const app = express();

app.use(express.json());

let reports = [];

app.get('/reports', (req, res) => {
  res.json(reports);
});

app.post('/reports', (req, res) => {
  const report = { ...req.body, id: reports.length + 1, timestamp: new Date() };
  reports.push(report);
  res.status(200).json({ message: 'Report submitted', report });
});

exports.handler = serverless(app);
