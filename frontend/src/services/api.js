import axios from 'axios';

const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5011').replace(/\/$/, '');
const API_BASE_URL = `${baseUrl}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear user data and redirect to login
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User API functions
export const userAPI = {
  // Login user
  login: (credentials) => api.post('/users/login', credentials),
  
  // Register new user
  register: (userData) => api.post('/users/register', userData),
  
  // Get all users
  getAllUsers: () => api.get('/users'),
  
  // Get user by ID
  getUserById: (id) => api.get(`/users/${id}`),
  
  // Update user
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Get users by business unit
  getUsersByBusinessUnit: (businessUnit) => api.get(`/users/business-unit/${businessUnit}`),
  
  // Get users by designation
  getUsersByDesignation: (designation) => api.get(`/users/designation/${designation}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api; 