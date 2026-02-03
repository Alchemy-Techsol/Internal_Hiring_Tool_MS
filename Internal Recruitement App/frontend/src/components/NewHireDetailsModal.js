import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './NewHireDetailsModal.css';

const NewHireDetailsModal = ({ onClose, businessUnit }) => {
  const [newHireDetails, setNewHireDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNewHireDetails = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/new-hire-details/${businessUnit}`));
        setNewHireDetails(response.data);
      } catch (err) {
        setError('Failed to fetch new hire details');
        console.error('Error fetching new hire details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewHireDetails();
  }, [businessUnit]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { class: 'pending', text: '⏳ Pending' },
      'Approved': { class: 'approved', text: '✅ Approved' },
      'Rejected': { class: 'rejected', text: '❌ Rejected' }
    };
    
    const config = statusConfig[status] || { class: 'pending', text: '⏳ Pending' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getWorkflowStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { class: 'pending', text: '⏳ Pending' },
      'Admin_Approved': { class: 'approved', text: '✅ Admin Approved' },
      'BU_Tentative_Entered': { class: 'info', text: '📝 BU Tentative Entered' },
      'HR_Final_Entered': { class: 'success', text: '✅ HR Final Entered' },
      'Completed': { class: 'completed', text: '🎉 Completed' }
    };
    
    const config = statusConfig[status] || { class: 'pending', text: '⏳ Pending' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getJoinConfirmationBadge = (status) => {
    const statusConfig = {
      'Pending': { class: 'pending', text: '⏳ Join Pending' },
      'Joined': { class: 'success', text: '✅ Joined' },
      'Not_Joined': { class: 'rejected', text: '❌ Not Joined' }
    };
    
    const config = statusConfig[status] || { class: 'pending', text: '⏳ Join Pending' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatBoolean = (value) => {
    return value ? 'Yes' : 'No';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>New Hiring Candidates - {businessUnit}</h3>
          <button 
            onClick={onClose} 
            className="close-btn"
          >
            &times;
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <div className="modal-body">
          {loading ? (
            <div className="loading-indicator">
              <p>Loading new hire details...</p>
              <div className="spinner"></div>
            </div>
          ) : newHireDetails.length === 0 ? (
            <div className="no-data">
              <p>No new hiring candidates found for this business unit.</p>
            </div>
          ) : (
            <div className="new-hire-details">
              <div className="details-header">
                <p>Showing {newHireDetails.length} new hiring candidate(s)</p>
              </div>
              
              <div className="details-list">
                {newHireDetails.map((detail, index) => (
                  <div key={index} className="detail-item">
                    <div className="detail-header">
                      <h4>New Hire #{index + 1}</h4>
                      <div className="status-badges">
                        {getStatusBadge(detail.approval_status)}
                        {getWorkflowStatusBadge(detail.workflow_status)}
                        {getJoinConfirmationBadge(detail.join_confirmation_status)}
                      </div>
                    </div>
                    
                    <div className="detail-content">
                      <div className="detail-section">
                        <h5>Position Details</h5>
                        <div className="detail-row">
                          <span className="label">Position Title:</span>
                          <span className="value">{detail.position_title || 'Not specified'}</span>
                        </div>
                      
                        <div className="detail-row">
                          <span className="label">Business Unit:</span>
                          <span className="value">{detail.business_unit || 'Not specified'}</span>
                        </div>
                      </div>
                      
                      <div className="detail-section">
                        <h5>Candidate Details</h5>
                        <div className="detail-row">
                          <span className="label">Name:</span>
                          <span className="value">{detail.candidate_name || 'Not specified'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Designation:</span>
                          <span className="value">{detail.candidate_designation || 'Not specified'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Experience (Years):</span>
                          <span className="value">{detail.candidate_experience_years || 'Not specified'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Skills:</span>
                          <span className="value">{Array.isArray(detail.candidate_skills) ? detail.candidate_skills.join(', ') : detail.candidate_skills || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h5>Compensation & Joining Details</h5>
                        <div className="detail-row">
                          <span className="label">CTC Offered:</span>
                          <span className="value">{formatCurrency(detail.ctc_offered)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Tentative Joining Date:</span>
                          <span className="value">{formatDate(detail.joining_date)}</span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h5>Workflow Progress</h5>
                        <div className="detail-row">
                          <span className="label">Tentative Join Date:</span>
                          <span className="value">{formatDate(detail.tentative_join_date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Tentative Candidate Name:</span>
                          <span className="value">{detail.tentative_candidate_name || 'Not entered'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">BU Head Tentative Entered:</span>
                          <span className="value">{formatBoolean(detail.bu_head_tentative_entered)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Exact Join Date:</span>
                          <span className="value">{formatDate(detail.exact_join_date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Exact Salary:</span>
                          <span className="value">{formatCurrency(detail.exact_salary)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">HR Head Final Entered:</span>
                          <span className="value">{formatBoolean(detail.hr_head_final_entered)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Join Confirmation Date:</span>
                          <span className="value">{formatDate(detail.join_confirmation_date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Join Confirmation Notes:</span>
                          <span className="value">{detail.join_confirmation_notes || 'No notes'}</span>
                        </div>
                      </div>
                      
                      <div className="detail-section">
                        <h5>Request Details</h5>
                        <div className="detail-row">
                          <span className="label">Submitted:</span>
                          <span className="value">{formatDate(detail.created_at)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Last Updated:</span>
                          <span className="value">{formatDate(detail.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewHireDetailsModal;
