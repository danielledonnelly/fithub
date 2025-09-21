import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Don't show header on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">FitHub</Link>
          
          {isAuthenticated() ? (
            <>
              <nav className="nav">
                <Link 
                  to="/" 
                  className={`nav-link text-sm lg:text-base ${location.pathname === '/' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/goals" 
                  className={`nav-link text-sm lg:text-base ${location.pathname === '/goals' ? 'active' : ''}`}
                >
                  Goals
                </Link>
                <Link 
                  to="/community" 
                  className={`nav-link text-sm lg:text-base ${location.pathname === '/community' ? 'active' : ''}`}
                >
                  Community
                </Link>
                <Link 
                  to="/settings" 
                  className={`nav-link text-sm lg:text-base ${location.pathname === '/settings' ? 'active' : ''}`}
                >
                  Settings
                </Link>
              </nav>
              
              <div className="header-user">
                <span className="user-greeting hidden md:inline">
                  Welcome, {user?.username || 'User'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="logout-button text-sm lg:text-base"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="header-auth">
              <Link to="/auth" className="nav-link">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 