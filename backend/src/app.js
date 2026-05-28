const express = require('express');
const connectDB       = require('./config/db');
const connectorRoutes = require('./routes/connectorRoutes');

const app = express();

connectDB();

// ── CORS — set headers manually, works for every origin ──────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow the requesting origin (or * if no origin header)
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Respond immediately to preflight OPTIONS requests
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(cors({
    origin: 'https://data-connector-frontend.onrender.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/connectors', connectorRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

module.exports = app;
