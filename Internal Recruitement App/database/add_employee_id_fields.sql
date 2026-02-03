-- Add Employee ID and Hired Status Fields
-- This script adds the necessary fields for the HR Head to enter Employee ID from HRMS

-- Add fields to NewHiringApprovals table
ALTER TABLE "NewHiringApprovals" 
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS hired_status TEXT DEFAULT 'Not Hired',
ADD COLUMN IF NOT EXISTS hired_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS hr_head_employee_id_entered BOOLEAN DEFAULT FALSE;

-- Add fields to ReplacementApprovals table
ALTER TABLE "ReplacementApprovals" 
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS hired_status TEXT DEFAULT 'Not Hired',
ADD COLUMN IF NOT EXISTS hired_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS hr_head_employee_id_entered BOOLEAN DEFAULT FALSE;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_new_hiring_employee_id ON "NewHiringApprovals"(employee_id);
CREATE INDEX IF NOT EXISTS idx_new_hiring_hired_status ON "NewHiringApprovals"(hired_status);
CREATE INDEX IF NOT EXISTS idx_new_hiring_hr_head_employee_id_entered ON "NewHiringApprovals"(hr_head_employee_id_entered);

CREATE INDEX IF NOT EXISTS idx_replacement_employee_id ON "ReplacementApprovals"(employee_id);
CREATE INDEX IF NOT EXISTS idx_replacement_hired_status ON "ReplacementApprovals"(hired_status);
CREATE INDEX IF NOT EXISTS idx_replacement_hr_head_employee_id_entered ON "ReplacementApprovals"(hr_head_employee_id_entered);

-- Update existing records to have proper default values
UPDATE "NewHiringApprovals" 
SET hired_status = 'Not Hired', hr_head_employee_id_entered = FALSE 
WHERE hired_status IS NULL;

UPDATE "ReplacementApprovals" 
SET hired_status = 'Not Hired', hr_head_employee_id_entered = FALSE 
WHERE hired_status IS NULL; 