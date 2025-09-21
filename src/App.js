import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Community from './pages/Community';
import ProfilePage from './pages/ProfilePage';
import UserProfile from './pages/UserProfile';
import Auth from './pages/Auth';
import BaseStyles from './components/BaseStyles';

function App() {
  return (
    <AuthProvider>
      <BaseStyles />
      <Router>
        <div className="App min-h-screen bg-fithub-dark-grey text-fithub-text">
          <Header />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;