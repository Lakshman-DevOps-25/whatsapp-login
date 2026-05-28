import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { CableOutlined } from '@mui/icons-material';

const Navbar = () => (
  <AppBar position="static" elevation={0}
    sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0', zIndex: 1201 }}>
    <Toolbar>
      <CableOutlined sx={{ color: '#25D366', mr: 1 }} />
      <Typography variant="h6" fontWeight={700} color="text.primary">
        Data Connector Platform
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Typography variant="caption" color="text.secondary">v1.0</Typography>
    </Toolbar>
  </AppBar>
);

export default Navbar;
