import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">FitHub</Link>
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
        </div>
      </div>
    </header>
  );
};

export default Header; 