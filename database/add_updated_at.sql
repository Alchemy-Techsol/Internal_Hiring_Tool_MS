-- Add updated_at column to existing Users table
-- Run this script if you need to add the updated_at column

-- Add updated_at column if it doesn't exist
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_users_email' AND n.nspname = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX idx_users_email ON "Users"(email)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_users_business_unit' AND n.nspname = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX idx_users_business_unit ON "Users"(business_unit)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_users_designation' AND n.nspname = 'public'
    ) THEN
        EXECUTE 'CREATE INDEX idx_users_designation ON "Users"(designation)';
    END IF;
END
$$;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON "Users";
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "Users" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 