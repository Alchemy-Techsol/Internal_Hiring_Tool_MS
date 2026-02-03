-- Approval Tables Setup for Internal_Hiring database
-- This script creates the tables needed for the approval workflow

-- Create NewHiringApprovals table
CREATE TABLE IF NOT EXISTS "NewHiringApprovals" (
    id SERIAL PRIMARY KEY,
    position_title TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    department TEXT,
    candidate_name TEXT NOT NULL,
    candidate_designation TEXT NOT NULL,
    candidate_current_company TEXT,
    candidate_experience_years INTEGER,
    candidate_skills TEXT,
    ctc_offered DECIMAL(12,2),
    joining_date DATE,
    notice_period_days INTEGER,
    hiring_manager_id INTEGER,
    hiring_manager_name TEXT,
    
    -- Approval workflow fields
    status TEXT DEFAULT 'pending_approval',
    submitted_by INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejected_by INTEGER,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ReplacementApprovals table
CREATE TABLE IF NOT EXISTS "ReplacementApprovals" (
    id SERIAL PRIMARY KEY,
    outgoing_employee_name TEXT NOT NULL,
    outgoing_employee_id TEXT,
    outgoing_designation TEXT NOT NULL,
    outgoing_department TEXT NOT NULL,
    last_working_date DATE,
    leaving_reason TEXT,
    replacement_candidate_name TEXT NOT NULL,
    replacement_current_designation TEXT,
    replacement_experience_years INTEGER,
    replacement_skills TEXT,
    is_internal_candidate BOOLEAN DEFAULT FALSE,
    ctc_offered DECIMAL(12,2),
    joining_date DATE,
    notice_period_days INTEGER,
    hiring_manager_id INTEGER,
    hiring_manager_name TEXT,
    
    -- Approval workflow fields
    status TEXT DEFAULT 'pending_approval',
    submitted_by INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejected_by INTEGER,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_new_hiring_status ON "NewHiringApprovals"(status);
CREATE INDEX IF NOT EXISTS idx_new_hiring_submitted_by ON "NewHiringApprovals"(submitted_by);
CREATE INDEX IF NOT EXISTS idx_new_hiring_business_unit ON "NewHiringApprovals"(business_unit);
CREATE INDEX IF NOT EXISTS idx_new_hiring_submitted_at ON "NewHiringApprovals"(submitted_at);

CREATE INDEX IF NOT EXISTS idx_replacement_status ON "ReplacementApprovals"(status);
CREATE INDEX IF NOT EXISTS idx_replacement_submitted_by ON "ReplacementApprovals"(submitted_by);
CREATE INDEX IF NOT EXISTS idx_replacement_submitted_at ON "ReplacementApprovals"(submitted_at);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_approval_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS update_new_hiring_updated_at ON "NewHiringApprovals";
CREATE TRIGGER update_new_hiring_updated_at 
    BEFORE UPDATE ON "NewHiringApprovals" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_approval_updated_at_column();

DROP TRIGGER IF EXISTS update_replacement_updated_at ON "ReplacementApprovals";
CREATE TRIGGER update_replacement_updated_at 
    BEFORE UPDATE ON "ReplacementApprovals" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_approval_updated_at_column(); 