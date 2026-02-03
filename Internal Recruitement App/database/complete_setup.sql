-- ============================================================
-- Complete Database Setup Script for Internal Hiring App
-- ============================================================
-- This script creates the complete database schema from scratch
-- Run this to recreate your entire database
--
-- Usage:
-- 1. Create database: CREATE DATABASE "Internal_Hiring";
-- 2. Connect to database: \c "Internal_Hiring"
-- 3. Run this script: \i database/complete_setup.sql
--
-- This includes:
-- - Users table
-- - NewHiringApprovals table with all workflow fields
-- - ReplacementApprovals table with all workflow fields
-- - All indexes for performance
-- - Trigger functions and triggers for auto-update timestamps
-- ============================================================

-- ============================================================
-- DATABASE: Create the database first (run this separately)
-- ============================================================
-- CREATE DATABASE "Internal_Hiring";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    designation TEXT,
    business_unit TEXT,
    team_cost DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- NEW HIRING APPROVALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "NewHiringApprovals" (
    id SERIAL PRIMARY KEY,
    
    -- Basic candidate information
    position_title TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    department TEXT,
    candidate_name TEXT NOT NULL,
    candidate_designation TEXT NOT NULL,
    candidate_current_company TEXT,
    candidate_experience_years INTEGER,
    candidate_skills TEXT,
    
    -- Offer details
    ctc_offered DECIMAL(12,2),
    joining_date DATE,
    notice_period_days INTEGER,
    
    -- Hiring manager information
    hiring_manager_id INTEGER,
    hiring_manager_name TEXT,
    
    -- Approval workflow fields - Initial
    approval_status TEXT DEFAULT 'Pending',
    
    -- BU Head approval (auto-approved on submission)
    bu_head_approved BOOLEAN DEFAULT TRUE,
    bu_head_approval_date TIMESTAMP,
    bu_head_comments TEXT,
    
    -- HR Head approval
    hr_head_approved BOOLEAN DEFAULT FALSE,
    hr_head_approval_date TIMESTAMP,
    hr_head_comments TEXT,
    
    -- Admin approval
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_approval_date TIMESTAMP,
    admin_comments TEXT,
    
    -- Workflow status fields (Post-Admin approval)
    tentative_join_date DATE,
    tentative_candidate_name TEXT,
    bu_head_tentative_entered BOOLEAN DEFAULT FALSE,
    bu_head_tentative_date TIMESTAMP,
    exact_join_date DATE,
    exact_salary DECIMAL(12,2),
    hr_head_final_entered BOOLEAN DEFAULT FALSE,
    hr_head_final_date TIMESTAMP,
    workflow_status TEXT DEFAULT 'Pending',
    
    -- Employee ID and hire tracking
    employee_id TEXT,
    hired_status TEXT DEFAULT 'Not Hired',
    hired_date TIMESTAMP,
    hr_head_employee_id_entered BOOLEAN DEFAULT FALSE,
    
    -- Join confirmation fields
    join_confirmed BOOLEAN DEFAULT FALSE,
    join_confirmation_date TIMESTAMP,
    join_confirmation_status TEXT DEFAULT 'Pending',
    join_confirmation_notes TEXT,
    
    -- Timestamps and metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REPLACEMENT APPROVALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS "ReplacementApprovals" (
    id SERIAL PRIMARY KEY,
    
    -- Outgoing employee information
    outgoing_employee_name TEXT NOT NULL,
    outgoing_employee_id TEXT,
    outgoing_designation TEXT NOT NULL,
    outgoing_department TEXT NOT NULL,
    last_working_date DATE,
    leaving_reason TEXT,
    
    -- Replacement candidate information
    replacement_candidate_name TEXT NOT NULL,
    replacement_current_designation TEXT,
    replacement_experience_years INTEGER,
    replacement_skills TEXT,
    is_internal_candidate BOOLEAN DEFAULT FALSE,
    
    -- Offer details
    ctc_offered DECIMAL(12,2),
    joining_date DATE,
    notice_period_days INTEGER,
    
    -- Hiring manager information
    hiring_manager_id INTEGER,
    hiring_manager_name TEXT,
    
    -- Business unit
    business_unit TEXT,
    
    -- Approval workflow fields - Initial
    approval_status TEXT DEFAULT 'Pending',
    
    -- BU Head approval (auto-approved on submission)
    bu_head_approved BOOLEAN DEFAULT TRUE,
    bu_head_approval_date TIMESTAMP,
    bu_head_comments TEXT,
    
    -- HR Head approval
    hr_head_approved BOOLEAN DEFAULT FALSE,
    hr_head_approval_date TIMESTAMP,
    hr_head_comments TEXT,
    
    -- Admin approval
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_approval_date TIMESTAMP,
    admin_comments TEXT,
    
    -- Workflow status fields (Post-Admin approval)
    tentative_join_date DATE,
    tentative_candidate_name TEXT,
    bu_head_tentative_entered BOOLEAN DEFAULT FALSE,
    bu_head_tentative_date TIMESTAMP,
    exact_join_date DATE,
    exact_salary DECIMAL(12,2),
    hr_head_final_entered BOOLEAN DEFAULT FALSE,
    hr_head_final_date TIMESTAMP,
    workflow_status TEXT DEFAULT 'Pending',
    
    -- Employee ID and hire tracking
    employee_id TEXT,
    hired_status TEXT DEFAULT 'Not Hired',
    hired_date TIMESTAMP,
    hr_head_employee_id_entered BOOLEAN DEFAULT FALSE,
    
    -- Join confirmation fields
    join_confirmed BOOLEAN DEFAULT FALSE,
    join_confirmation_date TIMESTAMP,
    join_confirmation_status TEXT DEFAULT 'Pending',
    join_confirmation_notes TEXT,
    
    -- Timestamps and metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_users_business_unit ON "Users"(business_unit);
CREATE INDEX IF NOT EXISTS idx_users_designation ON "Users"(designation);

-- NewHiringApprovals indexes
CREATE INDEX IF NOT EXISTS idx_new_hiring_status ON "NewHiringApprovals"(approval_status);
CREATE INDEX IF NOT EXISTS idx_new_hiring_submitted_by ON "NewHiringApprovals"(hiring_manager_id);
CREATE INDEX IF NOT EXISTS idx_new_hiring_business_unit ON "NewHiringApprovals"(business_unit);
CREATE INDEX IF NOT EXISTS idx_new_hiring_submitted_at ON "NewHiringApprovals"(created_at);
CREATE INDEX IF NOT EXISTS idx_new_hiring_workflow_status ON "NewHiringApprovals"(workflow_status);
CREATE INDEX IF NOT EXISTS idx_new_hiring_bu_tentative_entered ON "NewHiringApprovals"(bu_head_tentative_entered);
CREATE INDEX IF NOT EXISTS idx_new_hiring_hr_final_entered ON "NewHiringApprovals"(hr_head_final_entered);
CREATE INDEX IF NOT EXISTS idx_new_hiring_employee_id ON "NewHiringApprovals"(employee_id);
CREATE INDEX IF NOT EXISTS idx_new_hiring_hired_status ON "NewHiringApprovals"(hired_status);
CREATE INDEX IF NOT EXISTS idx_newhire_join_confirmation ON "NewHiringApprovals"(join_confirmation_status, exact_join_date);

-- ReplacementApprovals indexes
CREATE INDEX IF NOT EXISTS idx_replacement_status ON "ReplacementApprovals"(approval_status);
CREATE INDEX IF NOT EXISTS idx_replacement_submitted_by ON "ReplacementApprovals"(hiring_manager_id);
CREATE INDEX IF NOT EXISTS idx_replacement_submitted_at ON "ReplacementApprovals"(created_at);
CREATE INDEX IF NOT EXISTS idx_replacement_business_unit ON "ReplacementApprovals"(business_unit);
CREATE INDEX IF NOT EXISTS idx_replacement_workflow_status ON "ReplacementApprovals"(workflow_status);
CREATE INDEX IF NOT EXISTS idx_replacement_bu_tentative_entered ON "ReplacementApprovals"(bu_head_tentative_entered);
CREATE INDEX IF NOT EXISTS idx_replacement_hr_final_entered ON "ReplacementApprovals"(hr_head_final_entered);
CREATE INDEX IF NOT EXISTS idx_replacement_employee_id ON "ReplacementApprovals"(employee_id);
CREATE INDEX IF NOT EXISTS idx_replacement_hired_status ON "ReplacementApprovals"(hired_status);
CREATE INDEX IF NOT EXISTS idx_replacement_join_confirmation ON "ReplacementApprovals"(join_confirmation_status, exact_join_date);
CREATE INDEX IF NOT EXISTS idx_replacement_outgoing_designation ON "ReplacementApprovals"(outgoing_designation);
CREATE INDEX IF NOT EXISTS idx_replacement_outgoing_department ON "ReplacementApprovals"(outgoing_department);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Function to update updated_at timestamp for approval tables
CREATE OR REPLACE FUNCTION update_approval_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON "Users";
DROP TRIGGER IF EXISTS update_new_hiring_updated_at ON "NewHiringApprovals";
DROP TRIGGER IF EXISTS update_replacement_updated_at ON "ReplacementApprovals";

-- Create triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "Users" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_new_hiring_updated_at 
    BEFORE UPDATE ON "NewHiringApprovals" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_approval_updated_at_column();

CREATE TRIGGER update_replacement_updated_at 
    BEFORE UPDATE ON "ReplacementApprovals" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_approval_updated_at_column();

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
-- Verify tables were created
SELECT 'Database setup completed successfully!' as message;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

