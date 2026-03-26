-- Align orders schema with OrderWizard write payload and admin dashboard reads.
-- This migration is additive and safe to run repeatedly.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS services jsonb,
  ADD COLUMN IF NOT EXISTS payment jsonb,
  ADD COLUMN IF NOT EXISTS quote_id uuid;

ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending';
