# Data Connector Platform

Full-stack Node.js + React application for managing data connectors including WhatsApp.

## Stack
- **Backend:** Node.js, Express.js (MVC), MongoDB (Mongoose)
- **Frontend:** React, Vite, Material UI
- **Storage:** MinIO (optional)

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev        # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## WhatsApp Connector Flow
1. Go to **Add Connector** → choose WhatsApp → enter a name → Continue
2. Click **Sign in with Facebook & Connect**
3. Meta popup opens → log in → select WABA → authorize
4. Redirected back to Connectors list
5. Click any WhatsApp connector → **Open Dashboard** → see phone numbers, templates, stats

## API Endpoints
| Method | Path | Description |
|---|---|---|
| GET | /api/connectors | List all connectors |
| POST | /api/connectors | Create connector |
| GET | /api/connectors/:id | Get connector by ID |
| DELETE | /api/connectors/:id | Delete connector |
| GET | /api/connectors/whatsapp/auth-url | Get Meta OAuth config |
| POST | /api/connectors/whatsapp/connect | Exchange OAuth code, save tokens |
| GET | /api/connectors/whatsapp/callback | Standard OAuth redirect fallback |
| GET | /api/connectors/whatsapp/:id/dashboard | Fetch WhatsApp dashboard data |

## Meta Setup (for WhatsApp)
1. Create app at https://developers.facebook.com
2. Add WhatsApp product + Embedded Signup configuration
3. Add to `backend/.env`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_CONFIG_ID=your_config_id
   ```
4. Add to `frontend/.env`:
   ```
   VITE_META_APP_ID=your_app_id
   VITE_META_CONFIG_ID=your_config_id
   ```
