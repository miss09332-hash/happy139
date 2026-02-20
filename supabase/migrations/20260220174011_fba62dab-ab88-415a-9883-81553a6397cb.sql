
-- 1. profiles 加入 hire_date
ALTER TABLE public.profiles ADD COLUMN hire_date date;

-- 2. 特休年資規則表
CREATE TABLE public.annual_leave_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_months integer NOT NULL,
  max_months integer,
  days integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.annual_leave_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rules" ON public.annual_leave_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage rules" ON public.annual_leave_rules
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 預設台灣勞基法規則
INSERT INTO public.annual_leave_rules (min_months, max_months, days) VALUES
  (6, 12, 3),
  (12, 24, 7),
  (24, 36, 10),
  (36, 60, 14),
  (60, 120, 15),
  (120, NULL, 15);
