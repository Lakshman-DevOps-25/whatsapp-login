const express = require('express');
const router  = express.Router();

const {
  getConnectors,
  getConnectorById,
  addConnector,
  deleteConnector,
  getWhatsAppAuthUrl,
  connectWhatsApp,
  whatsappOAuthCallback,
  getWhatsAppDashboard,
} = require('../controllers/connectorController');

// ── General connector CRUD ────────────────────────────────────────────
router.get('/',    getConnectors);
router.post('/',   addConnector);
router.get('/:id', getConnectorById);
router.delete('/:id', deleteConnector);

// ── WhatsApp OAuth ────────────────────────────────────────────────────
router.get('/whatsapp/auth-url',   getWhatsAppAuthUrl);     // get auth details for popup
router.post('/whatsapp/connect',   connectWhatsApp);         // Embedded Signup — code exchange
router.get('/whatsapp/callback',   whatsappOAuthCallback);   // standard redirect callback fallback

// ── WhatsApp Dashboard ────────────────────────────────────────────────
router.get('/whatsapp/:id/dashboard', getWhatsAppDashboard);

module.exports = router;
