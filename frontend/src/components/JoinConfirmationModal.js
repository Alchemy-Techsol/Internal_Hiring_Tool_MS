import React, { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './JoinConfirmationModal.css';

const JoinConfirmationModal = ({ onClose, user, requestType, requestId, requestData }) => {
  const [joinStatus, setJoinStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!joinStatus) {
      setError('Please select join status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.put(
        buildApiUrl(`/api/hr/confirm-join/${requestType}/${requestId}`),
        {
          join_confirmation_status: joinStatus,
          join_confirmation_notes: notes
        }
      );

      if (response.status === 200) {
        onClose(true); // Pass true to indicate success
      }
    } catch (error) {
      console.error('Error confirming join status:', error);
      setError(error.response?.data?.error || 'Failed to confirm join status');
    } finally {
      setLoading(false);
    }
  };

  const getCandidateName = () => {
    if (requestType === 'new-hire') {
      return requestData.tentative_candidate_name || requestData.candidate_name;
    } else {
      return requestData.tentative_candidate_name || requestData.replacement_candidate_name;
    }
  };

  const getPositionTitle = () => {
    if (requestType === 'new-hire') {
      return requestData.position_title;
    } else {
      return `Replacement for ${requestData.outgoing_employee_name}`;
    }
  };

  return (
    <div className="join-confirmation-modal-overlay">
      <div className="join-confirmation-modal">
        <div className="modal-header">
          <h2>Confirm Join Status</h2>
          <button className="close-btn" onClick={() => onClose(false)}>×</button>
        </div>

        <div className="modal-content">
          <div className="candidate-info">
            <h3>Candidate Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{getCandidateName()}</span>
              </div>
              <div className="info-item">
                <label>Position:</label>
                <span>{getPositionTitle()}</span>
              </div>
              <div className="info-item">
                <label>Expected Join Date:</label>
                <span>{requestData.exact_join_date ? new Date(requestData.exact_join_date).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Business Unit:</label>
                <span>{requestData.business_unit}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="confirmation-form">
            <div className="form-group">
              <label>Did the candidate join? *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="joinStatus"
                    value="Joined"
                    checked={joinStatus === 'Joined'}
                    onChange={(e) => setJoinStatus(e.target.value)}
                  />
                  <span className="radio-label">✅ Yes, they joined</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="joinStatus"
                    value="Not_Joined"
                    checked={joinStatus === 'Not_Joined'}
                    onChange={(e) => setJoinStatus(e.target.value)}
                  />
                  <span className="radio-label">❌ No, they did not join</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Additional Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional comments about the candidate's join status..."
                rows="3"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
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
                className="confirm-btn"
                disabled={loading || !joinStatus}
              >
                {loading ? 'Confirming...' : 'Confirm Join Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinConfirmationModal;
