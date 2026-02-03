-- Simple database setup for Internal_Hiring
-- Run this in pgAdmin to set up your database

-- Add updated_at column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_users_business_unit ON "Users"(business_unit);
CREATE INDEX IF NOT EXISTS idx_users_designation ON "Users"(designation);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON "Users";
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "Users" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 