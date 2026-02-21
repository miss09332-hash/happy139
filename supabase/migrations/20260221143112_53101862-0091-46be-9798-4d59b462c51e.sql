
-- Add daily_work_hours to profiles (default 8, configurable per employee)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_work_hours numeric NOT NULL DEFAULT 8;

-- Add start_time, end_time, hours to leave_requests for hourly tracking
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS hours numeric;
