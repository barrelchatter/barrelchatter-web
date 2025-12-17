import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottlesPage from './pages/BottlesPage.jsx';
import TastingsPage from './pages/TastingsPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import TagsPage from './pages/TagsPage.jsx';
import AdminTagsPage from './pages/AdminTagsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import BottleDetailPage from './pages/BottleDetailPage.jsx';
import InventoryDetailPage from './pages/InventoryDetailPage.jsx';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage.jsx';
import AdminBottleSubmissionsPage from './pages/AdminBottleSubmissionsPage.jsx';
import StorageLocationsPage from './pages/StorageLocationsPage.jsx';
import AdminPurchaseLocationsPage from './pages/AdminPurchaseLocationsPage.jsx';
import AdminTagPacksPage from './pages/AdminTagPacksPage.jsx';
import AdminTagPackDetailPage from './pages/AdminTagPackDetailPage.jsx';
import AdminBulkImportPage from './pages/AdminBulkImportPage.jsx';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Top-level: must be authenticated for anything under /app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default landing - now goes to Home */}
        <Route index element={<HomePage />} />

        {/* Home dashboard */}
        <Route path="home" element={<HomePage />} />

        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Normal user routes */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/:id" element={<InventoryDetailPage />} />
        <Route path="bottles" element={<BottlesPage />} />
        <Route path="bottles/:id" element={<BottleDetailPage />} />
        <Route path="tastings" element={<TastingsPage />} />
        <Route path="wishlists" element={<WishlistPage />} />
        <Route path="tags" element={<TagsPage />} />
        
        {/* Storage Locations - user can manage their own */}
        <Route path="storage-locations" element={<StorageLocationsPage />} />

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
        <Route
          path="admin/users"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminAuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/purchase-locations"
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminPurchaseLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/app/admin/tag-packs" 
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminTagPacksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/app/admin/tag-packs/:id" 
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminTagPackDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/app/admin/tags/bulk-import" 
          element={
            <ProtectedRoute requireRoles={['admin']}>
              <AdminBulkImportPage />
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
