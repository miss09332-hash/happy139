

# 修復 LINE Bot 請假日期輸入問題 + 改善使用體驗

## 問題根因

LINE Bot 使用 `userState`（記憶體內的 Map）來追蹤對話狀態。當員工選擇假別後，系統記錄「等待輸入日期」的狀態。但 Edge Function 在兩次訊息之間可能會「冷啟動」，導致記憶體被清空，系統就不認得員工正在請假流程中，直接跳回「請選擇功能」。

## 解決方案

將對話狀態從記憶體改為儲存在資料庫中，確保不會因冷啟動而遺失。同時改善日期輸入的使用體驗。

### 步驟一：建立對話狀態資料表

新增 `line_conversation_state` 資料表，用來保存每位使用者的對話進度：
- `line_user_id`（主鍵）
- `step`（目前步驟，例如 "await_date"）
- `data`（JSON 格式的附加資料，例如已選的假別）
- `updated_at`（最後更新時間，可用於清理過期狀態）

### 步驟二：改善日期輸入體驗

在選擇假別後，提供更友善的日期輸入提示：

1. **LINE 日期選擇器**：使用 LINE 的 Datetime Picker Action，讓員工直接點選日期而非手動輸入格式
2. **兩步驟流程**：先選開始日期，再選結束日期（或點「同一天」按鈕）
3. 流程改為：
   - 員工點選假別 -> postback 儲存狀態到資料庫
   - 系統回覆含有「日期選擇器」按鈕的 Flex Message
   - 員工點選日期選擇器選開始日期 -> postback 儲存開始日期
   - 系統回覆選擇結束日期（含「同一天」快捷按鈕）
   - 員工選擇結束日期 -> 完成申請
4. **保留文字輸入**：仍然支援直接輸入日期格式（如 2026-03-01），作為備用方式

### 步驟三：修改 Edge Function

修改 `supabase/functions/line-webhook/index.ts`：

1. 移除 `const userState = new Map(...)` 記憶體狀態
2. 新增資料庫讀寫函式：
   - `getState(supabase, lineUserId)` - 從資料庫讀取狀態
   - `setState(supabase, lineUserId, step, data)` - 寫入狀態
   - `clearState(supabase, lineUserId)` - 清除狀態
3. 擴展 postback 處理：
   - `action=select_leave` -> 儲存假別到資料庫，回覆日期選擇器
   - `action=pick_start_date` -> 儲存開始日期，回覆結束日期選擇器
   - `action=pick_end_date` -> 取得完整資訊，建立請假申請
   - `action=same_day` -> 結束日期等於開始日期，直接建立申請
4. 保留文字輸入日期的解析邏輯作為備用

### 日期選擇器 Flex Message 範例

選擇開始日期的訊息會包含一個 Datetime Picker 按鈕：

```text
+---------------------------+
|  📅 事假 - 選擇日期        |
|---------------------------|
|  請選擇休假開始日期         |
|                           |
|  [📅 選擇開始日期]         |
|  [❌ 取消申請]             |
+---------------------------+
```

選擇結束日期的訊息：

```text
+---------------------------+
|  📅 事假 - 選擇結束日期     |
|---------------------------|
|  開始日期：2026-03-01       |
|  請選擇結束日期             |
|                           |
|  [📅 選擇結束日期]         |
|  [📌 只請一天]             |
|  [❌ 取消]                 |
+---------------------------+
```

## 修改檔案

| 檔案 | 動作 |
|------|------|
| 新增資料庫遷移 | 建立 `line_conversation_state` 資料表 |
| `supabase/functions/line-webhook/index.ts` | 改用資料庫狀態 + 新增日期選擇器 |

## 技術細節

- LINE Datetime Picker Action 使用 `type: "datetimepicker"`, `mode: "date"` 格式
- 資料庫狀態設定 30 分鐘過期，避免殘留舊狀態
- RLS 政策：此表僅由 Edge Function 透過 service role 存取，不需要公開 RLS

