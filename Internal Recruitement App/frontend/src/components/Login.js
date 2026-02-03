import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.LOGIN),
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      
      // Navigate based on user designation
      switch(response.data.user.designation) {
        case 'Admin':
          navigate('/AdminDashboard');
          break;
        case 'BU HEAD':
          navigate('/BUPage');
          break;
        case 'HR HEAD':
        case 'HR EXECUTIVE':
          navigate('/HRPage');
          break;
        default:
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setError('Invalid user role. Please contact administrator.');
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="alchemy-logo">
          <h1>ALCHEMY</h1>
          <p>TECHSOL INDIA PVT LTD</p>
        </div>
      </div>
      
      <div className="login-form-container">
        <div className="login-form">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your Internal Recruitment Account</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="signup-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;