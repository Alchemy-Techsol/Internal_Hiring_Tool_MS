import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './ApprovalDashboard.css';

const ApprovalDashboard = ({ user, onClose, onEditNewHire, onEditReplacement }) => {
  const [approvals, setApprovals] = useState({
    sent: {
      newHire: [],
      replacement: []
    },
    received: {
      newHire: [],
      replacement: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    (user.designation === 'HR Head' || user.designation === 'HR HEAD' || user.designation === 'Admin') 
      ? 'received' 
      : 'sent'
  );
  const [activeType, setActiveType] = useState('newHire');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      
      // Fetch new hire approvals
      const sentNewHireResponse = await axios.get(buildApiUrl(`/api/approvals/sent/${user.id}`));
      const receivedNewHireResponse = await axios.get(buildApiUrl(`/api/approvals/received/${user.id}`));
      
      // Fetch replacement approvals
      const sentReplacementResponse = await axios.get(buildApiUrl(`/api/replacement-approvals/sent/${user.id}`));
      const receivedReplacementResponse = await axios.get(buildApiUrl(`/api/replacement-approvals/received/${user.id}`));
      
      setApprovals({
        sent: {
          newHire: sentNewHireResponse.data || [],
          replacement: sentReplacementResponse.data || []
        },
        received: {
          newHire: receivedNewHireResponse.data || [],
          replacement: receivedReplacementResponse.data || []
        }
      });
    } catch (err) {
      setError('Failed to fetch approval requests');
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId, type) => {
    try {
      const comments = prompt('Add any comments (optional):') || '';
      const endpoint = type === 'replacement' 
        ? buildApiUrl(`/api/replacement-approvals/${approvalId}/approve`)
        : buildApiUrl(`/api/approvals/${approvalId}/approve`);
      
      await axios.put(endpoint, {
        approved_by: user.id,
        comments: comments
      });
      fetchApprovals(); // Refresh the list
    } catch (err) {
      setError('Failed to approve request');
    }
  };

  const handleReject = async (approvalId, reason, type) => {
    try {
      const comments = prompt('Add any additional comments (optional):') || '';
      const endpoint = type === 'replacement'
        ? buildApiUrl(`/api/replacement-approvals/${approvalId}/reject`)
        : buildApiUrl(`/api/approvals/${approvalId}/reject`);
      
      await axios.put(endpoint, {
        rejected_by: user.id,
        rejection_reason: reason,
        comments: comments
      });
      fetchApprovals(); // Refresh the list
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const handleDeleteRejected = async (approvalId, type) => {
    if (!window.confirm('Are you sure you want to delete this candidate data? This cannot be undone.')) return;
    try {
      const endpoint = type === 'replacement'
        ? buildApiUrl(`/api/replacement-approvals/${approvalId}?userId=${user.id}`)
        : buildApiUrl(`/api/approvals/${approvalId}?userId=${user.id}`);
      await axios.delete(endpoint);
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  const getStatusBadge = (approval) => {
    const { approval_status, bu_head_approved, hr_head_approved, ADMIN_approved, admin_approved } = approval;
    
    if (approval_status === 'Approved') {
      return <span className="status-badge status-approved">Approved</span>;
    } else if (approval_status === 'Rejected') {
      return <span className="status-badge status-rejected">Rejected</span>;
    } else if (approval_status === 'More Info Needed') {
      return <span className="status-badge status-review">More Info Needed</span>;
    } else {
      // Pending status - show which level is pending
      if (!bu_head_approved) {
        return <span className="status-badge status-pending">Pending BU Head</span>;
      } else if (!hr_head_approved) {
        return <span className="status-badge status-pending">Pending HR Head</span>;
      } else if (!ADMIN_approved && !admin_approved) {
        return <span className="status-badge status-pending">Pending Admin</span>;
      }
      return <span className="status-badge status-pending">Pending</span>;
    }
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
    return (
      <div className="approval-modal-overlay">
        <div className="approval-modal-content">
          <div className="loading-spinner">Loading approval requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-modal-overlay">
      <div className="approval-modal-content">
        <div className="approval-header">
          <h3>Approval Dashboard</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="approval-tabs">
          {/* Only show Sent Requests tab for BU Head users */}
          {(user.designation === 'BU Head' || user.designation === 'BU HEAD') && (
            <button 
              className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
              onClick={() => setActiveTab('sent')}
            >
              Sent Requests ({approvals.sent.newHire.length + approvals.sent.replacement.length})
            </button>
          )}
          {/* Only show Received Requests tab for HR Head and Admin users */}
          {(user.designation === 'HR Head' || user.designation === 'HR HEAD' || user.designation === 'Admin') && (
            <button 
              className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
              onClick={() => setActiveTab('received')}
            >
              Received Requests ({approvals.received.newHire.length + approvals.received.replacement.length})
            </button>
          )}
        </div>

        <div className="approval-type-tabs">
          <button 
            className={`type-tab-btn ${activeType === 'newHire' ? 'active' : ''}`}
            onClick={() => setActiveType('newHire')}
          >
            New Hire Requests ({activeTab === 'sent' ? approvals.sent.newHire.length : approvals.received.newHire.length})
          </button>
          <button 
            className={`type-tab-btn ${activeType === 'replacement' ? 'active' : ''}`}
            onClick={() => setActiveType('replacement')}
          >
            Replacement Requests ({activeTab === 'sent' ? approvals.sent.replacement.length : approvals.received.replacement.length})
          </button>
        </div>

        <div className="approval-content">
          {activeTab === 'sent' && (
            <div className="approval-list">
              <h4>Requests You've Sent</h4>
              {activeType === 'newHire' && (
                <>
                  {approvals.sent.newHire.length === 0 ? (
                    <div className="empty-state">
                      <p>No new hire approval requests sent yet.</p>
                    </div>
                  ) : (
                    approvals.sent.newHire.map((approval) => (
                      <div key={approval.id} className="approval-card">
                        <div className="approval-header-info">
                          <h5>{approval.position_title}</h5>
                          {getStatusBadge(approval)}
                        </div>
                        <div className="approval-details">
                          <div className="detail-row">
                            <span className="label">Candidate:</span>
                            <span>{approval.candidate_name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Business Unit:</span>
                            <span>{approval.business_unit}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">CTC Offered:</span>
                            <span>₹{approval.ctc_offered}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted:</span>
                            <span>{formatDate(approval.created_at)}</span>
                          </div>
                          {approval.bu_head_approval_date && (
                            <div className="detail-row">
                              <span className="label">BU Head Approved:</span>
                              <span>{formatDate(approval.bu_head_approval_date)}</span>
                            </div>
                          )}
                          {approval.hr_head_approval_date && (
                            <div className="detail-row">
                              <span className="label">HR Head Approved:</span>
                              <span>{formatDate(approval.hr_head_approval_date)}</span>
                            </div>
                          )}
                          {approval.ADMIN_approval_date && (
                            <div className="detail-row">
                              <span className="label">Admin Approved:</span>
                              <span>{formatDate(approval.ADMIN_approval_date)}</span>
                            </div>
                          )}
                          {(approval.rejection_reason || approval.hr_head_comments || approval.admin_comments) && (
                            <div className="detail-row rejection-comments">
                              <span className="label">Rejection (HR/Admin):</span>
                              <span className="rejection-reason">
                                {approval.rejection_reason || approval.hr_head_comments || approval.admin_comments}
                              </span>
                            </div>
                          )}
                        </div>
                        {approval.approval_status === 'Rejected' && (user.designation === 'BU Head' || user.designation === 'BU HEAD') && (
                          <div className="approval-actions">
                            <button className="edit-btn" onClick={() => onEditNewHire && onEditNewHire(approval)}>
                              Edit & Resend
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteRejected(approval.id, 'newHire')}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
              
              {activeType === 'replacement' && (
                <>
                  {approvals.sent.replacement.length === 0 ? (
                    <div className="empty-state">
                      <p>No replacement approval requests sent yet.</p>
                    </div>
                  ) : (
                    approvals.sent.replacement.map((approval) => (
                      <div key={approval.id} className="approval-card">
                        <div className="approval-header-info">
                          <h5>Replacement for {approval.outgoing_employee_name}</h5>
                          {getStatusBadge(approval)}
                        </div>
                        <div className="approval-details">
                          <div className="detail-row">
                            <span className="label">Outgoing Employee:</span>
                            <span>{approval.outgoing_employee_name} (ID: {approval.outgoing_employee_id})</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Replacement Candidate:</span>
                            <span>{approval.replacement_candidate_name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Business Unit:</span>
                            <span>{approval.business_unit}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">CTC Offered:</span>
                            <span>₹{approval.ctc_offered}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Last Working Date:</span>
                            <span>{approval.last_working_date}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Leaving Reason:</span>
                            <span>{approval.leaving_reason}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted:</span>
                            <span>{formatDate(approval.created_at)}</span>
                          </div>
                          {approval.bu_head_approval_date && (
                            <div className="detail-row">
                              <span className="label">BU Head Approved:</span>
                              <span>{formatDate(approval.bu_head_approval_date)}</span>
                            </div>
                          )}
                          {approval.hr_head_approval_date && (
                            <div className="detail-row">
                              <span className="label">HR Head Approved:</span>
                              <span>{formatDate(approval.hr_head_approval_date)}</span>
                            </div>
                          )}
                          {approval.admin_approval_date && (
                            <div className="detail-row">
                              <span className="label">Admin Approved:</span>
                              <span>{formatDate(approval.admin_approval_date)}</span>
                            </div>
                          )}
                          {(approval.rejection_reason || approval.hr_head_comments || approval.admin_comments) && (
                            <div className="detail-row rejection-comments">
                              <span className="label">Rejection (HR/Admin):</span>
                              <span className="rejection-reason">
                                {approval.rejection_reason || approval.hr_head_comments || approval.admin_comments}
                              </span>
                            </div>
                          )}
                        </div>
                        {approval.approval_status === 'Rejected' && (user.designation === 'BU Head' || user.designation === 'BU HEAD') && (
                          <div className="approval-actions">
                            <button className="edit-btn" onClick={() => onEditReplacement && onEditReplacement(approval)}>
                              Edit & Resend
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteRejected(approval.id, 'replacement')}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="approval-list">
              <h4>Requests for Your Approval</h4>
              {activeType === 'newHire' && (
                <>
                  {approvals.received.newHire.length === 0 ? (
                    <div className="empty-state">
                      <p>No new hire approval requests received.</p>
                    </div>
                  ) : (
                    approvals.received.newHire.map((approval) => (
                      <div key={approval.id} className="approval-card">
                        <div className="approval-header-info">
                          <h5>{approval.position_title}</h5>
                          {getStatusBadge(approval)}
                        </div>
                        <div className="approval-details">
                          <div className="detail-row">
                            <span className="label">Candidate:</span>
                            <span>{approval.candidate_name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted by:</span>
                            <span>{approval.hiring_manager_name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Business Unit:</span>
                            <span>{approval.business_unit}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">CTC Offered:</span>
                            <span>₹{approval.ctc_offered}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Experience:</span>
                            <span>{approval.candidate_experience_years} years</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Skills:</span>
                            <span className="skills">{Array.isArray(approval.candidate_skills) ? approval.candidate_skills.join(', ') : approval.candidate_skills}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted:</span>
                            <span>{formatDate(approval.created_at)}</span>
                          </div>
                        </div>
                        
                        {approval.approval_status === 'Pending' && (
                          <div className="approval-actions">
                            <button 
                              className="approve-btn"
                              onClick={() => handleApprove(approval.id, 'newHire')}
                            >
                              Approve
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => {
                                const reason = prompt('Please provide a reason for rejection:');
                                if (reason) {
                                  handleReject(approval.id, reason, 'newHire');
                                }
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
              
              {activeType === 'replacement' && (
                <>
                  {approvals.received.replacement.length === 0 ? (
                    <div className="empty-state">
                      <p>No replacement approval requests received.</p>
                    </div>
                  ) : (
                    approvals.received.replacement.map((approval) => (
                      <div key={approval.id} className="approval-card">
                        <div className="approval-header-info">
                          <h5>Replacement for {approval.outgoing_employee_name}</h5>
                          {getStatusBadge(approval)}
                        </div>
                        <div className="approval-details">
                          <div className="detail-row">
                            <span className="label">Outgoing Employee:</span>
                            <span>{approval.outgoing_employee_name} (ID: {approval.outgoing_employee_id})</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Replacement Candidate:</span>
                            <span>{approval.replacement_candidate_name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted by:</span>
                            <span>{approval.hiring_manager_name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Business Unit:</span>
                            <span>{approval.business_unit}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">CTC Offered:</span>
                            <span>₹{approval.ctc_offered}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Last Working Date:</span>
                            <span>{approval.last_working_date}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Leaving Reason:</span>
                            <span>{approval.leaving_reason}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Skills:</span>
                            <span className="skills">{Array.isArray(approval.replacement_skills) ? approval.replacement_skills.join(', ') : approval.replacement_skills}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Submitted:</span>
                            <span>{formatDate(approval.created_at)}</span>
                          </div>
                        </div>
                        
                        {approval.approval_status === 'Pending' && (
                          <div className="approval-actions">
                            <button 
                              className="approve-btn"
                              onClick={() => handleApprove(approval.id, 'replacement')}
                            >
                              Approve
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => {
                                const reason = prompt('Please provide a reason for rejection:');
                                if (reason) {
                                  handleReject(approval.id, reason, 'replacement');
                                }
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard; 