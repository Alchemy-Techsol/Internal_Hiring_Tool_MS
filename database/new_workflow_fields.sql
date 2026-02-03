-- New Workflow Fields for Post-Admin Approval Process
-- This script adds fields needed for the new workflow where BU Head enters tentative details
-- after Admin approval, then HR Head enters final details

-- Add fields to NewHiringApprovals table for new workflow
ALTER TABLE "NewHiringApprovals" 
ADD COLUMN IF NOT EXISTS tentative_join_date DATE,
ADD COLUMN IF NOT EXISTS tentative_candidate_name TEXT,
ADD COLUMN IF NOT EXISTS bu_head_tentative_entered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bu_head_tentative_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS exact_join_date DATE,
ADD COLUMN IF NOT EXISTS exact_salary DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS hr_head_final_entered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hr_head_final_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'Pending'; -- Pending, Admin_Approved, BU_Tentative_Entered, HR_Final_Entered, Completed

-- Add fields to ReplacementApprovals table for new workflow
ALTER TABLE "ReplacementApprovals" 
ADD COLUMN IF NOT EXISTS tentative_join_date DATE,
ADD COLUMN IF NOT EXISTS tentative_candidate_name TEXT,
ADD COLUMN IF NOT EXISTS bu_head_tentative_entered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bu_head_tentative_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS exact_join_date DATE,
ADD COLUMN IF NOT EXISTS exact_salary DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS hr_head_final_entered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hr_head_final_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'Pending'; -- Pending, Admin_Approved, BU_Tentative_Entered, HR_Final_Entered, Completed

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_new_hiring_workflow_status ON "NewHiringApprovals"(workflow_status);
CREATE INDEX IF NOT EXISTS idx_new_hiring_bu_tentative_entered ON "NewHiringApprovals"(bu_head_tentative_entered);
CREATE INDEX IF NOT EXISTS idx_new_hiring_hr_final_entered ON "NewHiringApprovals"(hr_head_final_entered);

CREATE INDEX IF NOT EXISTS idx_replacement_workflow_status ON "ReplacementApprovals"(workflow_status);
CREATE INDEX IF NOT EXISTS idx_replacement_bu_tentative_entered ON "ReplacementApprovals"(bu_head_tentative_entered);
CREATE INDEX IF NOT EXISTS idx_replacement_hr_final_entered ON "ReplacementApprovals"(hr_head_final_entered);

-- Update existing records to have proper default values
UPDATE "NewHiringApprovals" 
SET workflow_status = 'Pending', 
    bu_head_tentative_entered = FALSE,
    hr_head_final_entered = FALSE
WHERE workflow_status IS NULL;

UPDATE "ReplacementApprovals" 
SET workflow_status = 'Pending', 
    bu_head_tentative_entered = FALSE,
    hr_head_final_entered = FALSE
WHERE workflow_status IS NULL;

-- Update workflow status for already approved requests
UPDATE "NewHiringApprovals" 
SET workflow_status = 'Admin_Approved'
WHERE approval_status = 'Approved' AND ADMIN_approved = true;

UPDATE "ReplacementApprovals" 
SET workflow_status = 'Admin_Approved'
WHERE approval_status = 'Approved' AND admin_approved = true;
