import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider,
} from '@mui/material';
import {
  DashboardOutlined, CableOutlined, AddCircleOutlineOutlined,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const nav = [
  { label: 'Dashboard',      path: '/',             icon: <DashboardOutlined /> },
  { label: 'Connectors',     path: '/connectors',   icon: <CableOutlined /> },
  { label: 'Add Connector',  path: '/add-connector',icon: <AddCircleOutlineOutlined /> },
];

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH, boxSizing: 'border-box',
          backgroundColor: '#0d1b2a', color: '#fff',
        },
      }}
    >
      <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CableOutlined sx={{ color: '#25D366', fontSize: 28 }} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
          DataConnector
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ mt: 1 }}>
        {nav.map(item => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: active ? 'rgba(37,211,102,0.15)' : 'transparent',
                  color: active ? '#25D366' : 'rgba(255,255,255,0.7)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
