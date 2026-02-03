# Database Setup Instructions

This guide will help you recreate your database from scratch.

**🎯 NEW!** - Use `complete_setup.sql` or `QUICK_SETUP.sql` for a one-step database recreation!

## Prerequisites

1. PostgreSQL installed and running
2. Access to a PostgreSQL client (pgAdmin, psql, or similar)
3. Database administrative privileges

## Step-by-Step Setup

### Step 1: Create the Database

First, connect to your PostgreSQL server and create a new database:

```sql
-- Connect to PostgreSQL as superuser
-- In psql or pgAdmin SQL Editor:
CREATE DATABASE "Internal_Hiring";
```

### Step 2: Run the Complete Setup Script

Connect to the `Internal_Hiring` database and run the complete setup script:

```sql
-- In psql:
\i database/complete_setup.sql

-- Or in pgAdmin, use the SQL Editor to open and execute:
-- database/complete_setup.sql
```

This script will create:
- Users table
- NewHiringApprovals table
- ReplacementApprovals table
- All necessary indexes
- Triggers for automatic timestamp updates
- All workflow columns

### Step 3: Verify the Setup

Verify that all tables were created successfully:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- You should see:
-- NewHiringApprovals
-- ReplacementApprovals
-- Users
```

### Step 4: Configure Environment Variables

Create or update your `.env` file in the `backend` directory:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=Internal_Hiring
DB_PASSWORD=YourPasswordHere
DB_PORT=5432
```

### Step 5: Test the Connection

Start your backend server to test the database connection:

```bash
cd backend
npm start
```

You should see: `✅ Database connected successfully` in the console.

### Step 6: (Optional) Seed Initial Data

If needed, you can add an initial admin user:

```sql
-- Insert sample admin user (password should be hashed with bcrypt)
INSERT INTO "Users" (name, email, password, designation, business_unit) 
VALUES ('Admin User', 'admin@example.com', '$2b$10$hashed_password_here', 'Admin', 'Admin')
ON CONFLICT (email) DO NOTHING;
```

## Troubleshooting

### Connection Issues

If you see connection errors:
1. Verify PostgreSQL is running: `pg_isready`
2. Check your credentials in `.env`
3. Ensure the database exists: `\l` in psql
4. Check PostgreSQL logs for errors

### Permission Issues

If you get permission errors:
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE "Internal_Hiring" TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
```

### Table Already Exists

If tables already exist and you want to start fresh:

```sql
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS "ReplacementApprovals" CASCADE;
DROP TABLE IF EXISTS "NewHiringApprovals" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- Then run complete_setup.sql again
```

### Migration from Old Schema

If you have an existing database with the old schema, you may need to migrate. Check the individual migration scripts in the `database` folder:
- `add_business_unit_to_replacements.sql`
- `add_employee_id_fields.sql`
- `add_missing_columns_to_replacements.sql`
- `join_confirmation_fields.sql`
- `new_workflow_fields.sql`

## Database Schema Overview

### Users Table
- User authentication and profile information
- Links to business units and designations (BU Head, HR Head, Admin)

### NewHiringApprovals Table
- Handles new hire approval workflows
- Tracks approval status through BU Head → HR Head → Admin
- Manages post-approval workflow (tentative details → final details → join confirmation)
- Stores employee data and join tracking

### ReplacementApprovals Table
- Handles replacement approval workflows
- Tracks outgoing employee and replacement candidate details
- Similar approval workflow to NewHiringApprovals
- Links replacements to business units

## Support

If you encounter issues:
1. Check the server console for detailed error messages
2. Review PostgreSQL logs
3. Verify all environment variables are correct
4. Ensure your schema matches the complete_setup.sql script

## Next Steps

After setting up the database:
1. Create user accounts through the signup process
2. Start using the application
3. Monitor the database for any issues
4. Set up regular backups

