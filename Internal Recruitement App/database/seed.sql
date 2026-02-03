-- Seed data for Users table
-- Insert sample users for testing

INSERT INTO "Users" (name, email, password, designation, business_unit) VALUES
('Priyanka Sah', 'priyanka.s@alchemytechsol.com', '$2b$10$encrypted_password_hash', 'Admin', 'Admin')
ON CONFLICT (email) DO NOTHING;