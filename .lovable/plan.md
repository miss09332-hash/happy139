

# 休假提醒增強 + 週/月報表 + LINE 綁定說明 + 自動/手動開關

## 問題 1：休假提醒要顯示休假天數

目前 `leave-balance-reminder` 發送的訊息只顯示已休天數和門檻/額度，但缺少「剩餘天數」資訊。

**修復**：在提醒訊息中加入每個假別的完整資訊：「已休 X 天 / 額度 Y 天 / 剩餘 Z 天」，並改用 Flex Message 格式（含進度條），讓員工一目了然。

---

## 問題 2：本週提醒改為「包含當天的完整一週」+ 新增下週/當月

目前 `getWeekDates()` 只取週一到週五。需改為：
- **本週**：以點擊當天所在的週一到週日（7 天）為範圍
- **新增「下週休假」模式**（`next-week-summary`）：下一個週一到週日
- **新增「當月休假」模式**（`monthly-leave-list`）：當月 1 號到月底，列出所有休假人員明細

### 修改項目
- Edge Function `send-line-message`：修改 `getWeekDates` 改為週一~週日；新增 `next-week-summary` 和 `monthly-leave-list` 模式
- `src/lib/line.ts`：新增 `sendNextWeekSummary()` 和 `sendMonthlyLeaveList()` 函數
- `src/pages/NotificationSettings.tsx`：新增「下週休假」和「當月休假」手動發送按鈕

---

## 問題 3：員工如何在 LINE 上接獲通知

**現有機制說明**（已實作但需向您說明）：

系統已內建 LINE 帳號綁定流程：
1. 員工加入您的 LINE 官方帳號（Bot）
2. 第一次傳送任何訊息時，系統會要求輸入公司 Email
3. 系統比對 Email 後，將該員工的 `line_user_id` 寫入 `profiles` 表
4. 綁定後，系統就能透過 LINE Push API 發送個人通知

**改善**：在「休假餘額追蹤」頁面新增一欄「LINE 綁定狀態」，讓管理員可以看到哪些員工已綁定 LINE、哪些還沒綁定，方便提醒員工完成綁定。

---

## 問題 4：自動/手動發送開關

目前通知設定頁面（`NotificationSettings.tsx`）的開關只是前端 state，沒有持久化。

**修復**：
- 新增資料庫表 `notification_settings` 儲存設定（每日提醒開關、每週提醒開關、每月提醒開關、休假餘額提醒開關、提醒時間等）
- 通知設定頁面改為讀寫資料庫
- 新增「休假餘額自動提醒」開關
- 手動發送按鈕始終可用，不受自動開關影響

---

## 技術細節

### 資料庫變更

新增 `notification_settings` 表：

```text
notification_settings
- id (uuid, PK)
- setting_key (text, unique) -- 如 'daily_reminder', 'weekly_reminder', 'monthly_reminder', 'balance_reminder'
- enabled (boolean, default false)
- schedule_time (text, default '08:00') -- 排程時間
- updated_at (timestamptz)
- updated_by (uuid)
```

RLS：管理員可讀寫，員工可讀。

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `supabase/functions/send-line-message/index.ts` | 修改 `getWeekDates` 為週一~週日；新增 `next-week-summary`、`monthly-leave-list` 模式；改善 `leave-balance-reminder` 訊息格式含天數明細 |
| `src/lib/line.ts` | 新增 `sendNextWeekSummary()`、`sendMonthlyLeaveList()` |
| `src/pages/NotificationSettings.tsx` | 改為讀寫資料庫；新增下週/當月/餘額提醒按鈕和自動開關 |
| `src/pages/LeaveBalance.tsx` | 新增 LINE 綁定狀態欄位 |
| 資料庫遷移 | 新增 `notification_settings` 表 |

### 實作順序

1. 資料庫遷移（notification_settings 表）
2. 修改 Edge Function（週日期範圍、新模式、提醒天數格式）
3. 更新休假餘額頁面（LINE 綁定狀態欄）
4. 重寫通知設定頁面（資料庫持久化 + 新按鈕）
5. 更新 `line.ts` 新增函數

