

# 修復 LINE 兩個問題

## 問題分析

### 問題 1：LINE 不能選擇時數
Edge function 的時間選擇流程程式碼邏輯正確（整天/選擇時間 → Quick Reply 時間按鈕），但可能需要重新部署 edge function 才能生效。會確認部署狀態。

### 問題 2：拖拉排序不影響 LINE 顯示順序
找到兩個 bug：

1. **查詢排序錯誤**：LINE webhook 查詢假別時使用 `.order("leave_type")`（按名稱字母排序），而非 `.order("category").order("sort_order")`（按拖拉排序）
2. **假別分類硬編碼**：`COMMON_LEAVE_TYPES = ["特休", "病假", "事假"]` 把假別分為「常用」和「其他」兩組顯示在 carousel 中，完全忽略資料庫的分類和排序。這導致喪假永遠出現在「其他假別」卡片裡，無法透過拖拉改變位置。

## 修復方案

### 修改檔案：`supabase/functions/line-webhook/index.ts`

**1. 修正所有查詢的排序**
- 「申請休假」查詢改為 `.order("category").order("sort_order")`
- 「其他假別」查詢改為 `.order("category").order("sort_order")`
- 「餘額查詢」查詢加入 `.order("category").order("sort_order")`

**2. 移除硬編碼的 COMMON_LEAVE_TYPES**
- 不再用固定的假別名稱分組
- 改用資料庫的 `category` 欄位分組（如「常用」、「特殊」、「其他」）
- Carousel 按 sort_order 順序顯示所有假別，不再強制分兩組
- 如果假別數量超過 10 個（LINE carousel 上限），後面的放入「更多假別」卡片

**3. 確認重新部署**
- 修改完成後自動部署 edge function

