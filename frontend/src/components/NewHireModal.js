import React, { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './NewHireModal.css';

const NewHireModal = ({ onClose, onSuccess, user, editMode, initialData }) => {
  const isEdit = editMode && initialData && initialData.id;
  const [formData, setFormData] = useState(() => {
    const base = {
      position_title: '',
      business_unit: user?.business_unit || '',
      department: '',
      candidate_name: '',
      candidate_designation: '',
      candidate_current_company: '',
      candidate_experience_years: '',
      candidate_skills: '',
      ctc_offered: '',
      joining_date: '',
      notice_period_days: '',
      hiring_manager_id: user?.id,
      hiring_manager_name: user?.name
    };
    if (isEdit && initialData) {
      return {
        ...base,
        position_title: initialData.position_title || '',
        business_unit: initialData.business_unit || base.business_unit,
        department: initialData.department || '',
        candidate_name: initialData.candidate_name || '',
        candidate_designation: initialData.candidate_designation || '',
        candidate_current_company: initialData.candidate_current_company || '',
        candidate_experience_years: initialData.candidate_experience_years ?? '',
        candidate_skills: (() => {
          const s = initialData.candidate_skills;
          if (Array.isArray(s)) return s.join(', ');
          if (!s) return '';
          const str = String(s).trim();
          if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
            try {
              const parsed = JSON.parse(str.replace(/'/g, '"'));
              return Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
            } catch { return str; }
          }
          return str;
        })(),
        ctc_offered: initialData.ctc_offered ?? '',
        joining_date: initialData.joining_date ? initialData.joining_date.split('T')[0] : '',
        notice_period_days: initialData.notice_period_days ?? '',
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
      if (isEdit) {
        await axios.put(
          buildApiUrl(`/api/approvals/${initialData.id}/resend`),
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
          buildApiUrl('/api/new-hiring-approvals'),
          { ...formData },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setSuccess('New hire request submitted successfully! It will be sent for approval.');
      }
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(true), 1500);
    } catch (err) {
      setError(err.response?.data?.error || (isEdit ? 'Failed to resend request' : 'Failed to submit new hire request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit & Resend Request' : 'New Position Request Form'}</h3>
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
          <div className="form-horizontal">
            <div className="form-section">
              <h4>Position Details</h4>
              <div className="form-fields">
                <div className="form-group">
                  <label>Position Title *</label>
                  <input
                    type="text"
                    name="position_title"
                    value={formData.position_title}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                
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
              </div>
            </div>

            <div className="form-section">
              <h4>Candidate Details</h4>
              <div className="form-fields">
                <div className="form-group">
                  <label>Candidate Name *</label>
                  <input
                    type="text"
                    name="candidate_name"
                    value={formData.candidate_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Current Designation *</label>
                  <input
                    type="text"
                    name="candidate_designation"
                    value={formData.candidate_designation}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience *</label>
                  <input
                    type="number"
                    name="candidate_experience_years"
                    value={formData.candidate_experience_years}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Key Skills *</label>
                  <textarea
                    name="candidate_skills"
                    value={formData.candidate_skills}
                    onChange={handleChange}
                    rows="3"
                    required
                    disabled={loading}
                    placeholder="Comma separated list of skills"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Offer Details</h4>
              <div className="form-fields">
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
               {loading ? (isEdit ? 'Resending...' : 'Submitting...') : (isEdit ? 'Resend for Approval' : 'Submit for Approval')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewHireModal;