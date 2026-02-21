

# 特休天數個人化同步計畫

## 問題說明

目前 LINE Bot 在顯示假別選擇卡片時，特休顯示的天數來自 `leave_policies` 資料表的 `default_days`（固定值，例如 7 天），但每位員工的特休天數應根據入職日期（年資）動態計算。

查詢休假餘額的功能已經有正確的年資計算邏輯，但「申請休假」的假別選擇卡片沒有做同樣的處理。

## 解決方案

在顯示假別選擇卡片時，查詢該員工的 `hire_date` 和 `annual_leave_rules`，動態計算特休天數後再顯示於卡片上。

### 改動內容

修改 `supabase/functions/line-webhook/index.ts`：

1. **修改 `buildLeaveTypeCarousel` 函式**：新增一個可選參數 `annualDaysOverride`，當傳入時用來覆蓋特休的 `default_days` 顯示值

2. **修改「申請休假」指令處理**（約第 871 行）：
   - 額外查詢 `annual_leave_rules`
   - 利用員工的 `hire_date` 計算年資月數
   - 算出該員工的實際特休天數
   - 將計算結果傳入 `buildLeaveTypeCarousel`

3. **同步修改「其他假別」卡片**（`buildOtherLeaveTypeCarousel` 和 `show_other_types` 處理）：同樣傳入個人化天數

### 計算邏輯

重複利用已存在於餘額查詢中的年資計算邏輯：
- 從 `profile.hire_date` 計算年資月數
- 根據 `annual_leave_rules` 對照表找出對應天數
- 未滿 6 個月：0 天
- 10 年以上：基礎天數 + 每多 1 年加 1 天，上限 30 天

## 修改檔案

| 檔案 | 改動 |
|------|------|
| `supabase/functions/line-webhook/index.ts` | 假別卡片顯示個人化特休天數 |

## 技術細節

- 將年資計算邏輯抽取為一個共用函式 `calculateAnnualDays(hireDate, rules)`，避免在餘額查詢和卡片顯示中重複撰寫
- `buildLeaveTypeCarousel(policies, annualDaysOverride?)` 當 `annualDaysOverride` 有值且假別為「特休」時，顯示個人化天數
- 同樣套用到 `buildOtherLeaveTypeCarousel`
