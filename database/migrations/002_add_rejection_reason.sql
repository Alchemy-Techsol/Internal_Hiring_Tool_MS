-- Migration 002: Add rejection_reason column for HR/Admin rejection feedback
ALTER TABLE "NewHiringApprovals" ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE "ReplacementApprovals" ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
