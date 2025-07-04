import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleAuthSuccess = (user) => {
    // Navigate to dashboard after successful auth
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">FitHub</h1>
          <p className="auth-tagline">Track your fitness journey</p>
        </div>
        
        <div className="auth-content">
          {isLogin ? (
            <LoginForm 
              onToggleForm={handleToggleForm}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm 
              onToggleForm={handleToggleForm}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth; 