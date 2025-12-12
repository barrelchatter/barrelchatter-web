import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireRoles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div>Loading...</div>;
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but this route requires specific roles
  if (requireRoles && !requireRoles.includes(user.role)) {
    // No permission – bounce them somewhere safe
    return <Navigate to="/app/inventory" replace />;
  }

  return children;
}

export default ProtectedRoute;
