/**
 * Protected Route Component
 * =========================
 * Guards routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const location = useLocation();
  
  // Check for admin token
  const adminToken = localStorage.getItem('adminToken');
  
  if (requireAdmin && !adminToken) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
