import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="flex justify-center items-center h-50 text-base text-fithub-text">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;