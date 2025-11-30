import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<InventoryPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        {/* stubs for future routes */}
        <Route path="bottles" element={<div>TODO: Bottles</div>} />
        <Route path="tastings" element={<div>TODO: Tastings</div>} />
        <Route path="wishlists" element={<div>TODO: Wishlists</div>} />
        <Route path="tags" element={<div>TODO: Tags</div>} />
        <Route path="admin/tags" element={<div>TODO: Admin Tags</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
