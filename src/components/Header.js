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
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/workouts" 
                  className={`nav-link ${location.pathname === '/workouts' ? 'active' : ''}`}
                >
                  Workouts
                </Link>
                <Link 
                  to="/progress" 
                  className={`nav-link ${location.pathname === '/progress' ? 'active' : ''}`}
                >
                  Progress
                </Link>
                <Link 
                  to="/community" 
                  className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}
                >
                  Community
                </Link>
                <Link 
                  to="/profile" 
                  className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                >
                  Profile
                </Link>
              </nav>
              
              <div className="header-user">
                <span className="user-greeting">
                  Welcome, {user?.username || 'User'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="logout-button"
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