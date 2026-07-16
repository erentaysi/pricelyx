-- Migration: B2B Vendor Panel için auth_user bağlama

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
