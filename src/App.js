import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Progress from './pages/Progress';
import Community from './pages/Community';
import ProfilePage from './pages/ProfilePage';
import FitbitCallback from './components/FitbitCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import { FitbitProvider } from './context/FitbitContext';

function App() {
  return (
    <FitbitProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/callback" element={<FitbitCallback />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </div>
      </Router>
    </FitbitProvider>
  );
}

export default App; 