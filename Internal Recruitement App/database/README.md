# Database Setup Instructions

## 🚀 QUICK START - RECOMMENDED

If you need to recreate your database from scratch, use the complete setup:

1. **Create the database:**
   ```sql
   CREATE DATABASE "Internal_Hiring";
   ```

2. **Run the COMPLETE setup script (EASIEST):**
   ```sql
   -- In psql:
   \i database/complete_setup.sql
   
   -- Or use the quick setup for a fresh start:
   \i database/QUICK_SETUP.sql
   ```

This will create all tables, indexes, and triggers in one go!

## 📚 ORIGINAL STEP-BY-STEP SETUP (For reference)

If you prefer incremental setup:

1. **Create the database:**
   ```sql
   CREATE DATABASE "Internal_Hiring";
   ```

2. **Run the initial setup:**
   ```sql
   -- Run this in pgAdmin or psql
   \i database/init.sql
   ```

3. **Set up approval tables:**
   ```sql
   -- Run this in pgAdmin or psql
   \i database/approval_tables.sql
   ```

4. **Run additional migration scripts:**
   ```sql
   \i database/add_business_unit_to_replacements.sql
   \i database/add_employee_id_fields.sql
   \i database/add_missing_columns_to_replacements.sql
   \i database/join_confirmation_fields.sql
   \i database/new_workflow_fields.sql
   \i database/add_updated_at.sql
   ```

## Manual Table Creation (if approval_tables.sql doesn't work)

If you encounter issues with the approval_tables.sql file, you can manually create the tables:

### NewHiringApprovals Table
```sql
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
    status TEXT DEFAULT 'pending_approval',
    submitted_by INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejected_by INTEGER,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ReplacementApprovals Table
```sql
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
    status TEXT DEFAULT 'pending_approval',
    submitted_by INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejected_by INTEGER,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Create Indexes
```sql
-- Indexes for NewHiringApprovals
CREATE INDEX IF NOT EXISTS idx_new_hiring_status ON "NewHiringApprovals"(status);
CREATE INDEX IF NOT EXISTS idx_new_hiring_submitted_by ON "NewHiringApprovals"(submitted_by);
CREATE INDEX IF NOT EXISTS idx_new_hiring_business_unit ON "NewHiringApprovals"(business_unit);
CREATE INDEX IF NOT EXISTS idx_new_hiring_submitted_at ON "NewHiringApprovals"(submitted_at);

-- Indexes for ReplacementApprovals
CREATE INDEX IF NOT EXISTS idx_replacement_status ON "ReplacementApprovals"(status);
CREATE INDEX IF NOT EXISTS idx_replacement_submitted_by ON "ReplacementApprovals"(submitted_by);
CREATE INDEX IF NOT EXISTS idx_replacement_submitted_at ON "ReplacementApprovals"(submitted_at);
```

## Environment Variables

Make sure your `.env` file in the backend directory contains:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=Internal_Hiring
DB_PASSWORD=Postgres0607@
DB_PORT=5432
```

## Testing the Setup

After setting up the database, you can test the connection by running:

```bash
cd backend
npm start
```

You should see: "✅ Database connected successfully" in the console.

## Troubleshooting

1. **Connection Issues:**
   - Make sure PostgreSQL is running
   - Check your database credentials
   - Ensure the database exists

2. **Table Creation Issues:**
   - Run the SQL commands manually in pgAdmin
   - Check for syntax errors
   - Ensure you have proper permissions

3. **API Issues:**
   - Restart the backend server after database changes
   - Check the console for error messages
   - Verify the API endpoints are working 