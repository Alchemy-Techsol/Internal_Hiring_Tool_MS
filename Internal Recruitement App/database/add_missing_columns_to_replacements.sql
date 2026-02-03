-- Add missing columns to ReplacementApprovals table
-- This script adds columns that are referenced in the API but missing from the table

-- Add outgoing_designation column
ALTER TABLE "ReplacementApprovals" 
ADD COLUMN IF NOT EXISTS outgoing_designation TEXT;

-- Add outgoing_department column  
ALTER TABLE "ReplacementApprovals" 
ADD COLUMN IF NOT EXISTS outgoing_department TEXT;

-- Add business_unit column (in case it doesn't exist)
ALTER TABLE "ReplacementApprovals" 
ADD COLUMN IF NOT EXISTS business_unit TEXT;

-- Update existing records to have business_unit based on hiring_manager_id
UPDATE "ReplacementApprovals" 
SET business_unit = (
    SELECT business_unit 
    FROM "Users" 
    WHERE "Users".id = "ReplacementApprovals".hiring_manager_id
)
WHERE business_unit IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_replacement_business_unit ON "ReplacementApprovals"(business_unit);
CREATE INDEX IF NOT EXISTS idx_replacement_outgoing_designation ON "ReplacementApprovals"(outgoing_designation);
CREATE INDEX IF NOT EXISTS idx_replacement_outgoing_department ON "ReplacementApprovals"(outgoing_department);
