import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, CardContent, Typography, Box, Button, Chip,
  Grid, CircularProgress, Alert,
} from '@mui/material';
import { ArrowBackOutlined, OpenInNewOutlined } from '@mui/icons-material';
import PageLayout from '../components/layout/PageLayout';
import { getConnectorById } from '../api/connectorApi';

const TYPE_EMOJI = { whatsapp: '💬', slack: '🔗', teams: '👥' };
const TYPE_COLOR = { whatsapp: '#25D366', slack: '#4A154B', teams: '#6264A7' };
const STATUS_COLOR = { ACTIVE: 'success', PENDING: 'warning', ERROR: 'error' };

const ConnectorDetailsPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [connector, setConnector] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    getConnectorById(id)
      .then(r => setConnector(r.data?.data))
      .catch(err => setError(err.response?.data?.error || 'Not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOpenDashboard = () => {
    if (connector?.connectorType === 'whatsapp') {
      navigate(`/connectors/${id}/whatsapp`);
    }
  };

  if (loading) return <PageLayout><CircularProgress /></PageLayout>;
  if (error)   return <PageLayout><Alert severity="error">{error}</Alert></PageLayout>;
  if (!connector) return null;

  const color = TYPE_COLOR[connector.connectorType] || '#1976d2';

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/connectors')} variant="outlined" size="small">
          Back
        </Button>
        <Typography variant="h5" fontWeight={700}>Connector Details</Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, mb: 3 }}>
        <Box sx={{ height: 4, backgroundColor: color, borderRadius: '12px 12px 0 0' }} />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 2,
              backgroundColor: color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {TYPE_EMOJI[connector.connectorType] || '🔗'}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>{connector.connectorName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {connector.connectorType?.charAt(0).toUpperCase() + connector.connectorType?.slice(1)} Connector
              </Typography>
            </Box>
            <Chip label={connector.status} color={STATUS_COLOR[connector.status] || 'default'} />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              { label: 'Type',          value: connector.connectorType },
              { label: 'Status',        value: connector.status },
              { label: 'Display Phone', value: connector.displayPhone || 'N/A' },
              { label: 'Verified Name', value: connector.verifiedName  || 'N/A' },
              { label: 'Quality',       value: connector.qualityRating || 'N/A' },
              { label: 'Created',       value: new Date(connector.createdAt).toLocaleString() },
            ].map(row => (
              <Grid item xs={6} md={4} key={row.label}>
                <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={500}>{row.value}</Typography>
              </Grid>
            ))}
          </Grid>

          {connector.connectorType === 'whatsapp' && (
            <Button
              variant="contained" startIcon={<OpenInNewOutlined />}
              sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebe5a' } }}
              onClick={handleOpenDashboard}
            >
              Open WhatsApp Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default ConnectorDetailsPage;
