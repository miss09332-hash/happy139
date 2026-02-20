
# 修復 4 個問題

## 問題 1：員工管理無法更新資料
**原因**：`profiles` 表的 RLS 政策只允許使用者更新自己的資料（`auth.uid() = user_id`），管理員無法更新其他員工。

**修復**：新增一條 RLS 政策，允許管理員更新所有員工資料：
```sql
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));
```

## 問題 2：「今日休假」卡片點擊跳轉到休假日曆
**修復**：將「今日休假」統計卡片包裹在 `<Link to="/leave-calendar">` 中，點擊後跳轉到休假日曆頁面。

## 問題 3：「待審核」卡片點擊跳轉到管理後台
**修復**：將「待審核」統計卡片包裹在 `<Link to="/admin">` 中，點擊後跳轉到管理後台。

## 問題 4：今日日期顯示到秒數且即時更新
**原因**：目前使用 `new Date().toISOString().split("T")[0]` 只取日期部分，且只在元件載入時計算一次。

**修復**：
- 使用 `useState` + `useEffect` + `setInterval` 每秒更新時間
- 格式改為 `YYYY-MM-DD HH:mm:ss`
- 標題下方的日期也同步顯示完整時間

---

## 技術細節

### 資料庫變更
新增一條 RLS 政策到 `profiles` 表，允許 admin 角色更新所有員工資料。

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/pages/Index.tsx` | 統計卡片加入點擊跳轉連結；日期改為即時更新到秒數 |
| 資料庫遷移 | 新增管理員更新 profiles 的 RLS 政策 |
