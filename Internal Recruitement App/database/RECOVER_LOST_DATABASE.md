# Recover Lost Database - Quick Guide

If you've lost your database, follow these simple steps to recreate it.

## 🎯 The Easy Way

### Step 1: Open PostgreSQL

Open your PostgreSQL client (pgAdmin, DBeaver, or psql command line).

### Step 2: Create the Database

```sql
CREATE DATABASE "Internal_Hiring";
```

### Step 3: Run the Complete Setup

**Option A: Using psql**
```bash
psql -U postgres -d "Internal_Hiring" -f database/complete_setup.sql
```

**Option B: Using pgAdmin**
1. Connect to your PostgreSQL server
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `Internal_Hiring`
4. Click Save
5. Right-click on the new "Internal_Hiring" database → "Query Tool"
6. File → Open → Select `database/complete_setup.sql`
7. Click Execute (F5)

**Option C: Manual Copy-Paste**
1. Open `database/complete_setup.sql` in a text editor
2. Copy all content
3. Paste into pgAdmin Query Tool
4. Click Execute

### Step 4: Verify

```sql
SELECT 'Database recovered!' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

You should see:
- NewHiringApprovals
- ReplacementApprovals  
- Users

### Step 5: Start Your Backend

```bash
cd backend
npm start
```

Look for: `✅ Database connected successfully`

## ✅ Done!

Your database is now fully recovered with all tables, indexes, and triggers.

## 🔄 Need to Start Completely Fresh?

If you want to delete everything and start over:

```sql
-- WARNING: This deletes all data!
DROP DATABASE "Internal_Hiring";
CREATE DATABASE "Internal_Hiring";
-- Then run complete_setup.sql again
```

Or use the QUICK_SETUP.sql script which drops tables automatically:

```bash
psql -U postgres -d "Internal_Hiring" -f database/QUICK_SETUP.sql
```

## 📋 What's Included

The setup script creates:

✅ **Users Table**
- User accounts, credentials, designations, business units

✅ **NewHiringApprovals Table**
- All candidate fields
- Approval workflow (BU Head → HR Head → Admin)
- Post-approval workflow fields
- Employee tracking
- Join confirmation

✅ **ReplacementApprovals Table**
- Outgoing employee details
- Replacement candidate details
- Same workflows as NewHiringApprovals

✅ **Indexes** (20+ for performance)
- Search and filtering optimization

✅ **Triggers**
- Auto-update timestamps on record changes

## 🆘 Troubleshooting

### "Database already exists"
```sql
DROP DATABASE "Internal_Hiring";
CREATE DATABASE "Internal_Hiring";
```

### "Permission denied"
Make sure you're using a PostgreSQL superuser account (usually `postgres`).

### "Table already exists"
The `complete_setup.sql` uses `IF NOT EXISTS` and is safe to run. If you have issues:
```sql
-- Drop all tables
DROP TABLE IF EXISTS "ReplacementApprovals" CASCADE;
DROP TABLE IF EXISTS "NewHiringApprovals" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
-- Then run complete_setup.sql again
```

### "Connection refused"
1. Make sure PostgreSQL is running
2. Check your connection settings
3. Verify your `.env` file in the backend directory

## 📞 Need More Help?

See `DATABASE_SETUP_INSTRUCTIONS.md` for detailed troubleshooting.

## 🎉 Success!

Once you see "Database connected successfully", you're good to go!

Start using your app and create new user accounts through the signup process.



