import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottlesPage from './pages/BottlesPage.jsx';
import TastingsPage from './pages/TastingsPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import TagsPage from './pages/TagsPage.jsx';
import AdminTagsPage from './pages/AdminTagsPage.jsx';

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
        <Route path="bottles" element={<BottlesPage />} />
        <Route path="tastings" element={<TastingsPage />} />
        <Route path="wishlists" element={<WishlistPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="admin/tags" element={<AdminTagsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
