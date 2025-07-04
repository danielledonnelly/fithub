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
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '16px',
            color: '#c9d1d9'
          }}>
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