-- Add business_unit field to ReplacementApprovals table
-- This script adds the missing business_unit field that is needed for filtering

ALTER TABLE "ReplacementApprovals" 
ADD COLUMN IF NOT EXISTS business_unit TEXT;

-- Update existing records to have business_unit based on hiring_manager_id
-- This assumes that hiring_manager_id corresponds to a user in the Users table
UPDATE "ReplacementApprovals" 
SET business_unit = (
    SELECT business_unit 
    FROM "Users" 
    WHERE "Users".id = "ReplacementApprovals".hiring_manager_id
)
WHERE business_unit IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_replacement_business_unit ON "ReplacementApprovals"(business_unit);
