-- Migration: Add installments_status to fees + Make processo number optional
-- Date: 2026-03-03
-- Description:
--   1. Adds installments_status JSONB column to track individual installment payments
--   2. Makes processo number column optional (allows empty string)

-- ============================================
-- 1. Installments tracking on fees table
-- ============================================

-- Add JSONB column to store individual installment payment status
-- Format: [{"number": 1, "paid": true, "paid_date": "2026-01-15"}, {"number": 2, "paid": false, "paid_date": null}]
ALTER TABLE fees ADD COLUMN IF NOT EXISTS installments_status JSONB DEFAULT '[]'::jsonb;

-- Update RLS policy to include new column (if needed)
-- The existing RLS policies already cover all columns via SELECT *

-- ============================================
-- 2. Make processo number optional
-- ============================================

-- Allow empty string for number (it already has NOT NULL DEFAULT '')
-- No schema change needed - the column already accepts empty strings
-- The constraint is only in the frontend validation
