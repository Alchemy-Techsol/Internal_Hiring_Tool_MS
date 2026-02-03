  import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
  import './TentativeDetailsModal.css';

  const TentativeDetailsModal = ({ onClose, user, requestType, requestId, requestData }) => {
    const [formData, setFormData] = useState({
      tentative_join_date: '',
      tentative_candidate_name: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
      if (requestData) {
        setFormData({
          tentative_join_date: '',
          tentative_candidate_name: requestData.candidate_name || requestData.replacement_candidate_name || ''
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
          buildApiUrl(`/api/bu/enter-tentative-details/${requestType}/${requestId}`),
          formData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        setSuccess('Tentative details submitted successfully! Request sent to HR Head for final details.');
        setTimeout(() => onClose(true), 1500);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to submit tentative details');
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

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Enter Tentative Details</h2>
            <button className="close-btn" onClick={() => onClose(false)}>×</button>
          </div>

          <div className="modal-body">
            <div className="request-info">
              <h3>{getRequestTitle()}</h3>
              <p>Business Unit: {requestData?.business_unit}</p>
            </div>

            <form onSubmit={handleSubmit} className="tentative-form">
              <div className="form-group">
                <label htmlFor="tentative_candidate_name">Candidate Name *</label>
                <input
                  type="text"
                  id="tentative_candidate_name"
                  name="tentative_candidate_name"
                  value={formData.tentative_candidate_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter candidate name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tentative_join_date">Tentative Date of Joining *</label>
                <input
                  type="date"
                  id="tentative_join_date"
                  name="tentative_join_date"
                  value={formData.tentative_join_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
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
                  {loading ? 'Submitting...' : 'Submit Tentative Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  export default TentativeDetailsModal;
