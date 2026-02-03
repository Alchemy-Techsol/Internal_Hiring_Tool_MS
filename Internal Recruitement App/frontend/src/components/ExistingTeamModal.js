import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './ExistingTeamModal.css';

const ExistingTeamModal = ({ onClose, businessUnit }) => {
  const [existingTeamDetails, setExistingTeamDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExistingTeamDetails = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/existing-team-details/${businessUnit}`));
        setExistingTeamDetails(response.data);
      } catch (err) {
        setError('Failed to fetch existing team details');
        console.error('Error fetching existing team details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingTeamDetails();
  }, [businessUnit]);

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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Existing Team Members - {businessUnit}</h3>
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
              <p>Loading existing team details...</p>
              <div className="spinner"></div>
            </div>
          ) : existingTeamDetails.length === 0 ? (
            <div className="no-data">
              <p>No existing team members found for this business unit.</p>
            </div>
          ) : (
            <div className="existing-team-details">
              <div className="details-header">
                <p>Showing {existingTeamDetails.length} existing team member(s)</p>
              </div>
              
              <div className="budget-table-wrapper">
                <table className="budget-table existing-team-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Hired Value</th>
                      <th>20% of Value</th>
                      <th>DOJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingTeamDetails.map((member, index) => (
                      <tr key={index}>
                        <td>{member.candidate_name || 'Not specified'}</td>
                        <td>{member.designation || 'Not specified'}</td>
                        <td>{formatCurrency(member.hired_value)}</td>
                        <td>{formatCurrency(member.twenty_percent)}</td>
                        <td>{formatDate(member.exact_join_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan={2}><strong>Total</strong></td>
                      <td><strong>{formatCurrency(existingTeamDetails.reduce((s, m) => s + (m.hired_value || 0), 0))}</strong></td>
                      <td><strong>{formatCurrency(existingTeamDetails.reduce((s, m) => s + (m.twenty_percent || 0), 0))}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
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

export default ExistingTeamModal;
