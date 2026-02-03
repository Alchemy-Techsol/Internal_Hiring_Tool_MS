import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import ApprovalDashboard from './ApprovalDashboard';
import FinalDetailsModal from './FinalDetailsModal';
import JoinConfirmationModal from './JoinConfirmationModal';
import './HRPage.css';

const HRPage = () => {
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
  const [showFinalDetailsModal, setShowFinalDetailsModal] = useState(false);
  const [finalDetailsRequests, setFinalDetailsRequests] = useState({
    newHire: [],
    replacement: []
  });
  const [selectedFinalRequest, setSelectedFinalRequest] = useState(null);
  const [joinConfirmationRequests, setJoinConfirmationRequests] = useState({
    newHire: [],
    replacement: []
  });
  const [selectedJoinRequest, setSelectedJoinRequest] = useState(null);
  const [showJoinConfirmationModal, setShowJoinConfirmationModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchBusinessUnitStats();
      fetchPendingApprovals(parsedUser.id);
      fetchFinalDetailsRequests();
      fetchJoinConfirmationRequests();
      fetchNotifications(parsedUser.id);
    }
    setLoading(false);
  }, []);

  const fetchBusinessUnitStats = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/hr/business-unit-stats'));
      setBusinessUnitStats(response.data);
    } catch (error) {
      console.error('Error fetching business unit stats:', error);
    }
  };

  const fetchPendingApprovals = async (userId) => {
    try {
      // Fetch pending new hire approvals (approved by BU Head, waiting for HR Head)
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

  // OLD EMPLOYEE ID WORKFLOW REMOVED - REPLACED BY NEW WORKFLOW

  const fetchFinalDetailsRequests = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/hr/final-details-requests'));
      setFinalDetailsRequests(response.data);
    } catch (error) {
      console.error('Error fetching final details requests:', error);
    }
  };

  const fetchJoinConfirmationRequests = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/hr/join-confirmation-requests'));
      console.log('Join confirmation requests:', response.data);
      setJoinConfirmationRequests(response.data);
    } catch (error) {
      console.error('Error fetching join confirmation requests:', error);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
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
    <div className="hr-page">
      <header className="hr-header">
        <div className="header-content">
          <div className="alchemy-brand">
            <img src="/alchemy.png" alt="Alchemy TechSol" className="alchemy-logo" />
          </div>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <span className="designation hr-badge">({user.designation})</span>
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
                <div key={`regular-${index}`} className="notification-item">
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

      <main className="hr-main">
        <div className="hr-container">
          <div className="page-title">
            <h2>HR Head Dashboard</h2>
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



          {/* Final Details Requests Alert */}
          {(finalDetailsRequests.newHire.length > 0 || finalDetailsRequests.replacement.length > 0) && (
            <div className="final-details-alert">
              <div className="alert-content">
                <div className="alert-icon">📝</div>
                <div className="alert-text">
                  <h3>Final Details Required</h3>
                  <p>You have {finalDetailsRequests.newHire.length + finalDetailsRequests.replacement.length} candidate{finalDetailsRequests.newHire.length + finalDetailsRequests.replacement.length > 1 ? 's' : ''} waiting for final details entry</p>
                  <div className="approval-breakdown">
                    {finalDetailsRequests.newHire.length > 0 && (
                      <span className="approval-type">New Hire: {finalDetailsRequests.newHire.length}</span>
                    )}
                    {finalDetailsRequests.replacement.length > 0 && (
                      <span className="approval-type">Replacement: {finalDetailsRequests.replacement.length}</span>
                    )}
                  </div>
                </div>
                <button 
                  className="review-btn"
                  onClick={() => {
                    // Show the first available request
                    const firstRequest = finalDetailsRequests.newHire[0] || finalDetailsRequests.replacement[0];
                    if (firstRequest) {
                      setSelectedFinalRequest({
                        ...firstRequest,
                        type: finalDetailsRequests.newHire[0] ? 'new-hire' : 'replacement'
                      });
                      setShowFinalDetailsModal(true);
                    }
                  }}
                >
                  Enter Final Details
                </button>
              </div>
            </div>
          )}

          {/* Join Confirmation Requests Alert */}
          {console.log('Join confirmation requests state:', joinConfirmationRequests)}
          {(joinConfirmationRequests.newHire.length > 0 || joinConfirmationRequests.replacement.length > 0) && (
            <div className="join-confirmation-alert">
              <div className="alert-content">
                <div className="alert-icon">✅</div>
                <div className="alert-text">
                  <h3>Join Confirmation Required</h3>
                  <p>You have {joinConfirmationRequests.newHire.length + joinConfirmationRequests.replacement.length} candidate{joinConfirmationRequests.newHire.length + joinConfirmationRequests.replacement.length > 1 ? 's' : ''} who have reached their join date and need confirmation</p>
                  <div className="approval-breakdown">
                    {joinConfirmationRequests.newHire.length > 0 && (
                      <span className="approval-type">New Hire: {joinConfirmationRequests.newHire.length}</span>
                    )}
                    {joinConfirmationRequests.replacement.length > 0 && (
                      <span className="approval-type">Replacement: {joinConfirmationRequests.replacement.length}</span>
                    )}
                  </div>
                </div>
                <button 
                  className="review-btn"
                  onClick={() => {
                    // Show the first available request
                    const firstRequest = joinConfirmationRequests.newHire[0] || joinConfirmationRequests.replacement[0];
                    if (firstRequest) {
                      setSelectedJoinRequest({
                        ...firstRequest,
                        type: joinConfirmationRequests.newHire[0] ? 'new-hire' : 'replacement'
                      });
                      setShowJoinConfirmationModal(true);
                    }
                  }}
                >
                  Confirm Join Status
                </button>
              </div>
            </div>
          )}

          {/* Business Unit Overview */}
          <div className="business-unit-overview">
            <h3>Business Unit Overview</h3>
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
                      <span className="stat-label">Pending:</span>
                      <span className="stat-value pending">{stat.pending_requests}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Approved:</span>
                      <span className="stat-value approved">{stat.approved_requests}</span>
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
            fetchPendingApprovals(user.id); // Refresh pending counts
          }} 
          user={user} 
        />
      )}

      {showFinalDetailsModal && selectedFinalRequest && (
        <FinalDetailsModal
          onClose={(success) => {
            setShowFinalDetailsModal(false);
            setSelectedFinalRequest(null);
            if (success) {
              // Refresh final details requests
              fetchFinalDetailsRequests();
            }
          }}
          user={user}
          requestType={selectedFinalRequest.type}
          requestId={selectedFinalRequest.id}
          requestData={selectedFinalRequest}
        />
      )}

      {showJoinConfirmationModal && selectedJoinRequest && (
        <JoinConfirmationModal
          onClose={(success) => {
            setShowJoinConfirmationModal(false);
            setSelectedJoinRequest(null);
            if (success) {
              // Refresh join confirmation requests
              fetchJoinConfirmationRequests();
            }
          }}
          user={user}
          requestType={selectedJoinRequest.type}
          requestId={selectedJoinRequest.id}
          requestData={selectedJoinRequest}
        />
      )}
    </div>
  );
};

export default HRPage; 