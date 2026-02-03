# Database Scripts Index

This directory contains all database setup and migration scripts for the Internal Hiring App.

## 🎯 Quick Start Scripts

### `complete_setup.sql` ⭐ **RECOMMENDED**
**Purpose:** Creates the complete database schema from scratch in one script.

**Use when:** You need to recreate your entire database with all tables, indexes, and triggers.

**What it does:**
- Creates Users table
- Creates NewHiringApprovals table with ALL fields
- Creates ReplacementApprovals table with ALL fields
- Creates all indexes for performance
- Creates trigger functions and triggers
- Safe to run multiple times (uses IF NOT EXISTS)

### `QUICK_SETUP.sql` ⚡ **FASTEST**
**Purpose:** Quick fresh database setup (drops existing tables first).

**Use when:** You want to completely reset your database and start fresh.

**What it does:**
- Drops all existing tables (WARNING: Deletes all data!)
- Creates new tables, indexes, and triggers
- Single script, fastest setup

## 📚 Migration Scripts

### `init.sql`
**Purpose:** Original users table setup script.

**Use when:** Setting up just the users table.

### `approval_tables.sql`
**Purpose:** Original approval workflow tables.

**Use when:** Setting up NewHiringApprovals and ReplacementApprovals with basic fields.

### `add_updated_at.sql`
**Purpose:** Adds updated_at column and trigger to Users table.

### `new_workflow_fields.sql`
**Purpose:** Adds post-approval workflow fields to both approval tables.

**Fields added:**
- tentative_join_date
- tentative_candidate_name
- bu_head_tentative_entered
- bu_head_tentative_date
- exact_join_date
- exact_salary
- hr_head_final_entered
- hr_head_final_date
- workflow_status

### `add_employee_id_fields.sql`
**Purpose:** Adds employee ID and hire tracking fields.

**Fields added:**
- employee_id
- hired_status
- hired_date
- hr_head_employee_id_entered

### `join_confirmation_fields.sql`
**Purpose:** Adds join confirmation tracking fields.

**Fields added:**
- join_confirmed
- join_confirmation_date
- join_confirmation_status
- join_confirmation_notes

### `add_business_unit_to_replacements.sql`
**Purpose:** Adds business_unit field to ReplacementApprovals.

### `add_missing_columns_to_replacements.sql`
**Purpose:** Adds missing outgoing employee fields to ReplacementApprovals.

**Fields added:**
- outgoing_designation
- outgoing_department
- business_unit

### `simple_setup.sql`
**Purpose:** Adds updated_at column and basic setup to Users table.

### `seed.sql`
**Purpose:** Sample seed data for testing.

## 📖 Documentation

### `README.md`
**Purpose:** Original database setup instructions.

### `DATABASE_SETUP_INSTRUCTIONS.md`
**Purpose:** Detailed setup guide with troubleshooting.

## 🗂️ Support Files

### `config.js`
**Purpose:** Database configuration file.

### `models/User.js`
**Purpose:** User model for backend.

## 🚀 Recommended Setup Flow

### For New Installations:
1. Create database: `CREATE DATABASE "Internal_Hiring";`
2. Run: `complete_setup.sql` or `QUICK_SETUP.sql`
3. Done! ✅

### For Existing Databases (Migration):
1. Read `DATABASE_SETUP_INSTRUCTIONS.md`
2. Run necessary migration scripts in order:
   - approval_tables.sql
   - add_business_unit_to_replacements.sql
   - add_employee_id_fields.sql
   - add_missing_columns_to_replacements.sql
   - join_confirmation_fields.sql
   - new_workflow_fields.sql

### For Lost Database (Your Situation):
1. Create database: `CREATE DATABASE "Internal_Hiring";`
2. Run: `complete_setup.sql`
3. Start your backend server
4. Done! ✅

## 📊 Database Schema Overview

### Users
- User accounts and profiles
- Links to business units
- Designations: BU Head, HR Head, Admin

### NewHiringApprovals
- New hire approval workflows
- BU Head → HR Head → Admin → Post-Approval Workflow
- Join confirmation tracking

### ReplacementApprovals
- Replacement approval workflows
- Similar workflow to NewHiringApprovals
- Tracks outgoing employees and replacements

## ⚠️ Important Notes

- Always backup your database before running DROP commands
- `QUICK_SETUP.sql` will DELETE ALL DATA
- `complete_setup.sql` is safe to run multiple times
- All scripts use PostgreSQL syntax
- All tables use quoted identifiers (case-sensitive)

## 🆘 Need Help?

1. Check `DATABASE_SETUP_INSTRUCTIONS.md` for detailed instructions
2. Check backend server console for error messages
3. Verify PostgreSQL is running: `pg_isready`
4. Check your `.env` file configuration



