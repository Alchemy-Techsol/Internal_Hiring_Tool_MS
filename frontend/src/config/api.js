// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL ?? (process.env.NODE_ENV === 'production' ? '/internal-hiring' : 'http://localhost:5011'),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/login',
  SIGNUP: '/api/signup',

  // User Management
  USERS: '/users',

  // Approvals
  APPROVALS: '/approvals',
  REPLACEMENT_APPROVALS: '/replacement-approvals',

  // Candidates
  CANDIDATES: '/candidates',

  // Business Unit
  BU_METRICS: '/bu-metrics',
  BU_COST: '/bu-cost',

  // HR
  HR_BUSINESS_UNIT_STATS: '/hr/business-unit-stats',
  HR_FINAL_DETAILS_REQUESTS: '/hr/final-details-requests',
  HR_JOIN_CONFIRMATION_REQUESTS: '/hr/join-confirmation-requests',
  HR_CONFIRM_JOIN: '/hr/confirm-join',

  // Admin
  ADMIN_TOTAL_HIRES: '/admin/total-hires',
  ADMIN_PENDING_REQUESTS: '/admin/pending-requests',
  ADMIN_PENDING_FROM_HR: '/admin/pending-from-hr',

  // Notifications
  NOTIFICATIONS: '/notifications',

  // Replacement Details
  REPLACEMENT_DETAILS: '/replacement-details',
  NEW_HIRE_DETAILS: '/new-hire-details',

  // Debug
  DEBUG_JOIN_CONFIRMATION: '/debug/join-confirmation-candidates'
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Axios configuration
export const axiosConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
};

export default API_CONFIG;
