import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box textAlign="center">
        <Typography variant="h4" fontWeight={700} gutterBottom>Data Connector Platform</Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/')}>
          Enter Dashboard
        </Button>
      </Box>
    </Box>
  );
};
export default LoginPage;
