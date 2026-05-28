import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// ── Connectors CRUD ───────────────────────────────────────────────────
export const getConnectors    = ()       => API.get('/connectors');
export const getConnectorById = (id)     => API.get(`/connectors/${id}`);
export const addConnector     = (data)   => API.post('/connectors', data);
export const deleteConnector  = (id)     => API.delete(`/connectors/${id}`);

// ── WhatsApp ──────────────────────────────────────────────────────────
export const getWhatsAppAuthUrl   = ()       => API.get('/connectors/whatsapp/auth-url');
export const connectWhatsApp      = (data)   => API.post('/connectors/whatsapp/connect', data);
export const getWhatsAppDashboard = (id)     => API.get(`/connectors/whatsapp/${id}/dashboard`);
