import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './CandidateDataPage.css';

const CandidateDataPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState({ newHire: [], replacement: [] });
  const [activeTab, setActiveTab] = useState('new-hire');
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchCandidateData(parsedUser.id);
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const fetchCandidateData = async (userId) => {
    try {
      console.log(`Fetching candidate data for user ID: ${userId}, User: ${user?.name}, Designation: ${user?.designation}, Business Unit: ${user?.business_unit}`);
      const response = await axios.get(buildApiUrl(`/api/candidates/${userId}`));
      console.log('Received candidate data:', response.data);
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidate data:', error);
    }
  };

  const handleEdit = (candidate, type) => {
    setEditingCandidate({ ...candidate, type });
    setEditForm({
      candidate_name: candidate.candidate_name || candidate.replacement_candidate_name,
      position_title: candidate.position_title || `Replacement for ${candidate.outgoing_employee_name}`,
      ctc_offered: candidate.ctc_offered,
      exact_join_date: candidate.exact_join_date,
      exact_salary: candidate.exact_salary,
      employee_id: candidate.employee_id,
      join_confirmation_status: candidate.join_confirmation_status,
      join_confirmation_notes: candidate.join_confirmation_notes
    });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        buildApiUrl(`/api/candidates/${editingCandidate.type}/${editingCandidate.id}`),
        {
          ...editForm,
          updated_by: user.id
        }
      );
      
      setEditingCandidate(null);
      setEditForm({});
      fetchCandidateData(user.id);
    } catch (error) {
      console.error('Error updating candidate:', error);
    }
  };

  const handleCancel = () => {
    setEditingCandidate(null);
    setEditForm({});
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': { class: 'status-pending', text: '⏳ Pending' },
      'Approved': { class: 'status-approved', text: '✅ Approved' },
      'Rejected': { class: 'status-rejected', text: '❌ Rejected' },
      'Joined': { class: 'status-joined', text: '🎉 Joined' },
      'Not_Joined': { class: 'status-not-joined', text: '🚫 Not Joined' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-unknown', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const formatCurrency = (value) => {
    if (!value) return 'Not set';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEdit = user?.designation === 'Admin' || user?.designation === 'HR Head' || user?.designation === 'HR HEAD';

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const currentCandidates = activeTab === 'new-hire' ? candidates.newHire : candidates.replacement;

  return (
    <div className="candidate-data-page">
      <header className="page-header">
        <div className="header-content">
          <div className="alchemy-brand">
            <img src="/alchemy.png" alt="Alchemy TechSol" className="alchemy-logo" />
          </div>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <span className="designation">({user.designation})</span>
            <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
          </div>
        </div>
      </header>

      <main className="candidate-main">
        <div className="page-title">
          <h2>Candidate Data</h2>
          {user?.designation?.toLowerCase() === 'bu head' && (
            <div className="business-unit-filter">
            </div>
          )}
        </div>

        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === 'new-hire' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-hire')}
          >
            New Hires ({candidates.newHire.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'replacement' ? 'active' : ''}`}
            onClick={() => setActiveTab('replacement')}
          >
            Replacements ({candidates.replacement.length})
          </button>
        </div>

        {/* Data Summary */}
        <div className="data-summary">
          <div className="summary-card">
            <div className="summary-item">
              <span className="summary-label">New Hires:</span>
              <span className="summary-value">{candidates.newHire.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Replacements:</span>
              <span className="summary-value">{candidates.replacement.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Candidates:</span>
              <span className="summary-value">{candidates.newHire.length + candidates.replacement.length}</span>
            </div>
          </div>
        </div>

        <div className="table-container">
          {currentCandidates.length === 0 ? (
            <div className="no-data">
              <p>No {activeTab === 'new-hire' ? 'new hire' : 'replacement'} candidates found.</p>
              {user?.designation?.toLowerCase() === 'bu head' && (
                <p className="no-data-note">Showing only candidates you have submitted</p>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Position</th>
                    <th>Business Unit</th>
                    <th>CTC Offered</th>
                    <th>Expected Join Date</th>
                    <th>Exact Salary</th>
                    <th>Employee ID</th>
                    <th>Join Status</th>
                    <th>Workflow Status</th>
                    {canEdit && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentCandidates.map((candidate) => (
                    <tr key={candidate.id} className="candidate-row">
                      <td className="candidate-name">
                        {candidate.candidate_name || candidate.replacement_candidate_name}
                      </td>
                      <td className="position">
                        {candidate.position_title || `Replacement for ${candidate.outgoing_employee_name}`}
                      </td>
                      <td className="business-unit">
                        {candidate.business_unit}
                      </td>
                      <td className="ctc-offered">
                        {formatCurrency(candidate.ctc_offered)}
                      </td>
                      <td className="join-date">
                        {formatDate(candidate.exact_join_date)}
                      </td>
                      <td className="exact-salary">
                        {formatCurrency(candidate.exact_salary)}
                      </td>
                      <td className="employee-id">
                        {candidate.employee_id || 'Not assigned'}
                      </td>
                      <td className="join-status">
                        {getStatusBadge(candidate.join_confirmation_status)}
                      </td>
                      <td className="workflow-status">
                        {getStatusBadge(candidate.workflow_status || candidate.approval_status)}
                      </td>
                      {canEdit && (
                        <td className="actions">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(candidate, activeTab)}
                            title="Edit candidate"
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingCandidate && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>Edit Candidate</h3>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Candidate Name:</label>
                <input
                  type="text"
                  value={editForm.candidate_name || ''}
                  onChange={(e) => setEditForm({...editForm, candidate_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>CTC Offered:</label>
                <input
                  type="number"
                  value={editForm.ctc_offered || ''}
                  onChange={(e) => setEditForm({...editForm, ctc_offered: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Exact Join Date:</label>
                <input
                  type="date"
                  value={editForm.exact_join_date || ''}
                  onChange={(e) => setEditForm({...editForm, exact_join_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Exact Salary:</label>
                <input
                  type="number"
                  value={editForm.exact_salary || ''}
                  onChange={(e) => setEditForm({...editForm, exact_salary: parseFloat(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Employee ID:</label>
                <input
                  type="text"
                  value={editForm.employee_id || ''}
                  onChange={(e) => setEditForm({...editForm, employee_id: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Join Status:</label>
                <select
                  value={editForm.join_confirmation_status || ''}
                  onChange={(e) => setEditForm({...editForm, join_confirmation_status: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Joined">Joined</option>
                  <option value="Not_Joined">Not Joined</option>
                </select>
              </div>
              <div className="form-group">
                <label>Join Notes:</label>
                <textarea
                  value={editForm.join_confirmation_notes || ''}
                  onChange={(e) => setEditForm({...editForm, join_confirmation_notes: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDataPage;
