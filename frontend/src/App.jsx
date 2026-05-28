import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import DashboardPage       from './pages/DashboardPage';
import ConnectorsPage      from './pages/ConnectorsPage';
import AddConnectorPage    from './pages/AddConnectorPage';
import ConnectorDetailsPage from './pages/ConnectorDetailsPage';
import WhatsAppDashboard   from './pages/WhatsAppDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                          element={<DashboardPage />} />
        <Route path="/connectors"                element={<ConnectorsPage />} />
        <Route path="/add-connector"             element={<AddConnectorPage />} />
        <Route path="/connectors/:id"            element={<ConnectorDetailsPage />} />
        <Route path="/connectors/:id/whatsapp"   element={<WhatsAppDashboard />} />
        <Route path="*"                          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
