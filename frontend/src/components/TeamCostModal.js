import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './TeamCostModal.css';

const TeamCostModal = ({ onClose, user, currentBudget }) => {
  const [teamCost, setTeamCost] = useState(currentBudget);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (isNaN(teamCost) || teamCost < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(buildApiUrl(`/api/users/${user.id}/team-cost`), {
        team_cost: parseFloat(teamCost)
      });
      setSuccess('Team budget updated successfully!');
      setTimeout(() => {
        onClose(true); // Close modal after successful save
      }, 1500);
    } catch (err) {
      console.error('Error updating team cost:', err);
      setError('Failed to update team budget');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numValue || 0);
  };

  return (
    <div className="team-cost-modal-overlay">
      <div className="team-cost-modal">
        <div className="modal-header">
          <h3>Update Team Budget</h3>
          <button onClick={() => onClose(false)} className="close-btn">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="current-budget-display">
            <h4>Current Team Budget:</h4>
            <div className="budget-value">{formatCurrency(currentBudget)}</div>
          </div>
          
          <div className="cost-input-section">
            <label htmlFor="teamCostInput">New Team Budget (₹):</label>
            <input
              id="teamCostInput"
              type="number"
              value={teamCost}
              onChange={(e) => setTeamCost(e.target.value)}
              min="0"
              step="10000"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="save-btn"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            onClick={() => onClose(false)} 
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamCostModal;