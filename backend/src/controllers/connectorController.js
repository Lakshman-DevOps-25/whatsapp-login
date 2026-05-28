const axios     = require('axios');
const Connector = require('../models/Connector');

const GRAPH = 'https://graph.facebook.com/v22.0';

// ── GET /api/connectors ────────────────────────────────────────────────────
exports.getConnectors = async (req, res) => {
  try {
    const connectors = await Connector.find().sort({ createdAt: -1 });
    res.json({ success: true, data: connectors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/connectors/:id ────────────────────────────────────────────────
exports.getConnectorById = async (req, res) => {
  try {
    const connector = await Connector.findById(req.params.id);
    if (!connector) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: connector });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/connectors ───────────────────────────────────────────────────
exports.addConnector = async (req, res) => {
  try {
    const { connectorType, connectorName } = req.body;
    if (!connectorType || !connectorName)
      return res.status(400).json({ success: false, error: 'connectorType and connectorName required' });

    const connector = await Connector.create({ connectorType, connectorName });
    res.status(201).json({ success: true, data: connector });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── DELETE /api/connectors/:id ─────────────────────────────────────────────
exports.deleteConnector = async (req, res) => {
  try {
    await Connector.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Connector deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/connectors/whatsapp/auth-url ─────────────────────────────────
// Returns the Meta OAuth URL so the frontend popup can use it
exports.getWhatsAppAuthUrl = (req, res) => {
  try {
    const META_APP_ID     = process.env.META_APP_ID;
    const META_REDIRECT   = process.env.META_REDIRECT_URI || 'https://whatsapp-login-rdw9.onrender.com/api/connectors/whatsapp/callback';
    const META_CONFIG_ID  = process.env.META_CONFIG_ID;

    if (!META_APP_ID) {
      // Return embedded-signup details even without full config
      return res.json({
        success: true,
        method:  'embedded_signup',
        appId:   META_APP_ID || null,
        configId:META_CONFIG_ID || null,
        fallbackUrl: `https://www.facebook.com/v22.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT)}&scope=whatsapp_business_messaging,whatsapp_business_management&response_type=code`
      });
    }

    const params = new URLSearchParams({
      client_id:    META_APP_ID,
      redirect_uri: META_REDIRECT,
      scope:        'whatsapp_business_messaging,whatsapp_business_management',
      response_type:'code',
      state:        Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64'),
    });

    res.json({
      success:  true,
      method:   'embedded_signup',
      appId:    META_APP_ID,
      configId: META_CONFIG_ID,
      authUrl:  `https://www.facebook.com/v22.0/dialog/oauth?${params}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/connectors/whatsapp/connect ─────────────────────────────────
// Called by frontend after Embedded Signup popup returns code + wabaId + phoneNumberId
exports.connectWhatsApp = async (req, res) => {
  try {
    const { code, wabaId, phoneNumberId, connectorName } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });

    // Exchange code for long-lived access token
    const tokenRes = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        client_id:     process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        code,
      },
      timeout: 10000,
    });
    const accessToken = tokenRes.data.access_token;

    // Fetch WABA name
    let name         = connectorName || 'WhatsApp';
    let displayPhone = null;
    let verifiedNameVal = null;
    let qualityRating = null;
    let providerName  = null;
    let providerAccountId = null;

    if (wabaId) {
      try {
        const wabaRes = await axios.get(`${GRAPH}/${wabaId}`, {
          params: { fields: 'id,name', access_token: accessToken },
        });
        name = wabaRes.data.name || name;
        providerName = wabaRes.data.name;
        providerAccountId = wabaRes.data.id;
      } catch {}
    }

    if (phoneNumberId) {
      try {
        const phoneRes = await axios.get(`${GRAPH}/${phoneNumberId}`, {
          params: { fields: 'display_phone_number,verified_name,quality_rating', access_token: accessToken },
        });
        displayPhone    = phoneRes.data.display_phone_number;
        verifiedNameVal = phoneRes.data.verified_name;
        qualityRating   = phoneRes.data.quality_rating;
      } catch {}
    }

    // Subscribe WABA to webhook
    if (wabaId) {
      try {
        await axios.post(`${GRAPH}/${wabaId}/subscribed_apps`, {}, {
          params: { access_token: accessToken },
        });
      } catch {}
    }

    // Save to DB
    const connector = await Connector.create({
      connectorType:       'whatsapp',
      connectorName:       name,
      status:              'ACTIVE',
      accessToken,
      wabaId:              wabaId || null,
      phoneNumberId:       phoneNumberId || null,
      displayPhone,
      verifiedName:        verifiedNameVal,
      qualityRating,
      providerAccountId,
      providerAccountName: providerName,
      scopes:              ['whatsapp_business_messaging', 'whatsapp_business_management'],
    });

    res.status(201).json({
      success: true,
      message: 'WhatsApp connected successfully',
      data: { ...connector.toObject(), accessToken: '***hidden***' },
    });
  } catch (err) {
    const metaErr = err.response?.data?.error?.message;
    res.status(500).json({ success: false, error: metaErr || err.message });
  }
};

// ── GET /api/connectors/whatsapp/callback ─────────────────────────────────
// Standard OAuth redirect callback (fallback from popup)
exports.whatsappOAuthCallback = async (req, res) => {
  const { code, error } = req.query;
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) return res.redirect(`${FRONTEND}/connectors?error=${encodeURIComponent(error)}`);
  if (!code)  return res.redirect(`${FRONTEND}/connectors?error=no_code`);

  try {
    const tokenRes = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        client_id:     process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri:  process.env.META_REDIRECT_URI,
        code,
      },
    });
    const accessToken = tokenRes.data.access_token;

    const connector = await Connector.create({
      connectorType: 'whatsapp',
      connectorName: 'WhatsApp Business',
      status:        'ACTIVE',
      accessToken,
    });

    res.redirect(`${FRONTEND}/connectors?connected=true&id=${connector._id}`);
  } catch (err) {
    res.redirect(`${FRONTEND}/connectors?error=${encodeURIComponent(err.message)}`);
  }
};

// ── GET /api/connectors/whatsapp/:id/dashboard ────────────────────────────
exports.getWhatsAppDashboard = async (req, res) => {
  try {
    const connector = await Connector.findById(req.params.id);
    if (!connector) return res.status(404).json({ success: false, error: 'Not found' });
    if (connector.connectorType !== 'whatsapp')
      return res.status(400).json({ success: false, error: 'Not a WhatsApp connector' });

    const token  = connector.getAccessToken();
    const wabaId = connector.wabaId;

    const dashboard = {
      connectorId:   connector._id,
      connectorName: connector.connectorName,
      displayPhone:  connector.displayPhone,
      verifiedName:  connector.verifiedName,
      qualityRating: connector.qualityRating,
      status:        connector.status,
      connectedAt:   connector.createdAt,
      phoneNumbers:  [],
      templates:     [],
      stats: {
        phoneNumbers: 0,
        templates:    0,
        status:       connector.status,
      },
    };

    if (token && wabaId) {
      // Phone numbers
      try {
        const pRes = await axios.get(`${GRAPH}/${wabaId}/phone_numbers`, {
          params: {
            fields:       'id,display_phone_number,verified_name,quality_rating,messaging_limit_tier,is_official_business_account',
            access_token: token,
          },
        });
        dashboard.phoneNumbers      = pRes.data?.data || [];
        dashboard.stats.phoneNumbers = dashboard.phoneNumbers.length;
      } catch {}

      // Templates
      try {
        const tRes = await axios.get(`${GRAPH}/${wabaId}/message_templates`, {
          params: { fields: 'id,name,status,category', access_token: token, limit: 20 },
        });
        dashboard.templates      = tRes.data?.data || [];
        dashboard.stats.templates = dashboard.templates.length;
      } catch {}
    }

    // Update last sync
    connector.metadata = { ...connector.metadata, lastSyncAt: new Date() };
    await connector.save();

    res.json({ success: true, data: dashboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
