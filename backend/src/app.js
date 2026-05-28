const express = require('express');
// const cors    = require('cors');
const path    = require('path');
const connectDB       = require('./config/db');
const connectorRoutes = require('./routes/connectorRoutes');

const app = express();

res.setHeader('Access-Control-Allow-Origin', origin || '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

// ── Connect DB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://data-connector-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5174',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/connectors', connectorRoutes);

// ── Health ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

module.exports = app;
