

# 特休自動換算、入職日期管理與 LINE 通知優化

## 問題分析

1. **特休天數固定**：目前 `leave_policies` 的 `default_days` 是固定值（7天），無法依年資自動換算
2. **缺少入職日期**：`profiles` 表沒有 `hire_date` 欄位，無法計算年資
3. **休假申請無即時通知**：員工提交申請後，系統沒有觸發 LINE 推播通知給管理員，這就是您的 LINE 沒收到通知的原因
4. **缺少月統計通知**：`send-line-message` 只有每日和每週模式，沒有月統計

---

## 實作內容

### 1. 資料庫變更

**profiles 表新增欄位：**
- `hire_date` (date) -- 員工入職日期，由人事/管理員設定

**新建特休年資對照表 `annual_leave_rules`：**

| 年資區間 | 特休天數 |
|----------|----------|
| 6個月~1年 | 3天 |
| 1~2年 | 7天 |
| 2~3年 | 10天 |
| 3~5年 | 14天 |
| 5~10年 | 15天 |
| 10年以上 | 每年加1天（上限30天） |

管理員可在後台自訂規則，不綁定勞基法。

### 2. 管理員 -- 員工資料管理頁面

新增 `src/pages/EmployeeManagement.tsx`：
- 列出所有員工（姓名、部門、入職日期、年資、特休天數）
- 管理員可編輯員工的入職日期與部門
- 自動顯示依年資換算的特休天數

### 3. 特休天數自動換算邏輯

建立共用函數，根據 `hire_date` 計算年資，再對照 `annual_leave_rules` 表得出該員工的特休天數。此邏輯用於：
- 網頁端查詢可休天數
- LINE Webhook 查詢假期餘額
- 管理後台顯示

### 4. 休假申請時自動通知管理員（解決 LINE 不通知問題）

目前系統缺少此功能。實作方式：

- 建立資料庫觸發器：當 `leave_requests` 插入新紀錄時，呼叫 `send-line-message` 推播通知給管理員（LINE_NOTIFY_TARGET_ID）
- 或在前端 `RequestLeave.tsx` 提交成功後，呼叫 `send-line-message` 發送新申請通知
- 同樣在 LINE Webhook 申請成功後也觸發通知

採用前端 + Webhook 雙端觸發方式（比資料庫觸發器更穩定）：
- 網頁端申請成功後 -> 呼叫 `send-line-message` 通知管理員
- LINE 端申請成功後 -> 直接在 Webhook 內推播通知管理員

### 5. 月統計通知

在 `send-line-message` 新增 `monthly-summary` 模式：
- 統計當月各假別使用人次與天數
- 以 Flex Message 呈現圖表式月報

### 6. 員工查詢可休天數

更新 LINE Webhook 的「查詢假期」功能，將特休天數改為依年資動態計算，而非讀取固定的 `default_days`。

---

## 技術細節

### 資料庫遷移 SQL

```sql
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
```

### 修改檔案清單

| 檔案 | 變更 |
|------|------|
| `src/pages/EmployeeManagement.tsx` | 新建 -- 員工資料管理（入職日期） |
| `src/pages/LeavePolicies.tsx` | 新增年資規則管理區塊 |
| `src/pages/RequestLeave.tsx` | 提交成功後呼叫 LINE 通知 |
| `src/lib/leaveCalculation.ts` | 新建 -- 年資換算特休天數函數 |
| `src/App.tsx` | 新增路由 `/employee-management` |
| `src/components/AppLayout.tsx` | 新增導航項目 |
| `supabase/functions/send-line-message/index.ts` | 新增 `new-request` 與 `monthly-summary` 模式 |
| `supabase/functions/line-webhook/index.ts` | 更新查詢假期邏輯（依年資計算特休）、申請後通知管理員 |

### 實作順序

1. 資料庫遷移（hire_date + annual_leave_rules）
2. 建立年資計算共用邏輯
3. 建立員工管理頁面
4. 更新 `send-line-message` 新增通知模式
5. 更新 `RequestLeave.tsx` 加入申請通知
6. 更新 LINE Webhook 的查詢與申請邏輯
7. 更新路由與導航

