import React, { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const ReplacementModal = ({ onClose, onSuccess, user, editMode, initialData }) => {
  const isEdit = editMode && initialData && initialData.id;
  const [formData, setFormData] = useState(() => {
    const base = {
      outgoing_employee_name: '',
      outgoing_employee_id: '',
      business_unit: user?.business_unit || '',
      last_working_date: '',
      leaving_reason: '',
      replacement_candidate_name: '',
      replacement_current_designation: '',
      replacement_experience_years: '',
      replacement_skills: '',
      ctc_offered: '',
      joining_date: '',
      hiring_manager_id: user?.id,
      hiring_manager_name: user?.name
    };
    if (isEdit && initialData) {
      return {
        ...base,
        outgoing_employee_name: initialData.outgoing_employee_name || '',
        outgoing_employee_id: initialData.outgoing_employee_id || '',
        business_unit: initialData.business_unit || base.business_unit,
        last_working_date: initialData.last_working_date ? initialData.last_working_date.split('T')[0] : '',
        leaving_reason: initialData.leaving_reason || '',
        replacement_candidate_name: initialData.replacement_candidate_name || '',
        replacement_current_designation: initialData.replacement_current_designation || '',
        replacement_experience_years: initialData.replacement_experience_years ?? '',
        replacement_skills: Array.isArray(initialData.replacement_skills) ? initialData.replacement_skills.join(', ') : (initialData.replacement_skills || ''),
        ctc_offered: initialData.ctc_offered ?? '',
        joining_date: initialData.joining_date ? initialData.joining_date.split('T')[0] : '',
        hiring_manager_id: initialData.hiring_manager_id || user?.id,
        hiring_manager_name: initialData.hiring_manager_name || user?.name
      };
    }
    return base;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit) {
        await axios.put(
          buildApiUrl(`/api/replacement-approvals/${initialData.id}/resend`),
          {
            ...formData,
            userId: user?.id,
            hiring_manager_id: user?.id
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setSuccess('Request updated and resent for approval.');
      } else {
        await axios.post(
          buildApiUrl('/api/replacement-approvals'),
          formData,
          { headers: { 'Content-Type': 'application/json' } }
        );
        setSuccess('Replacement request submitted successfully!');
      }
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(true), 1500);
    } catch (err) {
      setError(err.response?.data?.error || (isEdit ? 'Failed to resend request' : 'Failed to submit replacement request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit & Resend Replacement Request' : 'Replacement Position Request'}</h3>
          <button 
            onClick={() => onClose(false)} 
            className="close-btn"
            disabled={loading}
          >
            &times;
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Outgoing Employee Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Employee Name *</label>
                <input
                  type="text"
                  name="outgoing_employee_name"
                  value={formData.outgoing_employee_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  name="outgoing_employee_id"
                  value={formData.outgoing_employee_id}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>



            <div className="form-row">
              <div className="form-group">
                <label>Business Unit *</label>
                <input
                  type="text"
                  name="business_unit"
                  value={formData.business_unit}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Last Working Date *</label>
                <input
                  type="date"
                  name="last_working_date"
                  value={formData.last_working_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Leaving Reason *</label>
                <select
                  name="leaving_reason"
                  value={formData.leaving_reason}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select reason</option>
                  <option value="Resignation">Resignation</option>
                  <option value="Termination">Termination</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Internal Transfer">Internal Transfer</option>
                </select>
              </div>
            </div>

          </div>

          <div className="form-section">
            <h4>Replacement Candidate Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Candidate Name *</label>
                <input
                  type="text"
                  name="replacement_candidate_name"
                  value={formData.replacement_candidate_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Current Designation *</label>
                <input
                  type="text"
                  name="replacement_current_designation"
                  value={formData.replacement_current_designation}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  name="replacement_experience_years"
                  value={formData.replacement_experience_years}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Key Skills *</label>
                <input
                  type="text"
                  name="replacement_skills"
                  value={formData.replacement_skills}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Comma separated list"
                />
              </div>
            </div>


          </div>

          <div className="form-section">
            <h4>Offer Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>CTC Offered (₹) *</label>
                <input
                  type="number"
                  name="ctc_offered"
                  value={formData.ctc_offered}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Joining Date *</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? (isEdit ? 'Resending...' : 'Submitting...') : (isEdit ? 'Resend Request' : 'Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplacementModal;