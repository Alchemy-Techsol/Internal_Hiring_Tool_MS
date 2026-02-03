import React from 'react';
import './TeamBudgetOptionsModal.css';

const TeamBudgetOptionsModal = ({ onClose, onAddBudget, onShowBudget }) => {
  return (
    <div className="team-budget-options-overlay" onClick={onClose}>
      <div className="team-budget-options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Team Budget</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <button className="option-btn add-btn" onClick={onAddBudget}>
            Add Team Budget
          </button>
          <button className="option-btn show-btn" onClick={onShowBudget}>
            Show Team Budget
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamBudgetOptionsModal;
