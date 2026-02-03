import React, { useState } from 'react';
import './CandidateDetailsModal.css';

const CandidateDetailsModal = ({ isOpen, onClose, title, candidates, onViewFullDetails }) => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const handleViewFullDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setShowFullDetails(true);
  };

  const handleCloseFullDetails = () => {
    setShowFullDetails(false);
    setSelectedCandidate(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="candidate-details-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {candidates.length === 0 ? (
            <div className="no-candidates">
              <p>No candidates found for this category.</p>
            </div>
          ) : (
            <div className="candidates-table-container">
                                   <table className="candidates-table">
                       <thead>
                         <tr>
                           <th>Name</th>
                           <th>Designation</th>
                           {title === 'Total Hires' && <th>Business Unit</th>}
                           {title !== 'Total Hires' && title !== 'Hiring Ticket Raised' && <th>CTC Offered</th>}
                           {title !== 'Hiring Ticket Raised' && <th>DOJ</th>}
                           {title === 'Hiring Ticket Raised' && <th>Business Unit</th>}
                           {title === 'Hiring Ticket Raised' && <th>Request Date</th>}
                           <th>Actions</th>
                         </tr>
                       </thead>
                <tbody>
                  {candidates.map((candidate, index) => (
                    <tr key={index}>
                      <td>{candidate.name || candidate.candidate_name || candidate.replacement_candidate_name || 'N/A'}</td>
                      <td>{candidate.position_title || candidate.designation || 'N/A'}</td>
                      {title === 'Total Hires' && (
                        <td>{candidate.business_unit || 'N/A'}</td>
                      )}
                      {title !== 'Total Hires' && title !== 'Hiring Ticket Raised' && (
                        <td>{candidate.exact_salary ? formatCurrency(candidate.exact_salary) : 'N/A'}</td>
                      )}
                      {title !== 'Hiring Ticket Raised' && (
                        <td>{formatDate(candidate.exact_join_date || candidate.tentative_join_date)}</td>
                      )}
                      {title === 'Hiring Ticket Raised' && (
                        <td>{candidate.business_unit || 'N/A'}</td>
                      )}
                      {title === 'Hiring Ticket Raised' && (
                        <td>{formatDate(candidate.created_at)}</td>
                      )}
                      <td>
                        <button 
                          className="view-details-btn"
                          onClick={() => handleViewFullDetails(candidate)}
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Full Details Modal */}
        {showFullDetails && selectedCandidate && (
          <div className="full-details-overlay">
            <div className="full-details-modal">
              <div className="modal-header">
                <h3>Full Candidate Details</h3>
                <button className="close-btn" onClick={handleCloseFullDetails}>×</button>
              </div>
              
              <div className="full-details-content">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedCandidate.name || selectedCandidate.candidate_name || selectedCandidate.replacement_candidate_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">{selectedCandidate.position_title || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Business Unit:</span>
                    <span className="detail-value">{selectedCandidate.business_unit || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{selectedCandidate.department || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Financial Details</h4>
                  <div className="detail-row">
                    <span className="detail-label">CTC Offered:</span>
                    <span className="detail-value">{selectedCandidate.exact_salary ? formatCurrency(selectedCandidate.exact_salary) : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expected CTC:</span>
                    <span className="detail-value">{selectedCandidate.expected_ctc ? formatCurrency(selectedCandidate.expected_ctc) : 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Timeline</h4>
                  <div className="detail-row">
                    <span className="detail-label">Tentative Join Date:</span>
                    <span className="detail-value">{formatDate(selectedCandidate.tentative_join_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Exact Join Date:</span>
                    <span className="detail-value">{formatDate(selectedCandidate.exact_join_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Request Date:</span>
                    <span className="detail-value">{formatDate(selectedCandidate.created_at)}</span>
                  </div>
                </div>

                {selectedCandidate.outgoing_employee_name && (
                  <div className="detail-section">
                    <h4>Replacement Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">Replacing:</span>
                      <span className="detail-value">{selectedCandidate.outgoing_employee_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Outgoing Designation:</span>
                      <span className="detail-value">{selectedCandidate.outgoing_designation || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Outgoing Department:</span>
                      <span className="detail-value">{selectedCandidate.outgoing_department || 'N/A'}</span>
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Status Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Workflow Status:</span>
                    <span className="detail-value">{selectedCandidate.workflow_status || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Join Confirmed:</span>
                    <span className="detail-value">{selectedCandidate.join_confirmed ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Employee ID:</span>
                    <span className="detail-value">{selectedCandidate.employee_id || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDetailsModal;
