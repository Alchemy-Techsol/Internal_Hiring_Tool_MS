-- ============================================================
-- SINGLE STEP COMPLETE DATABASE SETUP FOR INTERNAL HIRING APP
-- ============================================================
-- Copy this ENTIRE file and paste into pgAdmin Query Tool
-- This will create everything you need in one go!
-- ============================================================

-- Step 1: Create the database (if it doesn't exist)
SELECT 'CREATE DATABASE' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'Internal_Hiring');
SELECT 'Database Internal_Hiring created or already exists!' as message;

-- Step 2: Connect to the database (run in a new query window on Internal_Hiring database)
-- OR simply select Internal_Hiring database in pgAdmin and run the rest below

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
    approval_status TEXT DEFAULT 'Pending',
    bu_head_approved BOOLEAN DEFAULT TRUE,
    bu_head_approval_date TIMESTAMP,
    bu_head_comments TEXT,
    hr_head_approved BOOLEAN DEFAULT FALSE,
    hr_head_approval_date TIMESTAMP,
    hr_head_comments TEXT,
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_approval_date TIMESTAMP,
    admin_comments TEXT,
    tentative_join_date DATE,
    tentative_candidate_name TEXT,
    bu_head_tentative_entered BOOLEAN DEFAULT FALSE,
    bu_head_tentative_date TIMESTAMP,
    exact_join_date DATE,
    exact_salary DECIMAL(12,2),
    hr_head_final_entered BOOLEAN DEFAULT FALSE,
    hr_head_final_date TIMESTAMP,
    workflow_status TEXT DEFAULT 'Pending',
    employee_id TEXT,
    hired_status TEXT DEFAULT 'Not Hired',
    hired_date TIMESTAMP,
    hr_head_employee_id_entered BOOLEAN DEFAULT FALSE,
    join_confirmed BOOLEAN DEFAULT FALSE,
    join_confirmation_date TIMESTAMP,
    join_confirmation_status TEXT DEFAULT 'Pending',
    join_confirmation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- REPLACEMENT APPROVALS TABLE
-- ============================================================
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
    business_unit TEXT,
    approval_status TEXT DEFAULT 'Pending',
    bu_head_approved BOOLEAN DEFAULT TRUE,
    bu_head_approval_date TIMESTAMP,
    bu_head_comments TEXT,
    hr_head_approved BOOLEAN DEFAULT FALSE,
    hr_head_approval_date TIMESTAMP,
    hr_head_comments TEXT,
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_approval_date TIMESTAMP,
    admin_comments TEXT,
    tentative_join_date DATE,
    tentative_candidate_name TEXT,
    bu_head_tentative_entered BOOLEAN DEFAULT FALSE,
    bu_head_tentative_date TIMESTAMP,
    exact_join_date DATE,
    exact_salary DECIMAL(12,2),
    hr_head_final_entered BOOLEAN DEFAULT FALSE,
    hr_head_final_date TIMESTAMP,
    workflow_status TEXT DEFAULT 'Pending',
    employee_id TEXT,
    hired_status TEXT DEFAULT 'Not Hired',
    hired_date TIMESTAMP,
    hr_head_employee_id_entered BOOLEAN DEFAULT FALSE,
    join_confirmed BOOLEAN DEFAULT FALSE,
    join_confirmation_date TIMESTAMP,
    join_confirmation_status TEXT DEFAULT 'Pending',
    join_confirmation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_users_business_unit ON "Users"(business_unit);
CREATE INDEX IF NOT EXISTS idx_users_designation ON "Users"(designation);
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

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
DROP TRIGGER IF EXISTS update_users_updated_at ON "Users";
DROP TRIGGER IF EXISTS update_new_hiring_updated_at ON "NewHiringApprovals";
DROP TRIGGER IF EXISTS update_replacement_updated_at ON "ReplacementApprovals";

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
-- SUCCESS MESSAGE
-- ============================================================
SELECT 'Database setup completed successfully!' as message;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

