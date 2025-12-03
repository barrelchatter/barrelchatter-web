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
import BottleDetailPage from './pages/BottleDetailPage.jsx';
import InventoryDetailPage from './pages/InventoryDetailPage.jsx';
import AdminBottleSubmissionsPage from './pages/AdminBottleSubmissionsPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Top-level: must be authenticated for anything under /app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default landing */}
        <Route index element={<InventoryPage />} />

        {/* Normal user routes */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/:id" element={<InventoryDetailPage />} />
        <Route path="bottles" element={<BottlesPage />} />
        <Route path="bottles/:id" element={<BottleDetailPage />} />
        <Route path="tastings" element={<TastingsPage />} />
        <Route path="wishlists" element={<WishlistPage />} />
        <Route path="tags" element={<TagsPage />} />

        {/* Moderator/Admin: Bottle Submissions */}
        <Route
          path="admin/bottles-submissions"
          element={
            <ProtectedRoute requireRoles={['moderator', 'admin']}>
              <AdminBottleSubmissionsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only: Admin Tags */}
        <Route
          path="admin/tags"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminTagsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
