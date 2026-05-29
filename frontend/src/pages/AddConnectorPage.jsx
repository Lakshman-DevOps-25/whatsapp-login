import React, { useState, useEffect, useRef } from 'react';
import {
  Card, CardContent, Typography, TextField, Button,
  Box, Stepper, Step, StepLabel, CircularProgress, Alert,
} from '@mui/material';
import { CheckCircleOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { addConnector, connectWhatsApp } from '../api/connectorApi';

const CONNECTOR_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp',       emoji: '💬', color: '#25D366', desc: 'Connect via Facebook login' },
  { value: 'slack',    label: 'Slack',           emoji: '🔗', color: '#4A154B', desc: 'Connect your Slack workspace' },
  { value: 'teams',    label: 'Microsoft Teams', emoji: '👥', color: '#6264A7', desc: 'Connect via Microsoft login' },
];

// Read from .env — set ONCE by the developer, never by the customer
const META_APP_ID = import.meta.env.VITE_META_APP_ID  || '';
const META_CFG_ID = import.meta.env.VITE_META_CONFIG_ID || '';

const AddConnectorPage = () => {
  const [step,       setStep]      = useState(0);
  const [form,       setForm]      = useState({ connectorType: '', connectorName: '' });
  const [errors,     setErrors]    = useState({});
  const [connecting, setConnecting] = useState(false);
  const [sdkReady,   setSdkReady]  = useState(false);
  const [alert,      setAlert]     = useState(null);
  const wabaRef  = useRef({});
  const navigate = useNavigate();

  // ── Load Facebook JS SDK on mount ─────────────────────────────
  useEffect(() => {
    // 1. Define global init callback safely before script injection runs
    window.fbAsyncInit = () => {
      if (!window.FB) return;
      window.FB.init({
        appId:   META_APP_ID,
        cookie:  true,
        xfbml:   true,
        version: 'v22.0',
      });
      setSdkReady(true);
    };

    // 2. If SDK loaded and already initialized on a previous mount/refresh
    if (window.FB && window.FB.init) {
      // Re-run init to make sure it tracks our current app ID state config
      window.fbAsyncInit();
    }

    // 3. Only inject the script tag if it doesn't exist
    if (!document.getElementById('facebook-jssdk')) {
      const s   = document.createElement('script');
      s.id      = 'facebook-jssdk';
      s.src     = 'https://connect.facebook.net/en_US/sdk.js';
      s.async   = true;
      s.defer   = true;
      s.onerror = () => setAlert({ type: 'error', msg: 'Could not load Facebook SDK. Check your internet connection.' });
      document.body.appendChild(s);
    } else if (window.FB) {
      // Script exists and window.FB is active, force readiness state update
      setSdkReady(true);
    }

    // 4. Handle incoming window messaging post-popup
    const onMsg = (event) => {
      if (event.origin !== 'https://www.facebook.com') return;
      try {
        const d = JSON.parse(event.data);
        if (d.type === 'WA_EMBEDDED_SIGNUP' && d.event === 'FINISH') {
          wabaRef.current = {
            wabaId:        d.data.waba_id,
            phoneNumberId: d.data.phone_number_id,
          };
        }
      } catch {}
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.connectorName.trim()) e.connectorName = 'Please enter a name';
    if (!form.connectorType)        e.connectorType  = 'Please select a type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    if (form.connectorType !== 'whatsapp') {
      try {
        await addConnector(form);
        navigate('/connectors');
      } catch (err) {
        setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to add connector' });
      }
      return;
    }
    setAlert(null);
    setStep(1);
  };

  // ── The only function the customer triggers ───────────────────────────────
  const handleFacebookLogin = () => {
    setAlert(null);

    // Guard: SDK still loading or missing configuration entirely
    if (!sdkReady || !window.FB) {
      setAlert({ type: 'info', msg: 'Facebook SDK is initializing, please wait a moment and try again.' });
      return;
    }

    setConnecting(true);

    // Build login options — config_id is optional (popup works without it if blank)
    const loginOptions = {
      response_type:                  'code',
      override_default_response_type: true,
      extras: { feature: 'whatsapp_embedded_signup' },
    };
    // Only pass config_id if it is set — avoids FB error on blank string
    if (META_CFG_ID) loginOptions.config_id = META_CFG_ID;

    window.FB.login((response) => {
      if (response.authResponse?.code) {
        exchangeToken(response.authResponse.code);
      } else {
        const reason = response.authResponse ? 'Authorization not completed' : 'Login popup was closed';
        setAlert({ type: 'warning', msg: reason + '. Please try again.' });
        setConnecting(false);
      }
    }, loginOptions);
  };

  const exchangeToken = async (code) => {
    try {
      await connectWhatsApp({
        code,
        wabaId:        wabaRef.current.wabaId        || null,
        phoneNumberId: wabaRef.current.phoneNumberId || null,
        connectorName: form.connectorName,
      });
      setAlert({ type: 'success', msg: 'WhatsApp connected successfully! Redirecting…' });
      setTimeout(() => navigate('/connectors'), 1200);
    } catch (err) {
      setAlert({
        type: 'error',
        msg:  err.response?.data?.error || 'Token exchange failed. Please try again.',
      });
    } finally {
      setConnecting(false);
    }
  };

  const selectedType = CONNECTOR_TYPES.find(t => t.value === form.connectorType);

  return (
    <PageLayout>
      <Typography variant="h5" fontWeight={700} gutterBottom>Add Connector</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Connect a new platform to your workspace
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4, maxWidth: 480 }}>
        <Step><StepLabel>Choose Platform</StepLabel></Step>
        <Step><StepLabel>Connect Account</StepLabel></Step>
      </Stepper>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2, maxWidth: 520 }} onClose={() => setAlert(null)}>
          {alert.msg}
        </Alert>
      )}

      {step === 0 && (
        <Box sx={{ maxWidth: 520 }}>
          <TextField
            fullWidth
            label="Connector Name"
            variant="outlined"
            value={form.connectorName}
            onChange={(e) => setForm({ ...form, connectorName: e.target.value })}
            error={!!errors.connectorName}
            helperText={errors.connectorName}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Select Platform</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
            {CONNECTOR_TYPES.map((type) => (
              <Card 
                key={type.value}
                onClick={() => setForm({ ...form, connectorType: type.value })}
                sx={{ 
                  cursor: 'pointer',
                  border: form.connectorType === type.value ? `2px solid ${type.color}` : '1px solid #e0e0e0',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#fcfcfc' }
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
                  <Box sx={{ fontSize: 24 }}>{type.emoji}</Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{type.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{type.desc}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
            {errors.connectorType && (
              <Typography variant="caption" color="error">{errors.connectorType}</Typography>
            )}
          </Box>

          <Button variant="contained" onClick={handleContinue} size="large" fullWidth sx={{ textTransform: 'none', py: 1.2, borderRadius: 2 }}>
            Continue
          </Button>
        </Box>
      )}

      {step === 1 && (
        <Card elevation={0} sx={{ maxWidth: 520, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#25D36618',
              mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              💬
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>Connect WhatsApp</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Account: <strong>{form.connectorName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
              Click the button below. A Facebook popup will open where you sign in
              and authorize your WhatsApp Business Account.
            </Typography>

            <Button
              variant="contained" size="large" fullWidth
              onClick={handleFacebookLogin}
              disabled={connecting || !sdkReady}
              sx={{
                py: 1.6, fontSize: '1rem', fontWeight: 700,
                backgroundColor: '#1877F2',
                '&:hover': { backgroundColor: '#1468d9' },
                '&:disabled': { backgroundColor: '#b0c4de', color: '#fff' },
                borderRadius: 2, textTransform: 'none',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}
            >
              {connecting ? (
                <><CircularProgress size={22} color="inherit" /> Connecting to WhatsApp…</>
              ) : !sdkReady ? (
                <><CircularProgress size={18} color="inherit" /> Initializing SDK…</>
              ) : (
                <>Continue with Facebook</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
};

export default AddConnectorPage;
