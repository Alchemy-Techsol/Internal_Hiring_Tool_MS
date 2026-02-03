import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './ShowTeamBudgetModal.css';

const ShowTeamBudgetModal = ({ onClose, user }) => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalHiredValue, setTotalHiredValue] = useState(0);

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        const response = await axios.get(buildApiUrl(`/api/users/${user.id}/team-budget-breakdown`));
        setCandidates(response.data.candidates || []);
        setTotal(response.data.total || 0);
        setTotalHiredValue(response.data.totalHiredValue || 0);
      } catch (err) {
        console.error('Error fetching team budget breakdown:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchBreakdown();
  }, [user?.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="show-team-budget-overlay" onClick={onClose}>
      <div className="show-team-budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Show Team Budget</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : (
            <div className="budget-table-wrapper">
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Hired Value</th>
                    <th>20% of Value</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((row, index) => (
                    <tr key={index}>
                      <td>{row.candidate_name}</td>
                      <td>{formatCurrency(row.hired_value)}</td>
                      <td>{formatCurrency(row.twenty_percent)}</td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={3} className="no-data">No joined candidates yet</td>
                    </tr>
                  )}
                </tbody>
                {candidates.length > 0 && (
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>{formatCurrency(totalHiredValue)}</strong></td>
                      <td><strong>{formatCurrency(total)}</strong></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowTeamBudgetModal;
