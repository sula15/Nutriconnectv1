import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requiredPermissions = [] 
}) => {
  const { isAuthenticated, user, permissions, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <div className="access-denied">Access Denied: Incorrect role</div>;
  }

  if (requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.every(
      permission => permissions.includes(permission)
    );
    
    if (!hasPermissions) {
      return <div className="access-denied">Access Denied: Insufficient permissions</div>;
    }
  }

  return <>{children}</>;
};
