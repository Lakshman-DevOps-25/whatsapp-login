import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Button, Chip, Box,
  CircularProgress, Alert, IconButton, Tooltip,
} from '@mui/material';
import { DeleteOutlined, OpenInNewOutlined, AddCircleOutlineOutlined } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { getConnectors, deleteConnector } from '../api/connectorApi';

const TYPE_COLOR  = { whatsapp: '#25D366', slack: '#4A154B', teams: '#6264A7' };
const TYPE_EMOJI  = { whatsapp: '💬', slack: '🔗', teams: '👥' };
const STATUS_COLOR = { ACTIVE: 'success', PENDING: 'warning', ERROR: 'error', DISCONNECTED: 'default' };

const ConnectorsPage = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [alert,      setAlert]      = useState(null);
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle OAuth callback result
    if (searchParams.get('connected') === 'true') {
      setAlert({ type: 'success', msg: 'WhatsApp connected successfully!' });
    } else if (searchParams.get('error')) {
      setAlert({ type: 'error', msg: `Connection failed: ${searchParams.get('error')}` });
    }
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    setLoading(true);
    try {
      const r = await getConnectors();
      setConnectors(r.data?.data || []);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this connector?')) return;
    await deleteConnector(id);
    loadConnectors();
  };

  const handleOpen = (connector) => {
    if (connector.connectorType === 'whatsapp') {
      navigate(`/connectors/${connector._id}/whatsapp`);
    } else {
      navigate(`/connectors/${connector._id}`);
    }
  };

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Connectors</Typography>
          <Typography variant="body2" color="text.secondary">
            {connectors.length} connector{connectors.length !== 1 ? 's' : ''} configured
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddCircleOutlineOutlined />}
          onClick={() => navigate('/add-connector')}
        >
          Add Connector
        </Button>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
          {alert.msg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : connectors.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px dashed #ccc', borderRadius: 3, textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>No connectors yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Add your first connector to start integrating
          </Typography>
          <Button variant="contained" onClick={() => navigate('/add-connector')}
            startIcon={<AddCircleOutlineOutlined />}>
            Add Connector
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {connectors.map(conn => {
            const color = TYPE_COLOR[conn.connectorType] || '#1976d2';
            return (
              <Grid item xs={12} sm={6} md={4} key={conn._id}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid #e0e0e0', borderRadius: 3,
                    cursor: 'pointer', transition: 'all .2s',
                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' },
                    position: 'relative', overflow: 'visible',
                  }}
                  onClick={() => handleOpen(conn)}
                >
                  {/* Color stripe */}
                  <Box sx={{ height: 4, backgroundColor: color, borderRadius: '12px 12px 0 0' }} />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ width: 46, height: 46, borderRadius: 2,
                        backgroundColor: color + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        {TYPE_EMOJI[conn.connectorType] || '🔗'}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={conn.status}
                          size="small"
                          color={STATUS_COLOR[conn.status] || 'default'}
                        />
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error"
                            onClick={(e) => handleDelete(conn._id, e)}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                      {conn.connectorName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {conn.connectorType?.charAt(0).toUpperCase() + conn.connectorType?.slice(1)} Integration
                    </Typography>
                    {conn.displayPhone && (
                      <Typography variant="caption" color="text.disabled">
                        📱 {conn.displayPhone}
                      </Typography>
                    )}
                  </CardContent>

                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button
                      fullWidth variant="outlined" size="small"
                      startIcon={<OpenInNewOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleOpen(conn); }}
                      sx={{ borderColor: color, color, '&:hover': { borderColor: color, bgcolor: color + '08' } }}
                    >
                      Open Dashboard
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </PageLayout>
  );
};

export default ConnectorsPage;
