import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  CircularProgress, Button,
} from '@mui/material';
import {
  CableOutlined, CheckCircleOutlined,
  HourglassEmptyOutlined, ErrorOutlineOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { getConnectors } from '../api/connectorApi';

const StatCard = ({ label, value, color, icon }) => (
  <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getConnectors()
      .then(r => setConnectors(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total      = connectors.length;
  const active     = connectors.filter(c => c.status === 'ACTIVE').length;
  const pending    = connectors.filter(c => c.status === 'PENDING').length;
  const errors     = connectors.filter(c => c.status === 'ERROR').length;
  const whatsapps  = connectors.filter(c => c.connectorType === 'whatsapp');

  return (
    <PageLayout>
      <Typography variant="h5" fontWeight={700} gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to the Connector Platform — manage all your integrations from here.
      </Typography>

      {loading ? <CircularProgress /> : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Total Connectors"  value={total}   color="#1976d2" icon={<CableOutlined />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Active"            value={active}  color="#2e7d32" icon={<CheckCircleOutlined />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Pending"           value={pending} color="#ed6c02" icon={<HourglassEmptyOutlined />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard label="Errors"            value={errors}  color="#d32f2f" icon={<ErrorOutlineOutlined />} />
            </Grid>
          </Grid>

          {whatsapps.length > 0 && (
            <>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                WhatsApp Connectors
              </Typography>
              <Grid container spacing={2}>
                {whatsapps.map(c => (
                  <Grid item xs={12} sm={6} md={4} key={c._id}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: '#25D36618',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography fontSize={22}>💬</Typography>
                          </Box>
                          <Box>
                            <Typography fontWeight={600}>{c.connectorName}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.displayPhone || 'WhatsApp'}</Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebe5a' } }}
                          onClick={() => navigate(`/connectors/${c._id}/whatsapp`)}
                        >
                          Open Dashboard
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default DashboardPage;
