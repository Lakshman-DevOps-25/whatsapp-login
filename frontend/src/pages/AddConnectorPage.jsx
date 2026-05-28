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

const META_APP_ID = import.meta.env.VITE_META_APP_ID  || '';
const META_CFG_ID = import.meta.env.VITE_META_CONFIG_ID || '';

const AddConnectorPage = () => {
  const [step,       setStep]      = useState(0);
  const [form,       setForm]      = useState({ connectorType: '', connectorName: '' });
  const [errors,     setErrors]    = useState({});
  const [connecting, setConnecting] = useState(false);
  const [sdkReady,   setSdkReady]  = useState(false);
  const [alert,      setAlert]     = useState(null);
  const wabaRef   = useRef({});
  const navigate  = useNavigate();

  useEffect(() => {
    // ── Step 1: inject the SDK script ──────────────────────────────────────
    if (!document.getElementById('facebook-jssdk')) {
      const s  = document.createElement('script');
      s.id     = 'facebook-jssdk';
      s.src    = 'https://connect.facebook.net/en_US/sdk.js';
      s.async  = true;
      s.defer  = true;
      document.body.appendChild(s);
    }

    // ── Step 2: poll every 200ms until window.FB exists, then call init ───
    // This handles both "SDK already cached" and "SDK still loading" cases
    const poll = setInterval(() => {
      if (!window.FB) return; // still loading — wait

      clearInterval(poll);

      // Call FB.init() only if not already initialised
      if (!window._fbInitDone) {
        window.FB.init({
          appId:   META_APP_ID,
          cookie:  true,
          xfbml:   true,
          version: 'v22.0',
        });
        window._fbInitDone = true;
      }

      setSdkReady(true);
    }, 200);

    // ── Step 3: capture waba_id + phone_number_id from popup postMessage ──
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

    return () => {
      clearInterval(poll);
      window.removeEventListener('message', onMsg);
    };
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

  const handleFacebookLogin = () => {
    setAlert(null);

    if (!sdkReady || !window.FB) {
      setAlert({ type: 'info', msg: 'Facebook SDK is still loading. Please wait a moment and try again.' });
      return;
    }

    setConnecting(true);

    const opts = {
      response_type:                  'code',
      override_default_response_type: true,
      extras: { feature: 'whatsapp_embedded_signup' },
    };
    if (META_CFG_ID) opts.config_id = META_CFG_ID;

    window.FB.login((response) => {
      if (response.authResponse?.code) {
        exchangeToken(response.authResponse.code);
      } else {
        setAlert({ type: 'warning', msg: 'Login popup was closed. Please try again.' });
        setConnecting(false);
      }
    }, opts);
  };

  const exchangeToken = async (code) => {
    try {
      await connectWhatsApp({
        code,
        wabaId:        wabaRef.current.wabaId        || null,
        phoneNumberId: wabaRef.current.phoneNumberId || null,
        connectorName: form.connectorName,
      });
      setAlert({ type: 'success', msg: 'WhatsApp connected! Redirecting…' });
      setTimeout(() => navigate('/connectors'), 1200);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Token exchange failed. Please try again.' });
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

      {/* Step 0 */}
      {step === 0 && (
        <Card elevation={0} sx={{ maxWidth: 520, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Select Platform</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {CONNECTOR_TYPES.map(type => (
                <Box key={type.value}
                  onClick={() => { setForm(f => ({ ...f, connectorType: type.value })); setErrors(e => ({ ...e, connectorType: '' })); }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderRadius: 2, cursor: 'pointer',
                    border: `2px solid ${form.connectorType === type.value ? type.color : '#e0e0e0'}`,
                    backgroundColor: form.connectorType === type.value ? type.color + '10' : '#fff',
                    transition: 'all .15s', '&:hover': { borderColor: type.color },
                  }}>
                  <Typography fontSize={26}>{type.emoji}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{type.desc}</Typography>
                  </Box>
                  {form.connectorType === type.value && <CheckCircleOutlined sx={{ color: type.color }} />}
                </Box>
              ))}
            </Box>
            {errors.connectorType && (
              <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>{errors.connectorType}</Typography>
            )}
            <TextField fullWidth label="Connector Name" margin="normal"
              value={form.connectorName}
              onChange={e => { setForm(f => ({ ...f, connectorName: e.target.value })); setErrors(ex => ({ ...ex, connectorName: '' })); }}
              error={!!errors.connectorName}
              helperText={errors.connectorName || `e.g. My ${selectedType?.label || 'Business'} Account`}
            />
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2, py: 1.3 }} onClick={handleContinue}>
              {form.connectorType === 'whatsapp' ? 'Continue →' : 'Add Connector'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Card elevation={0} sx={{ maxWidth: 520, border: '1px solid #e0e0e0', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#25D36618',
              mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              💬
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Connect WhatsApp</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
              Click the button below. A Facebook popup will open where you sign in
              and authorize your WhatsApp Business Account.
            </Typography>

            <Button variant="contained" size="large" fullWidth
              onClick={handleFacebookLogin}
              disabled={connecting || !sdkReady}
              sx={{
                py: 1.6, fontSize: '1rem', fontWeight: 700,
                backgroundColor: '#1877F2', '&:hover': { backgroundColor: '#1468d9' },
                '&:disabled': { backgroundColor: '#b0c4de', color: '#fff' },
                borderRadius: 2, textTransform: 'none',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
              {connecting ? (
                <><CircularProgress size={22} color="inherit" /> Connecting…</>
              ) : !sdkReady ? (
                <><CircularProgress size={18} color="inherit" /> Loading…</>
              ) : (
                <>
                  <Box component="span" sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: '#fff', color: '#1877F2',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1rem', flexShrink: 0,
                  }}>f</Box>
                  Continue with Facebook
                </>
              )}
            </Button>

            <Button size="small" sx={{ mt: 2, color: 'text.secondary' }}
              onClick={() => { setStep(0); setAlert(null); }} disabled={connecting}>
              ← Back
            </Button>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
};

export default AddConnectorPage;
