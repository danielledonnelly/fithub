import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <a href="/" className="logo">💪 FitHub</a>
          <nav className="nav">
            <a href="/" className="nav-link">Dashboard</a>
            <a href="/workouts" className="nav-link">Workouts</a>
            <a href="/progress" className="nav-link">Progress</a>
            <a href="/community" className="nav-link">Community</a>
            <a href="/profile" className="nav-link">Profile</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 