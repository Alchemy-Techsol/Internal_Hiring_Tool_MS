import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminDashboard from './components/AdminDashboard';
import BUPage from './components/BUPage';
import HRPage from './components/HRPage';
import CandidateDataPage from './components/CandidateDataPage';
import './App.css';

// Authentication wrapper component
const ProtectedRoute = ({ children }) => {
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Dashboard Component
const RoleBasedDashboard = () => {
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userData);
  const designation = user.designation;

  // Route based on designation
  if (designation === 'Admin') {
    return <AdminDashboard />;
  } else if (designation === 'BU HEAD') {
    return <BUPage />;
  } else if (designation === 'HR HEAD' || designation === 'HR EXECUTIVE') {
    return <HRPage />;
  } else {
    // Default fallback - redirect to login
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router basename="/internal-hiring">
      <div className="App">
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Login page */}
          <Route path="/login" element={<Login />} />
          
          {/* Signup page */}
          <Route path="/signup" element={<Signup />} />
          
                    {/* Role-based Dashboard Routing */}
          <Route path="/dashboard" element={<RoleBasedDashboard />} />
          
          {/* Direct role-based routes */}
          <Route path="/AdminDashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/BUPage" element={<ProtectedRoute><BUPage /></ProtectedRoute>} />
          <Route path="/HRPage" element={<ProtectedRoute><HRPage /></ProtectedRoute>} />
          <Route path="/candidate-data" element={<ProtectedRoute><CandidateDataPage /></ProtectedRoute>} />
          
          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
