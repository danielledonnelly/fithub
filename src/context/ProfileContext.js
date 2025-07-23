import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

// Avoid ProfileProivder to follow React best practice and keep components reusable
// Passing down through props is more powerful -- do not attach to context, avoid having too many users of a context as it becomes hard to refactor
export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    avatar: '',
    monthsActive: 12,
    fitnessScore: 85
  });

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('fithub-profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error parsing saved profile:', error);
      }
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fithub-profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const value = {
    profile,
    updateProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}; 