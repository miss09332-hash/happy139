
# LINE 通知修復 + 員工休假餘額追蹤系統

## 問題 1：LINE 通知顯示 0 人

**根本原因**：Edge Function 使用 `new Date().toISOString().split("T")[0]` 取得日期，這會回傳 UTC 時間。台灣是 UTC+8，例如台灣時間 2/21 上午 7 點，UTC 仍是 2/20，導致查詢日期錯誤，永遠抓不到正確的休假人數。

**修復方式**：在 `send-line-message` 和 `line-webhook` 中改用台灣時區計算日期：
```text
const now = new Date();
const taiwanDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = taiwanDate.toISOString().split("T")[0];
```

同時修復 `getWeekDates()` 函數也使用台灣時區。

---

## 新功能：員工休假餘額追蹤頁面

### 新增頁面 `/leave-balance`

建立 `src/pages/LeaveBalance.tsx`，功能包含：

**A. 員工休假餘額總覽表**
- 每位員工一列，顯示各假別的「已休天數 / 總額度」
- 特休天數依年資自動計算（已有邏輯）
- 其他假別（病假、事假、婚假等）依 `leave_policies` 表的 `default_days` 為額度
- 顏色標示：正常(綠)、即將用完(黃)、超休(紅)
- 支援搜尋過濾

**B. 休假提醒機制**
- 新增 `send-line-message` 的 `leave-balance-reminder` 模式
- 管理員可在頁面上手動觸發提醒
- 提醒邏輯：
  - 超休提醒：已休天數 > 額度（例如事假已休 15 天，額度 14 天）
  - 未休提醒：到了年底（可設定月份門檻，如 10 月後）特休使用率低於 50%
  - 即將到期：特休剩餘未使用且距離年度結束不到 3 個月

**C. 提醒規則設定**
在 `src/pages/LeavePolicies.tsx` 擴充：
- 新增「提醒門檻」設定欄位到 `leave_policies` 表
- 例如：事假超過 10 天時提醒、特休 10 月後未休超過 50% 時提醒

---

## 技術細節

### 資料庫變更

在 `leave_policies` 表新增兩個欄位：
```sql
ALTER TABLE public.leave_policies
  ADD COLUMN reminder_threshold_days integer DEFAULT 0,
  ADD COLUMN reminder_enabled boolean DEFAULT false;
```

- `reminder_threshold_days`：當已休天數達到此值時觸發提醒（0 = 不啟用）
- `reminder_enabled`：是否啟用該假別的自動提醒

### 修改檔案清單

| 檔案 | 變更 |
|------|------|
| `supabase/functions/send-line-message/index.ts` | 修復時區問題；新增 `leave-balance-reminder` 模式 |
| `supabase/functions/line-webhook/index.ts` | 修復時區問題 |
| `src/pages/LeaveBalance.tsx` | 新建 -- 員工休假餘額追蹤頁面 |
| `src/pages/LeavePolicies.tsx` | 擴充提醒門檻設定 |
| `src/components/AppLayout.tsx` | 新增導航項目「休假餘額」 |
| `src/App.tsx` | 新增路由 `/leave-balance` |
| `src/lib/line.ts` | 新增 `sendLeaveBalanceReminder` 函數 |
| `src/lib/queries.ts` | 新增查詢員工休假使用統計的函數 |

### 實作順序

1. 資料庫遷移（leave_policies 新增提醒欄位）
2. 修復 Edge Function 時區問題
3. 建立休假餘額追蹤頁面
4. 擴充休假條件頁面的提醒設定
5. 新增 LINE 提醒推播模式
6. 更新路由與導航
