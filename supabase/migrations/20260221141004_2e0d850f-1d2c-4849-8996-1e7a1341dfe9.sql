ALTER TABLE public.leave_policies
  ADD COLUMN category text NOT NULL DEFAULT '常用',
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;