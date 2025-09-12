import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RegisterForm = ({ onToggleForm, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loading } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await register(formData.username, formData.email, formData.password);
      
      if (result.success) {
        onSuccess?.(result.user);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: 'Enter a password' };
    
    let strength = 0;
    let feedback = [];

    if (password.length >= 6) strength++;
    else feedback.push('at least 6 characters');

    if (/[a-z]/.test(password)) strength++;
    else feedback.push('one lowercase letter');

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('one uppercase letter');

    if (/\d/.test(password)) strength++;
    else feedback.push('one number');

    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      strength,
      text: strength === 4 ? 'Strong' : `Needs: ${feedback.join(', ')}`,
      color: ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#00cc44'][strength]
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="auth-form">
      <h2 className="auth-title">Create Account</h2>
      <p className="auth-subtitle">Join FitHub and start tracking your fitness journey</p>
      
      <form onSubmit={handleSubmit} className="auth-form-fields">
        {errors.general && (
          <div className="auth-error">
            {errors.general}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            className={errors.username ? 'error' : ''}
            disabled={loading}
          />
          {errors.username && <span className="field-error">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className={errors.email ? 'error' : ''}
            disabled={loading}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className={errors.password ? 'error' : ''}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {formData.password && (
            <div className="password-strength">
              <div 
                className={`password-strength-bar h-1 rounded transition-all duration-300 ${
                  passwordStrength.strength === 1 ? 'bg-fithub-bright-red' :
                  passwordStrength.strength === 2 ? 'bg-fithub-orange' :
                  passwordStrength.strength === 3 ? 'bg-fithub-yellow' :
                  passwordStrength.strength === 4 ? 'bg-fithub-orange' : 'bg-fithub-light-grey'
                }`}
                style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
              />
              <span 
                className={`password-strength-text text-sm font-medium ${
                  passwordStrength.strength === 1 ? 'text-fithub-bright-red' :
                  passwordStrength.strength === 2 ? 'text-fithub-orange' :
                  passwordStrength.strength === 3 ? 'text-fithub-yellow' :
                  passwordStrength.strength === 4 ? 'text-fithub-orange' : 'text-fithub-text'
                }`}
              >
                {passwordStrength.text}
              </span>
            </div>
          )}
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-input-group">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button 
            type="button" 
            className="auth-link"
            onClick={onToggleForm}
            disabled={loading}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm; 