

# 兩項功能改進

## 1. LINE 時間選擇改用 datetimepicker（原生時間下拉）

LINE Messaging API 支援 `datetimepicker` action 的 `mode: "time"`，會在手機上顯示原生的時間滾輪選擇器，比 Quick Reply 按鈕更直覺。

### 修改 `supabase/functions/line-webhook/index.ts`

- **移除** `buildTimeQuickReply` 函式
- **新增** `buildTimePicker` 函式，使用 Flex Message + datetimepicker button：
  - 選擇開始時間：`action.type = "datetimepicker"`, `mode = "time"`, `data = "action=set_start_time&type=...&start=...&end=..."`
  - 選擇結束時間：同理，`data = "action=set_end_time&..."`
- **修改** `pick_time` postback handler（line 1081）：改為回覆 `buildTimePicker` 而非 `buildTimeQuickReply`
- **修改** `set_start_time` handler（line 1093）：從 `event.postback.params.time` 取得時間（而非 URL params 的 `time`）
- **修改** `set_end_time` handler（line 1106）：同上，從 `event.postback.params.time` 取得結束時間

### datetimepicker time mode 回傳格式
`event.postback.params.time` 回傳 `"HH:mm"` 格式字串

## 2. 管理後台新增 CSV 匯出

### 修改 `src/pages/Admin.tsx`

- 在標題列（發送每日提醒按鈕旁邊）新增「匯出 CSV」按鈕
- 匯出邏輯：
  - 將當前 tab 篩選後的 `requests` 資料轉為 CSV
  - 欄位：員工姓名、部門、假別、開始日期、結束日期、開始時間、結束時間、時數、狀態、原因、申請時間
  - 使用 BOM + UTF-8 編碼（確保中文在 Excel 正常顯示）
  - 用 `Blob` + `URL.createObjectURL` + `<a>` 觸發下載
  - 檔名含日期：`休假紀錄_2026-02-28.csv`

### 修改的檔案

| 檔案 | 變更 |
|---|---|
| `supabase/functions/line-webhook/index.ts` | 移除 Quick Reply 時間選擇，改用 datetimepicker time mode |
| `src/pages/Admin.tsx` | 新增 CSV 匯出按鈕和下載邏輯 |

