import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import NewHireModal from './NewHireModal';
import ReplacementModal from './ReplacementModal';
import ApprovalDashboard from './ApprovalDashboard';
import TentativeDetailsModal from './TentativeDetailsModal';
import ReplacementDetailsModal from './ReplacementDetailsModal';
import NewHireDetailsModal from './NewHireDetailsModal';
import ExistingTeamModal from './ExistingTeamModal';
import CandidateDetailsModal from './CandidateDetailsModal';
import './BUPage.css';
import TeamCostModal from './TeamCostModal';
import TeamBudgetOptionsModal from './TeamBudgetOptionsModal';
import ShowTeamBudgetModal from './ShowTeamBudgetModal';

const BUPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewHireModal, setShowNewHireModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showApprovalDashboard, setShowApprovalDashboard] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [totalHired, setTotalHired] = useState(0);
  const [hiredNotifications, setHiredNotifications] = useState([]);
  const [rejectionNotifications, setRejectionNotifications] = useState([]);
  const navigate = useNavigate();
  const [showTeamBudgetOptionsModal, setShowTeamBudgetOptionsModal] = useState(false);
  const [showTeamCostModal, setShowTeamCostModal] = useState(false);
  const [showShowTeamBudgetModal, setShowShowTeamBudgetModal] = useState(false);
  const [teamCost, setTeamCost] = useState(0);
  const [totalCTC, setTotalCTC] = useState(0);
  const [showTentativeDetailsModal, setShowTentativeDetailsModal] = useState(false);
  const [tentativeDetailsRequests, setTentativeDetailsRequests] = useState({
    newHire: [],
    replacement: []
  });
  const [selectedTentativeRequest, setSelectedTentativeRequest] = useState(null);
  const [showReplacementDetailsModal, setShowReplacementDetailsModal] = useState(false);
  const [showNewHireDetailsModal, setShowNewHireDetailsModal] = useState(false);
  const [showExistingTeamModal, setShowExistingTeamModal] = useState(false);
  const [showCandidateDetailsModal, setShowCandidateDetailsModal] = useState(false);
  const [candidateDetailsTitle, setCandidateDetailsTitle] = useState('');
  const [candidateDetailsData, setCandidateDetailsData] = useState([]);
  const [editingRejectedApproval, setEditingRejectedApproval] = useState(null);
  const [metrics, setMetrics] = useState({
    hiringTicketRaised: 0,
    approvedYetToHire: 0,
    selectedYetToOffer: 0,
    offeredYetToJoin: 0,
    existingTeam: 0,
    toBeRationalized: 0,
    teamCost: 0
  });


  useEffect(() => {
    if (user) {
      const fetchTeamCost = async () => {
        try {
          const response = await axios.get(buildApiUrl(`/api/users/${user.id}/team-cost`));
          const val = response.data.team_cost;
          setTeamCost(val != null && val !== '' ? Number(val) : 0);
        } catch (error) {
          console.error('Error fetching team cost:', error);
        }
      };
      fetchTeamCost();
    }
  }, [user]);
// Add this function to format currency
const formatCurrency = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};  

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLoading(false); // Set loading to false immediately
      
      // Show welcome popup for 5 minutes
      setShowWelcomePopup(true);
      setPopupLoading(true); // Show loading in popup
      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
      }, 5 * 60 * 1000); // 5 minutes

      // Fetch data in background (non-blocking)
      fetchNotifications(parsedUser.id);
      fetchRejectionNotifications(parsedUser.id);
      fetchRecentApprovals(parsedUser.id);
      fetchTotalHired(parsedUser.id);
      fetchHiredNotifications(parsedUser.id);
      fetchTotalCTC(parsedUser.id);
      fetchTentativeDetailsRequests(parsedUser.id);
      fetchMetrics(parsedUser.id, parsedUser.business_unit); 

      // Fallback: hide loading after 3 seconds even if data fails
      const fallbackTimer = setTimeout(() => {
        setPopupLoading(false);
      }, 3011);

      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTotalCTC = async (userId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/users/${userId}/total-ctc`));
      const val = response.data.totalCTC;
      setTotalCTC(val != null && val !== '' ? Number(val) : 0);
    } catch (error) {
      console.error('Error fetching total CTC:', error);
      setTotalCTC(0);
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/notifications/${userId}`));
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't block the UI if notifications fail
    }
  };

  const fetchHiredNotifications = async (userId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/hired-notifications/${userId}`));
      setHiredNotifications(response.data);
    } catch (error) {
      console.error('Error fetching hired notifications:', error);
    }
  };

  const fetchRejectionNotifications = async (userId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/rejection-notifications/${userId}`));
      setRejectionNotifications(response.data);
    } catch (error) {
      console.error('Error fetching rejection notifications:', error);
    }
  };

  const fetchRecentApprovals = async (userId) => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Fetch recent approved requests for this BU Head
      const fetchPromise = Promise.all([
        axios.get(buildApiUrl(`/api/approvals/sent/${userId}`)),
        axios.get(buildApiUrl(`/api/replacement-approvals/sent/${userId}`))
      ]);

      const [newHireResponse, replacementResponse] = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);
      
      // Get all requests (not just approved ones) to show workflow status
      const allNewHires = newHireResponse.data;
      const allReplacements = replacementResponse.data;
      
      const allRequests = [
        ...allNewHires.map(req => ({ ...req, type: 'new_hire' })),
        ...allReplacements.map(req => ({ ...req, type: 'replacement' }))
      ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5); // Get latest 5
      
      setRecentApprovals(allRequests);
      setPopupLoading(false); // Hide loading when data is ready
    } catch (error) {
      console.error('Error fetching recent approvals:', error);
      setPopupLoading(false); // Hide loading even if there's an error
      // Set empty array to show "no approvals" message
      setRecentApprovals([]);
    }
  };

  const fetchTotalHired = async (userId) => {
    try {
      // Fetch approved candidates count for this BU Head
      const [newHireResponse, replacementResponse] = await Promise.all([
        axios.get(buildApiUrl(`/api/approvals/sent/${userId}`)),
        axios.get(buildApiUrl(`/api/replacement-approvals/sent/${userId}`))
      ]);
      
      const approvedNewHires = newHireResponse.data.filter(req => req.approval_status === 'Approved');
      const approvedReplacements = replacementResponse.data.filter(req => req.approval_status === 'Approved');
      
      const totalApproved = approvedNewHires.length + approvedReplacements.length;
      setTotalHired(totalApproved);
    } catch (error) {
      console.error('Error fetching total hired:', error);
      setTotalHired(0);
    }
  };

  const fetchTentativeDetailsRequests = async (userId) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/bu/tentative-details-requests/${userId}`));
      setTentativeDetailsRequests(response.data);
    } catch (error) {
      console.error('Error fetching tentative details requests:', error);
    }
  };

  const fetchMetrics = async (userId, businessUnit) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/bu-metrics/${businessUnit}/${userId}`));
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchCandidateDetails = async (category) => {
    try {
      const response = await axios.get(buildApiUrl(`/api/candidates/${category}/${user.business_unit}`));
      setCandidateDetailsData(response.data);
      setShowCandidateDetailsModal(true);
    } catch (error) {
      console.error(`Error fetching ${category} candidates:`, error);
    }
  };

  const handleStatCardClick = (category, title) => {
    setCandidateDetailsTitle(title);
    fetchCandidateDetails(category);
  };

  const getApprovalStatus = (request) => {
    if (request.approval_status === 'Approved') {
      return { status: 'approved', text: '✓ Approved', class: 'approved' };
    } else if (request.approval_status === 'Rejected') {
      return { status: 'rejected', text: '✗ Rejected', class: 'rejected' };
    } else if (request.hr_head_approved && !request.ADMIN_approved) {
      return { status: 'pending_admin', text: '⏳ Pending Admin', class: 'pending-admin' };
    } else if (request.bu_head_approved && !request.hr_head_approved) {
      return { status: 'pending_hr', text: '⏳ Pending HR', class: 'pending-hr' };
    } else {
      return { status: 'pending', text: '⏳ Pending', class: 'pending' };
    }
  };

  const getStatusMessage = (request) => {
    if (request.approval_status === 'Approved') {
      return 'Your request has been fully approved!';
    } else if (request.approval_status === 'Rejected') {
      return `Request was rejected: ${request.rejection_reason || 'No reason provided'}`;
    } else if (request.hr_head_approved && !request.ADMIN_approved) {
      return 'HR Head approved! Waiting for Admin approval.';
    } else if (request.bu_head_approved && !request.hr_head_approved) {
      return 'Request submitted! Waiting for HR Head approval.';
    } else {
      return 'Request is being processed.';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNewHireSuccess = (success) => {
    setShowNewHireModal(false);
  };

  const handleReplacementSuccess = (success) => {
    setShowReplacementModal(false);
  };

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="bu-page">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="welcome-popup-overlay">
          <div className="welcome-popup">
            <div className="welcome-popup-header">
              <h3>Welcome back, {user.name}! 👋</h3>
              <button onClick={closeWelcomePopup} className="close-popup-btn">&times;</button>
            </div>
            <div className="welcome-popup-content">
              {popupLoading ? (
                <div className="loading-indicator">
                  <p>Loading your recent approvals...</p>
                  <div className="spinner"></div>
                </div>
              ) : (
                <>
                  <div className="welcome-message">
                    <p>Here's what's happening with your recent approval requests:</p>
                  </div>
                  
                  {recentApprovals.length > 0 ? (
                    <div className="recent-approvals">
                      <h4>Recent Approval Requests</h4>
                      <div className="approval-list">
                        {recentApprovals.map((approval, index) => {
                          const statusInfo = getApprovalStatus(approval);
                          const statusMessage = getStatusMessage(approval);
                          
                          return (
                            <div key={index} className="approval-item">
                              <div className="approval-icon">
                                {approval.type === 'new_hire' ? '👤' : '🔄'}
                              </div>
                              <div className="approval-details">
                                <div className="approval-title">
                                  {approval.type === 'new_hire' 
                                    ? approval.position_title 
                                    : `Replacement for ${approval.outgoing_employee_name}`
                                  }
                                </div>
                                <div className="approval-candidate">
                                  {approval.type === 'new_hire' 
                                    ? approval.candidate_name 
                                    : approval.replacement_candidate_name
                                  }
                                </div>
                                <div className="approval-date">
                                  {approval.approval_status === 'Approved' 
                                    ? `Approved: ${formatDate(approval.updated_at)}`
                                    : `Submitted: ${formatDate(approval.created_at)}`
                                  }
                                </div>
                                <div className="approval-message">
                                  {statusMessage}
                                </div>
                              </div>
                              <div className="approval-status">
                                <span className={`status-badge ${statusInfo.class}`}>
                                  {statusInfo.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="no-approvals">
                      <p>No recent approval requests to show.</p>
                      <p>Start by submitting a new hire or replacement request!</p>
                    </div>
                  )}
                  
                  <div className="popup-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => {
                        setShowNewHireModal(true);
                        closeWelcomePopup();
                      }}
                    >
                      Submit New Hire Request
                    </button>
                    <button 
                      className="action-btn secondary"
                      onClick={() => {
                        setShowReplacementModal(true);
                        closeWelcomePopup();
                      }}
                    >
                      Submit Replacement Request
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="bu-header">
        <div className="header-content">
          <div className="alchemy-brand">
            <img src="/alchemy.png" alt="Alchemy TechSol" className="alchemy-logo" />
          </div>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <span className="designation">({user.designation})</span>
            <button 
              className="candidate-data-btn"
              onClick={() => navigate('/candidate-data')}
            >
              📊 Candidate Data
            </button>
            {(notifications.length + hiredNotifications.length + rejectionNotifications.length) > 0 && (
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔 ({notifications.length + hiredNotifications.length + rejectionNotifications.length})
              </button>
            )}
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
            {notifications.length === 0 && hiredNotifications.length === 0 && rejectionNotifications.length === 0 ? (
              <div className="notification-item">
                <p>No recent notifications</p>
              </div>
            ) : (
              <>
                {/* Rejection Notifications */}
                {rejectionNotifications.map((notification, index) => (
                  <div key={`rejection-${index}`} className="notification-item rejection-notification">
                    <div className="notification-icon">❌</div>
                    <div className="notification-content">
                      <div className="notification-title">Rejected by HR/Admin</div>
                      <div className="notification-message">
                        {notification.candidate_name} - {notification.position_title}
                      </div>
                      <div className="notification-rejection-reason">
                        {notification.rejection_reason || notification.hr_head_comments || notification.admin_comments || 'No reason provided'}
                      </div>
                      <div className="notification-time">
                        {new Date(notification.updated_at).toLocaleString()}
                      </div>
                      <button
                        className="notification-action-btn"
                        onClick={() => { setShowNotifications(false); setShowApprovalDashboard(true); }}
                      >
                        View & Edit
                      </button>
                    </div>
                  </div>
                ))}
                {/* Regular Notifications */}
                {notifications.map((notification, index) => (
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
                ))}
                
                {/* Hired Notifications */}
                {hiredNotifications.map((notification, index) => (
                  <div key={`hired-${index}`} className="notification-item hired-notification">
                    <div className="notification-icon">
                      🎉
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.type === 'new_hire' ? 'New Hire Hired' : 'Replacement Hired'}
                      </div>
                      <div className="notification-message">
                        {notification.candidate_name} - {notification.position_title}
                      </div>
                      <div className="notification-employee-id">
                        Employee ID: {notification.employee_id}
                      </div>
                      <div className="notification-time">
                        Hired: {new Date(notification.hired_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <main className="bu-main">
        <div className="bu-container">
          

          {/* Left Side - Approval Management and Initiate Hiring Process */}
          <div className="left-section">
            <div className="approval-section">
              <h3>Approval Management</h3>
              <div className="approval-options">
                <button 
                  className="approval-btn"
                  onClick={() => setShowApprovalDashboard(true)}
                >
                  View Approval Requests
                </button>
              </div>
            </div>
            
            <div className="hire-action-section">
              <h3>Initiate Hiring Process</h3>
              <div className="hire-options">
                <button 
                  className="hire-option-btn replace"
                  onClick={() => setShowReplacementModal(true)}
                >
                  Replacement
                </button>
                <button 
                  className="hire-option-btn new-hire"
                  onClick={() => setShowNewHireModal(true)}
                >
                  New Hire
                </button>
              </div>
            </div>
          </div>

          {/* Center - Dashboard Stats */}
          <div className="center-section">
            <div className="dashboard-stats">
              <div className="stat-card clickable" onClick={() => handleStatCardClick('hiring-ticket-raised', 'Hiring Ticket Raised')}>
                <div className="stat-content">
                  <h3>Hiring Ticket Raised</h3>
                  <div className="stat-number">{metrics.hiringTicketRaised}</div>
                  <p>Total new hiring requests</p>
                </div>
              </div>
              
              <div className="stat-card clickable" onClick={() => handleStatCardClick('approved-yet-to-hire', 'Approved yet to hire')}>
                <div className="stat-content">
                  <h3>Approved yet to hire</h3>
                  <div className="stat-number">{metrics.approvedYetToHire}</div>
                  <p>HR & Admin approved</p>
                </div>
              </div>
              
              <div className="stat-card clickable" onClick={() => handleStatCardClick('selected-yet-to-offer', 'Selected yet to offer')}>
                <div className="stat-content">
                  <h3>Selected yet to offer</h3>
                  <div className="stat-number">{metrics.selectedYetToOffer}</div>
                  <p>Tentative details entered</p>
                </div>
              </div>
              
              <div className="stat-card clickable" onClick={() => handleStatCardClick('offered-yet-to-join', 'Offered, yet to join')}>
                <div className="stat-content">
                  <h3>Offered, yet to join</h3>
                  <div className="stat-number">{metrics.offeredYetToJoin}</div>
                  <p>Final details entered</p>
                </div>
              </div>
              
              <div className="stat-card clickable" onClick={() => handleStatCardClick('existing-team', 'Existing Team')}>
                <div className="stat-content">
                  <h3>Existing Team</h3>
                  <div className="stat-number">{metrics.existingTeam}</div>
                  <p>Total candidates in your BU</p>
                </div>
              </div>
              
              <div className="stat-card clickable" onClick={() => handleStatCardClick('to-be-rationalized', 'To be Rationalized')}>
                <div className="stat-content">
                  <h3>To be Rationalized</h3>
                  <div className="stat-number">{metrics.toBeRationalized}</div>
                  <p>Replaced candidates</p>
                </div>
              </div>
            </div>
            
            <div className="budget-row-stats">
              <div 
                className="stat-card team-budget clickable"
                onClick={() => setShowTeamBudgetOptionsModal(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowTeamBudgetOptionsModal(true)}
                title="Click for team budget options"
              >
                <div className="stat-content">
                  <h3>Team Budget <span className="click-hint">(click to manage)</span></h3>
                  <div className="budget-metrics">
                    <div className="budget-row">
                      <span className="budget-label">Total Budget:</span>
                      <span className="budget-value">{formatCurrency((Number(teamCost) || 0) + (Number(totalCTC) || 0))}</span>
                    </div>
                    <div className="budget-row">
                      <span className="budget-label">Consumed (20% of joined hires):</span>
                      <span className="budget-value consumed">{formatCurrency(totalCTC)}</span>
                    </div>
                    <div className="budget-row remaining">
                      <span className="budget-label">Total Remaining:</span>
                      <span className="budget-value">{formatCurrency(teamCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Empty for now */}
          <div className="right-section">
          </div>

          {/* Below Dashboard - Pending Tentative Details */}
          <div className="below-dashboard-section">
            {/* Tentative Details Section */}
            {(tentativeDetailsRequests.newHire.length > 0 || tentativeDetailsRequests.replacement.length > 0) && (
              <div className="tentative-details-section">
                <h3>Pending Tentative Details</h3>
                <div className="tentative-requests">
                  {tentativeDetailsRequests.newHire.map((request, index) => (
                    <div key={`new-hire-${request.id}`} className="tentative-request-item">
                      <div className="request-info">
                        <h4>New Hire: {request.position_title}</h4>
                        <p>Business Unit: {request.business_unit}</p>
                        <p>Admin approved on: {formatDate(request.ADMIN_approval_date)}</p>
                      </div>
                      <button 
                        className="enter-tentative-btn"
                        onClick={() => {
                          setSelectedTentativeRequest({ ...request, type: 'new-hire' });
                          setShowTentativeDetailsModal(true);
                        }}
                      >
                        Enter Tentative Details
                      </button>
                    </div>
                  ))}
                  {tentativeDetailsRequests.replacement.map((request, index) => (
                    <div key={`replacement-${request.id}`} className="tentative-request-item">
                      <div className="request-info">
                        <h4>Replacement: {request.replacement_candidate_name}</h4>
                        <p>Business Unit: {request.business_unit}</p>
                        <p>Admin approved on: {formatDate(request.admin_approval_date)}</p>
                      </div>
                      <button 
                        className="enter-tentative-btn"
                        onClick={() => {
                          setSelectedTentativeRequest({ ...request, type: 'replacement' });
                          setShowTentativeDetailsModal(true);
                        }}
                      >
                        Enter Tentative Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>


        </div>
      </main>

      {showNewHireModal && (
        <NewHireModal
          onClose={() => setShowNewHireModal(false)}
          onSuccess={handleNewHireSuccess}
          user={user}
        />
      )}

      {editingRejectedApproval?.type === 'newHire' && editingRejectedApproval.approval && user && (
        <NewHireModal
          onClose={(success) => {
            setEditingRejectedApproval(null);
            if (success && user?.id) {
              fetchRejectionNotifications(user.id);
              fetchNotifications(user.id);
              fetchRecentApprovals(user.id);
            }
          }}
          onSuccess={() => {}}
          user={user}
          editMode
          initialData={editingRejectedApproval.approval}
        />
      )}

      {showReplacementModal && (
        <ReplacementModal
          onClose={() => setShowReplacementModal(false)}
          onSuccess={handleReplacementSuccess}
          user={user}
        />
      )}

      {editingRejectedApproval?.type === 'replacement' && editingRejectedApproval.approval && user && (
        <ReplacementModal
          onClose={(success) => {
            setEditingRejectedApproval(null);
            if (success && user?.id) {
              fetchRejectionNotifications(user.id);
              fetchNotifications(user.id);
              fetchRecentApprovals(user.id);
            }
          }}
          onSuccess={() => {}}
          user={user}
          editMode
          initialData={editingRejectedApproval.approval}
        />
      )}

      {showApprovalDashboard && user && (
        <ApprovalDashboard
          onClose={() => {
            setShowApprovalDashboard(false);
            if (user?.id) {
              fetchRejectionNotifications(user.id);
              fetchNotifications(user.id);
              fetchRecentApprovals(user.id);
            }
          }}
          onEditNewHire={(approval) => {
            setShowApprovalDashboard(false);
            setEditingRejectedApproval({ approval, type: 'newHire' });
          }}
          onEditReplacement={(approval) => {
            setShowApprovalDashboard(false);
            setEditingRejectedApproval({ approval, type: 'replacement' });
          }}
          user={user}
        />
      )}
{showTeamBudgetOptionsModal && (
  <TeamBudgetOptionsModal
    onClose={() => setShowTeamBudgetOptionsModal(false)}
    onAddBudget={() => {
      setShowTeamBudgetOptionsModal(false);
      setShowTeamCostModal(true);
    }}
    onShowBudget={() => {
      setShowTeamBudgetOptionsModal(false);
      setShowShowTeamBudgetModal(true);
    }}
  />
)}

{showTeamCostModal && (
  <TeamCostModal
    onClose={(success) => {
      setShowTeamCostModal(false);
      if (success) {
        axios.get(buildApiUrl(`/api/users/${user.id}/team-cost`))
          .then(response => setTeamCost(response.data.team_cost || 0))
          .catch(error => console.error('Error refreshing team cost:', error));
      }
    }}
    user={user}
    currentBudget={teamCost}
  />
)}

{showShowTeamBudgetModal && (
  <ShowTeamBudgetModal
    onClose={() => setShowShowTeamBudgetModal(false)}
    user={user}
  />
)}

{showTentativeDetailsModal && selectedTentativeRequest && (
  <TentativeDetailsModal
    onClose={(success) => {
      setShowTentativeDetailsModal(false);
      setSelectedTentativeRequest(null);
      if (success) {
        // Refresh tentative details requests
        fetchTentativeDetailsRequests(user.id);
      }
    }}
    user={user}
    requestType={selectedTentativeRequest.type}
    requestId={selectedTentativeRequest.id}
    requestData={selectedTentativeRequest}
  />
)}

{showReplacementDetailsModal && (
   <ReplacementDetailsModal
     onClose={() => setShowReplacementDetailsModal(false)}
     businessUnit={user.business_unit}
   />
 )}

 {showNewHireDetailsModal && (
   <NewHireDetailsModal
     onClose={() => setShowNewHireDetailsModal(false)}
     businessUnit={user.business_unit}
   />
 )}

 {showExistingTeamModal && (
   <ExistingTeamModal
     onClose={() => setShowExistingTeamModal(false)}
     businessUnit={user.business_unit}
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

export default BUPage;