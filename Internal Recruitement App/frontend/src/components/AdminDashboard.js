import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import ApprovalDashboard from './ApprovalDashboard';
import CandidateDetailsModal from './CandidateDetailsModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalDashboard, setShowApprovalDashboard] = useState(false);
  const [businessUnitStats, setBusinessUnitStats] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState({
    newHire: 0,
    replacement: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modal states for candidate details
  const [showCandidateDetailsModal, setShowCandidateDetailsModal] = useState(false);
  const [candidateDetailsTitle, setCandidateDetailsTitle] = useState('');
  const [candidateDetailsData, setCandidateDetailsData] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchBusinessUnitStats();
      fetchPendingApprovals(parsedUser.id);
      fetchNotifications(parsedUser.id);
    }
    setLoading(false);
  }, []);

  const fetchBusinessUnitStats = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/hr/business-unit-stats'));
      // Add team cost data to each business unit
      const statsWithCost = await Promise.all(response.data.map(async (stat) => {
        const costResponse = await axios.get(buildApiUrl(`/api/bu-cost/${stat.business_unit}`));
        return {
          ...stat,
          team_cost: costResponse.data.team_cost || 0,
          total_ctc: costResponse.data.totalCTC || 0
        };
      }));
      setBusinessUnitStats(statsWithCost);
    } catch (error) {
      console.error('Error fetching business unit stats:', error);
    }
  };

  const fetchPendingApprovals = async (userId) => {
    try {
      const newHireResponse = await axios.get(buildApiUrl(`/api/approvals/received/${userId}`));
      const replacementResponse = await axios.get(buildApiUrl(`/api/replacement-approvals/received/${userId}`));
      
      setPendingApprovals({
        newHire: newHireResponse.data.length,
        replacement: replacementResponse.data.length
      });
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/notifications/${userId}`));
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCandidateDetails = async (type) => {
    try {
      let response;
      let title;
      
      switch (type) {
        case 'total-hires':
          response = await axios.get(buildApiUrl('/api/admin/total-hires'));
          title = 'Total Hires';
          break;
        case 'pending-requests':
          response = await axios.get(buildApiUrl('/api/admin/pending-requests'));
          title = 'Total Pending Requests';
          break;
        case 'pending-from-hr':
          response = await axios.get(buildApiUrl('/api/admin/pending-from-hr'));
          title = 'Pending from HR';
          break;
        default:
          return;
      }
      
      console.log(`Admin ${type} data:`, response.data);
      console.log(`Admin ${type} data length:`, response.data.length);
      
      setCandidateDetailsTitle(title);
      setCandidateDetailsData(response.data);
      setShowCandidateDetailsModal(true);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    }
  };

  const handleStatCardClick = (type) => {
    fetchCandidateDetails(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const totalPendingApprovals = pendingApprovals.newHire + pendingApprovals.replacement;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="header-content">
          <div className="alchemy-brand">
            <img src="/alchemy.png" alt="Alchemy TechSol" className="alchemy-logo" />
          </div>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <span className="designation admin-badge">({user.designation})</span>
            <button 
              className="candidate-data-btn"
              onClick={() => navigate('/candidate-data')}
            >
              📊 Candidate Data
            </button>
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔 {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
            </button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h4>Recent Notifications</h4>
            <button 
              className="close-notifications"
              onClick={() => setShowNotifications(false)}
            >
              ×
            </button>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notification-item">
                <p>No recent notifications</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={index} className="notification-item">
                  <div className="notification-icon">
                    {notification.type === 'new_hire' ? '👤' : '🔄'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.type === 'new_hire' ? 'New Hire Approved' : 'Replacement Approved'}
                    </div>
                    <div className="notification-message">
                      {notification.candidate_name} - {notification.position_title}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <main className="admin-main">
        <div className="admin-container">
          <div className="page-title">
            <h2>Admin Dashboard</h2>
          </div>

          {/* Pending Approvals Alert */}
          {totalPendingApprovals > 0 && (
            <div className="pending-approvals-alert">
              <div className="alert-content">
                <div className="alert-icon">⚠️</div>
                <div className="alert-text">
                  <h3>Pending Approvals</h3>
                  <p>You have {totalPendingApprovals} approval request{totalPendingApprovals > 1 ? 's' : ''} waiting for your review</p>
                  <div className="approval-breakdown">
                    {pendingApprovals.newHire > 0 && (
                      <span className="approval-type">New Hire: {pendingApprovals.newHire}</span>
                    )}
                    {pendingApprovals.replacement > 0 && (
                      <span className="approval-type">Replacement: {pendingApprovals.replacement}</span>
                    )}
                  </div>
                </div>
                <button 
                  className="review-btn"
                  onClick={() => setShowApprovalDashboard(true)}
                >
                  Review Now
                </button>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="summary-stats">
            <div className="stat-card" onClick={() => handleStatCardClick('total-hires')}>
              <h3>Total Hires</h3>
              <div className="stat-number">{businessUnitStats.reduce((sum, stat) => sum + stat.total_hires, 0)}</div>
              <p>Successfully hired candidates</p>
            </div>
            <div className="stat-card" onClick={() => handleStatCardClick('pending-requests')}>
              <h3>Total Pending Requests</h3>
              <div className="stat-number pending">{businessUnitStats.reduce((sum, stat) => sum + stat.pending_requests, 0)}</div>
              <p>Requests in progress</p>
            </div>
            <div className="stat-card" onClick={() => handleStatCardClick('pending-from-hr')}>
              <h3>Pending from HR</h3>
              <div className="stat-number pending">{totalPendingApprovals}</div>
              <p>Awaiting admin review</p>
            </div>
            <div className="stat-card">
              <h3>Total Budget Consumed</h3>
              <div className="stat-number">{formatCurrency(businessUnitStats.reduce((sum, stat) => sum + (stat.total_ctc || 0), 0))}</div>
              <p>20% of joined hires across all BUs</p>
            </div>
          </div>

          {/* Business Unit Overview */}
          <div className="business-unit-overview">
            <h3>Team Performance Overview</h3>
            <div className="stats-grid">
              {businessUnitStats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-header">
                    <h4>{stat.business_unit}</h4>
                  </div>
                  <div className="stat-content">
                    <div className="stat-item">
                      <span className="stat-label">Total Hires:</span>
                      <span className="stat-value">{stat.total_hires}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Team Budget:</span>
                      <span className="stat-value">{formatCurrency(stat.team_cost + (stat.total_ctc || 0))}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Consumed (20% of joined):</span>
                      <span className="stat-value">{formatCurrency(stat.total_ctc)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Remaining:</span>
                      <span className="stat-value remaining">
                        {formatCurrency(stat.team_cost)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Pending:</span>
                      <span className="stat-value pending">{stat.pending_requests}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn approval-btn"
                onClick={() => setShowApprovalDashboard(true)}
              >
                Review Approval Requests
              </button>
            </div>
          </div>
        </div>
      </main>

      {showApprovalDashboard && (
        <ApprovalDashboard 
          onClose={() => {
            setShowApprovalDashboard(false);
            fetchPendingApprovals(user.id);
            fetchBusinessUnitStats(); // Refresh stats after approval
          }} 
          user={user} 
        />
      )}

      {showCandidateDetailsModal && (
        <CandidateDetailsModal
          isOpen={showCandidateDetailsModal}
          onClose={() => setShowCandidateDetailsModal(false)}
          title={candidateDetailsTitle}
          candidates={candidateDetailsData}
        />
      )}
    </div>
  );
};

export default AdminDashboard;