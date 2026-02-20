
-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_time TEXT NOT NULL DEFAULT '08:00',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read/write
CREATE POLICY "Admins can manage notification settings"
ON public.notification_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can view settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Seed default settings
INSERT INTO public.notification_settings (setting_key, enabled, schedule_time) VALUES
  ('daily_reminder', false, '08:00'),
  ('weekly_reminder', false, '08:00'),
  ('monthly_reminder', false, '08:00'),
  ('balance_reminder', false, '08:00');
