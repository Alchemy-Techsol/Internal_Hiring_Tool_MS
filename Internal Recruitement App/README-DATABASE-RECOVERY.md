# 🗄️ Database Recovery Guide

## ⚡ Quick Recovery

If you've lost your database, follow these 3 steps:

### 1. Create Database
```sql
CREATE DATABASE "Internal_Hiring";
```

### 2. Run Complete Setup
```bash
psql -U postgres -d "Internal_Hiring" -f database/complete_setup.sql
```

Or in pgAdmin:
1. Open `database/complete_setup.sql`
2. Copy all content
3. Execute in Query Tool

### 3. Start Backend
```bash
cd backend
npm start
```

Look for: `✅ Database connected successfully`

## ✅ Done!

Your database is fully recovered with all tables and features.

---

## 📚 More Information

- **Quick Guide:** See `database/RECOVER_LOST_DATABASE.md`
- **Detailed Guide:** See `database/DATABASE_SETUP_INSTRUCTIONS.md`
- **Script Reference:** See `database/INDEX.md`
- **Full Summary:** See `DATABASE_RECOVERY_SUMMARY.md`

## 📁 Database Files

All database scripts are in the `database/` folder:

### Main Scripts
- `complete_setup.sql` ⭐ **Use this one**
- `QUICK_SETUP.sql` - Fresh start (drops everything)

### Migration Scripts
- `approval_tables.sql` - Base approval tables
- `new_workflow_fields.sql` - Post-approval workflow
- `add_employee_id_fields.sql` - Employee tracking
- `join_confirmation_fields.sql` - Join tracking
- Plus more...

### Documentation
- `RECOVER_LOST_DATABASE.md` - Quick recovery
- `DATABASE_SETUP_INSTRUCTIONS.md` - Detailed setup
- `INDEX.md` - All scripts reference
- `README.md` - Updated with quick start

## 🎯 What Gets Created

- ✅ **Users Table** - User accounts and profiles
- ✅ **NewHiringApprovals Table** - New hire workflows (64 columns)
- ✅ **ReplacementApprovals Table** - Replacement workflows (58 columns)
- ✅ **20+ Indexes** - Performance optimization
- ✅ **Triggers** - Auto-update timestamps
- ✅ **All Workflows** - Complete approval system

## 🆘 Troubleshooting

**"Permission denied"**
- Use a PostgreSQL superuser account (usually `postgres`)

**"Database exists"**
- Drop it first: `DROP DATABASE "Internal_Hiring";`

**"Table exists"**
- Run `QUICK_SETUP.sql` instead (drops and recreates)

**Can't connect**
- Check PostgreSQL is running: `pg_isready`
- Check `.env` file in `backend/`

## 📞 Need Help?

See `DATABASE_RECOVERY_SUMMARY.md` for complete documentation.



