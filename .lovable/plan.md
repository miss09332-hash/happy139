

# LINE 官方帳號互動式休假系統

## 概要

讓員工直接在 LINE 官方帳號上完成休假申請、查詢剩餘假期，並由管理員在後台設定各類休假的額度條件。系統透過 LINE Webhook 接收員工訊息，以 Flex Message 回應互動式操作介面。

---

## 功能拆解

### 1. LINE Webhook 接收端
建立新的 Edge Function `line-webhook`，作為 LINE Messaging API 的 Webhook URL，接收員工傳來的文字或 Postback 事件，根據指令回應對應功能。

支援指令：
- **「申請休假」** -- 回傳 Flex Message 選單，讓員工依序選擇假別、起迄日期、原因，最終寫入 `leave_requests` 表
- **「查詢假期」** -- 查詢該員工當年度各類假別已使用天數與剩餘天數，以 Flex Message 呈現
- **「當月休假」** -- 列出當月所有已核准的休假人員清單

### 2. LINE 使用者綁定
在 `profiles` 表新增 `line_user_id` 欄位，用於將 LINE User ID 對應到系統帳號。員工第一次在 LINE 傳訊時，透過輸入 email 進行綁定。

### 3. 休假額度設定表 (leave_policies)
建立新表 `leave_policies`，管理員可設定每種假別的年度額度：

| 欄位 | 說明 |
|---|---|
| id | UUID 主鍵 |
| leave_type | 假別名稱（特休、病假、事假等） |
| default_days | 預設年度天數 |
| description | 假別說明 |
| is_active | 是否啟用 |

### 4. 管理後台 -- 休假條件設定頁
在網頁後台新增管理介面，讓管理員：
- 新增/編輯/停用假別
- 設定每種假別的預設天數
- 自訂假別名稱與說明

### 5. Flex Message 互動設計

**申請休假流程（多步驟 Postback）：**
1. 員工傳「申請休假」-> 回傳假別選擇 Flex Carousel
2. 員工選擇假別 -> 回傳日期輸入提示
3. 員工輸入日期 -> 確認後寫入資料庫，回傳申請成功 Flex Message

**查詢假期 Flex Message：**
以表格式 Bubble 呈現各假別的總額度、已用天數、剩餘天數，使用進度條視覺化。

---

## 技術細節

### 資料庫變更

**1. profiles 表新增欄位：**
```sql
ALTER TABLE public.profiles ADD COLUMN line_user_id text UNIQUE;
```

**2. 新建 leave_policies 表：**
```sql
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
-- 所有人可讀，管理員可改
CREATE POLICY "Anyone can view policies" ON public.leave_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage policies" ON public.leave_policies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
-- 預設資料
INSERT INTO public.leave_policies (leave_type, default_days, description) VALUES
  ('特休', 7, '年度特別休假'),
  ('病假', 30, '因病需休養'),
  ('事假', 14, '因個人事務'),
  ('婚假', 8, '結婚休假'),
  ('產假', 56, '生產休假'),
  ('喪假', 8, '喪親休假');
```

### 新 Edge Function: `line-webhook`

- 路徑: `supabase/functions/line-webhook/index.ts`
- config.toml 設定 `verify_jwt = false`（LINE 伺服器呼叫）
- 核心邏輯：
  - 解析 LINE Webhook events
  - 根據 event type (message / postback) 分派處理
  - 使用 `SUPABASE_SERVICE_ROLE_KEY` 查詢/寫入資料
  - 以 LINE Reply API 回傳 Flex Message
- 使用者狀態管理：用記憶體 Map 暫存對話狀態（申請流程中的步驟），避免需要額外資料表

### 前端新增

**1. 休假條件管理頁面 `src/pages/LeavePolicies.tsx`：**
- 列出所有假別及額度
- 可編輯天數、說明、啟用/停用
- 新增自訂假別

**2. App.tsx 路由：**
- 新增 `/leave-policies` 路由（AdminRoute 保護）

**3. AppLayout 導航：**
- 新增「休假條件」選單項目（僅管理員可見）

### 實作順序

1. 資料庫遷移（profiles 加欄位 + leave_policies 表）
2. 建立 `line-webhook` Edge Function
3. 建立前端休假條件管理頁面
4. 更新路由與導航
5. 部署 Edge Function 並提供 Webhook URL 供使用者設定到 LINE Developer Console

