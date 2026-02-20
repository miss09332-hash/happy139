

# 四項功能改善計畫

## 1. 請假日期重疊檢查

**問題**：目前員工可以在同一天申請不同假別（如病假和特休同一天），邏輯上不合理。

**解決方案**：
- 在 `RequestLeave.tsx` 提交前，查詢該員工是否有已存在（pending 或 approved）的假單與新申請日期重疊
- 在 `line-webhook` 的 LINE 申請流程中也加入同樣的檢查
- 若重疊，顯示錯誤提示並阻止提交

**修改檔案**：
- `src/pages/RequestLeave.tsx` — 新增日期重疊驗證邏輯
- `supabase/functions/line-webhook/index.ts` — 在 `await_date` 步驟加入重疊檢查

---

## 2. LINE 圖文選單（Rich Menu）設定說明 + 連結跳轉

**說明**：LINE 的「圖文選單」（Rich Menu）需要在 LINE Official Account Manager 後台設定，無法透過程式碼自動建立。但我們可以：
- 在 LINE webhook 中加入快捷選單（Quick Reply）功能，讓員工每次互動時都能看到常用功能按鈕
- 在 webhook 的預設回覆中加入「申請休假」按鈕，點擊後可透過 URI action 開啟網頁版請假頁面

**修改檔案**：
- `supabase/functions/line-webhook/index.ts` — 在預設回覆和功能選單中加入 Quick Reply 按鈕，包含跳轉至 Web 請假頁面的 URI action

---

## 3. 休假提醒加入天數計算

**問題**：LINE 通知中的休假明細只顯示日期範圍，缺少「共計 X 天」。

**解決方案**：
- 在 `send-line-message` 的 `buildFlexBubble` 函數中，為每筆休假計算天數並顯示
- 格式改為：`事假 2026-02-21~2026-02-22 共計2天`
- 同時影響每日提醒、本週提醒、下週提醒、當月明細

**修改檔案**：
- `supabase/functions/send-line-message/index.ts` — 修改 `LeaveEntry` 介面新增 `days` 欄位；修改 `buildFlexBubble` 顯示天數；修改 `fetchLeavesAndProfiles` 計算天數

---

## 4. 休假日曆改為週一開頭 + 假日紅字 + 國定假日

**問題**：目前日曆以週日為第一天，且假日沒有特別標示，也沒有顯示國定假日。

**解決方案**：
- 將 `dayNames` 改為 `["一", "二", "三", "四", "五", "六", "日"]`（週一開頭）
- 調整 `firstDay` 計算邏輯，將週日（0）轉換為 6，其餘減 1
- 週六、週日的日期數字改為紅色
- 新增台灣國定假日資料（含農曆換算後的固定日期），在日曆格子上顯示假日名稱標記
- 國定假日的日期也顯示紅色

**新增檔案**：
- `src/lib/taiwanHolidays.ts` — 台灣國定假日資料（2024-2027），包含元旦、春節、清明、端午、中秋、國慶等

**修改檔案**：
- `src/pages/LeaveCalendar.tsx` — 調整日曆排列為週一開頭；加入假日紅字邏輯；加入國定假日顯示

---

## 技術細節

### 修改檔案總覽

| 檔案 | 變更 |
|------|------|
| `src/pages/RequestLeave.tsx` | 新增日期重疊檢查 |
| `supabase/functions/line-webhook/index.ts` | 加入重疊檢查 + Quick Reply 按鈕（含跳轉請假頁面） |
| `supabase/functions/send-line-message/index.ts` | 休假明細加入天數顯示 |
| `src/pages/LeaveCalendar.tsx` | 週一開頭 + 假日紅字 + 國定假日標示 |
| `src/lib/taiwanHolidays.ts` | 新增台灣國定假日資料 |

### 實作順序

1. 建立台灣國定假日資料檔
2. 修改休假日曆（週一開頭 + 假日紅字 + 國定假日）
3. 修改請假頁面加入日期重疊檢查
4. 修改 Edge Functions（LINE 天數顯示 + 重疊檢查 + Quick Reply）

