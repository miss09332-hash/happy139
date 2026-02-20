
-- 1. profiles 表新增 line_user_id 欄位
ALTER TABLE public.profiles ADD COLUMN line_user_id text UNIQUE;

-- 2. 新建 leave_policies 表
CREATE TABLE public.leave_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type text NOT NULL UNIQUE,
  default_days integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_policies ENABLE ROW LEVEL SECURITY;

-- RLS: 所有已認證使用者可讀
CREATE POLICY "Anyone can view policies"
  ON public.leave_policies FOR SELECT
  TO authenticated
  USING (true);

-- RLS: 管理員可完整管理
CREATE POLICY "Admins can manage policies"
  ON public.leave_policies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 自動更新 updated_at
CREATE TRIGGER update_leave_policies_updated_at
  BEFORE UPDATE ON public.leave_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 預設假別資料
INSERT INTO public.leave_policies (leave_type, default_days, description) VALUES
  ('特休', 7, '年度特別休假'),
  ('病假', 30, '因病需休養'),
  ('事假', 14, '因個人事務'),
  ('婚假', 8, '結婚休假'),
  ('產假', 56, '生產休假'),
  ('喪假', 8, '喪親休假');
