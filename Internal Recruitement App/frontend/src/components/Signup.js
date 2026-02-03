import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    designation: '',
    business_unit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const businessUnits = [
    'TOWER-1 K2',
    'TOWER-2 ATLAS',
    'TOWER-3 EVEREST',
    'TOWER-4',
    'TOWER-6 KAILASH',
    'Admin',
    'HR HEAD', 
  ];

  const designations = [
    'HR HEAD',
    'HR EXECUTIVE',
    'BU HEAD',
    'Admin'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setLoading(true);
    setError('');
    setSuccess('');
  
    try {
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.SIGNUP),
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          designation: formData.designation,
          business_unit: formData.business_unit
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      setSuccess(response.data.message || 'Registration successful! Redirecting to login...');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        designation: '',
        business_unit: ''
      });
  
      // Redirect after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
  
    } catch (err) {
      const serverError = err.response?.data;
      if (serverError) {
        setError(serverError.error || serverError.message || 'Registration failed');
        if (serverError.details) {
          console.error('Server error details:', serverError.details);
        }
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="signup-container">
      <div className="signup-background">
        <div className="alchemy-logo">
          <h1>ALCHEMY</h1>
          <p>TECHSOL INDIA PVT LTD</p>
        </div>
      </div>
      
      <div className="signup-form-container">
        <div className="signup-form">
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Join the Internal Recruitment System</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="designation">Designation</label>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                >
                  <option value="">Select designation</option>
                  {designations.map((designation) => (
                    <option key={designation} value={designation}>
                      {designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="business_unit">Business Unit</label>
                <select
                  id="business_unit"
                  name="business_unit"
                  value={formData.business_unit}
                  onChange={handleChange}
                >
                  <option value="">Select business unit</option>
                  {businessUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password (min 6 characters)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="signup-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;