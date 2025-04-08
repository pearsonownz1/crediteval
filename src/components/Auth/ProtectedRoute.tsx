import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  // You can add props here if needed, e.g., required roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen while checking auth state
    return <div>Loading...</div>;
  }

  if (!user) {
    // User not logged in, redirect to login page
    // You can pass the current location to redirect back after login
    // state={{ from: location }}
    return <Navigate to="/login" replace />;
  }

  // User is logged in, render the child route element
  return <Outlet />;
};

export default ProtectedRoute;
