ALTER TABLE public.leave_policies
  ADD COLUMN IF NOT EXISTS reminder_threshold_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false;