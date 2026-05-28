import React from 'react';
import { Box } from '@mui/material';
import Navbar  from './Navbar';
import Sidebar from './Sidebar';

const PageLayout = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <Box sx={{ display: 'flex', flex: 1 }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flex: 1, p: 3, backgroundColor: '#f5f6fa', minHeight: 'calc(100vh - 64px)', ml: '240px' }}
      >
        {children}
      </Box>
    </Box>
  </Box>
);

export default PageLayout;
