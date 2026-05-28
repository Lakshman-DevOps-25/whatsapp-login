const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB       = require('./config/db');
const connectorRoutes = require('./routes/connectorRoutes');

const app = express();

// ── Connect DB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
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
