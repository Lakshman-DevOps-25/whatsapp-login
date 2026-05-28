import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress,
  Alert, Button, Chip, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
  ArrowBackOutlined, RefreshOutlined, PhoneOutlined,
  MessageOutlined, CheckCircleOutlined, VerifiedOutlined,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { getWhatsAppDashboard } from '../api/connectorApi';

const QUALITY_COLOR = { GREEN: 'success', YELLOW: 'warning', RED: 'error' };

const StatCard = ({ label, value, icon, color }) => (
  <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 52, height: 52, borderRadius: 2,
        backgroundColor: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700}>{value ?? '—'}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const WhatsAppDashboard = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getWhatsAppDashboard(id);
      setData(r.data?.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  return (
    <PageLayout>
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => navigate('/connectors')}
          variant="outlined" size="small"
        >
          Back
        </Button>
        <Box sx={{ width: 46, height: 46, borderRadius: 2, backgroundColor: '#25D36618',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          💬
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {data?.connectorName || 'WhatsApp Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.displayPhone || 'WhatsApp Business'}
            {data?.verifiedName && ` · ${data.verifiedName}`}
          </Typography>
        </Box>
        <Chip
          label={data?.status || 'ACTIVE'}
          color={data?.status === 'ACTIVE' ? 'success' : 'default'}
        />
        <Tooltip title="Refresh">
          <IconButton onClick={load} disabled={loading}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress sx={{ color: '#25D366' }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {!loading && data && (
        <>
          {/* ── Stats row ──────────────────────────────────────── */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                label="Phone Numbers"
                value={data.stats?.phoneNumbers}
                icon={<PhoneOutlined />}
                color="#25D366"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                label="Message Templates"
                value={data.stats?.templates}
                icon={<MessageOutlined />}
                color="#128C7E"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                label="Account Status"
                value={data.status}
                icon={<CheckCircleOutlined />}
                color="#2e7d32"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            {/* ── Phone numbers ──────────────────────────────── */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    📱 Phone Numbers
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {data.phoneNumbers?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No phone numbers found. Ensure your WABA has registered numbers.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {data.phoneNumbers?.map(p => (
                        <ListItem key={p.id} divider
                          sx={{ px: 0, py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#25D36618', color: '#25D366', fontSize: '0.8rem' }}>
                              📱
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={600}>{p.display_phone_number}</Typography>
                                {p.is_official_business_account && (
                                  <VerifiedOutlined sx={{ color: '#25D366', fontSize: 16 }} />
                                )}
                              </Box>
                            }
                            secondary={p.verified_name}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                            <Chip
                              label={p.quality_rating || 'N/A'}
                              size="small"
                              color={QUALITY_COLOR[p.quality_rating] || 'default'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {p.messaging_limit_tier?.replace('TIER_', '') || '—'} msg/day
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ── Templates ──────────────────────────────────── */}
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    📋 Message Templates
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {data.templates?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No message templates found. Create templates in Meta Business Manager.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {data.templates?.map(t => (
                        <ListItem key={t.id} divider sx={{ px: 0, py: 1 }}>
                          <ListItemText
                            primary={t.name}
                            secondary={t.category}
                          />
                          <Chip
                            label={t.status}
                            size="small"
                            color={t.status === 'APPROVED' ? 'success' : t.status === 'REJECTED' ? 'error' : 'warning'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* ── Connection info ─────────────────────────────── */}
            <Grid item xs={12}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Connection Info</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Grid container spacing={2}>
                    {[
                      { label: 'Connector Name', value: data.connectorName },
                      { label: 'Display Phone',  value: data.displayPhone || 'N/A' },
                      { label: 'Verified Name',  value: data.verifiedName || 'N/A' },
                      { label: 'Quality Rating', value: data.qualityRating || 'N/A' },
                      { label: 'Connected At',   value: data.connectedAt ? new Date(data.connectedAt).toLocaleString() : 'N/A' },
                      { label: 'Status',         value: data.status },
                    ].map(row => (
                      <Grid item xs={12} sm={6} md={4} key={row.label}>
                        <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                        <Typography variant="body2" fontWeight={500}>{row.value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </PageLayout>
  );
};

export default WhatsAppDashboard;
