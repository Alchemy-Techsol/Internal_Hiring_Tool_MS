-- Add join confirmation fields to NewHiringApprovals table
ALTER TABLE "NewHiringApprovals" 
ADD COLUMN join_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN join_confirmation_date TIMESTAMP,
ADD COLUMN join_confirmation_status TEXT DEFAULT 'Pending', -- 'Pending', 'Joined', 'Not_Joined'
ADD COLUMN join_confirmation_notes TEXT;

-- Add join confirmation fields to ReplacementApprovals table
ALTER TABLE "ReplacementApprovals" 
ADD COLUMN join_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN join_confirmation_date TIMESTAMP,
ADD COLUMN join_confirmation_status TEXT DEFAULT 'Pending', -- 'Pending', 'Joined', 'Not_Joined'
ADD COLUMN join_confirmation_notes TEXT;

-- Update existing records to have 'Pending' status
UPDATE "NewHiringApprovals" 
SET join_confirmation_status = 'Pending' 
WHERE join_confirmation_status IS NULL;

UPDATE "ReplacementApprovals" 
SET join_confirmation_status = 'Pending' 
WHERE join_confirmation_status IS NULL;

-- Create indexes for better performance
CREATE INDEX idx_newhire_join_confirmation ON "NewHiringApprovals" (join_confirmation_status, exact_join_date);
CREATE INDEX idx_replacement_join_confirmation ON "ReplacementApprovals" (join_confirmation_status, exact_join_date);
