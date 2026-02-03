import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './FinalDetailsModal.css';

const FinalDetailsModal = ({ onClose, user, requestType, requestId, requestData }) => {
  const [formData, setFormData] = useState({
    exact_join_date: '',
    exact_salary: '',
    employee_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (requestData) {
      setFormData({
        exact_join_date: requestData.tentative_join_date || '',
        exact_salary: requestData.ctc_offered || '',
        employee_id: ''
      });
    }
  }, [requestData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        buildApiUrl(`/api/hr/enter-final-details/${requestType}/${requestId}`),
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Final details submitted successfully! Candidate is now hired.');
      setTimeout(() => onClose(true), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit final details');
    } finally {
      setLoading(false);
    }
  };

  const getRequestTitle = () => {
    if (requestType === 'new-hire') {
      return `New Hire: ${requestData?.position_title || 'Position'}`;
    } else {
      return `Replacement: ${requestData?.replacement_candidate_name || 'Candidate'}`;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Enter Final Details</h2>
          <button className="close-btn" onClick={() => onClose(false)}>×</button>
        </div>

        <div className="modal-body">
          <div className="request-info">
            <h3>{getRequestTitle()}</h3>
            <p>Business Unit: {requestData?.business_unit}</p>
            <div className="tentative-details">
              <h4>Tentative Details (from BU Head):</h4>
              <p><strong>Candidate:</strong> {requestData?.tentative_candidate_name}</p>
              <p><strong>Tentative DOJ:</strong> {requestData?.tentative_join_date}</p>
              <p><strong>Proposed CTC:</strong> {formatCurrency(requestData?.ctc_offered)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="final-form">
            <div className="form-group">
              <label htmlFor="exact_join_date">Exact Date of Joining *</label>
              <input
                type="date"
                id="exact_join_date"
                name="exact_join_date"
                value={formData.exact_join_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="exact_salary">Exact Salary (CTC) *</label>
              <input
                type="number"
                id="exact_salary"
                name="exact_salary"
                value={formData.exact_salary}
                onChange={handleChange}
                required
                placeholder="Enter exact CTC"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee_id">Employee ID from HRMS *</label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                placeholder="Enter Employee ID"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => onClose(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Final Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinalDetailsModal;
