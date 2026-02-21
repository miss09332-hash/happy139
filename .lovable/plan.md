

# 三項改善計畫

## 1. 休假條件管理 — 新增分類與排序功能

### 資料庫變更
在 `leave_policies` 資料表新增兩個欄位：
- `category` (text, 預設 '常用')：假別分類，例如「常用」、「特殊」
- `sort_order` (integer, 預設 0)：控制同分類內的顯示順序

### 頁面改動 (`src/pages/LeavePolicies.tsx`)
- 新增/編輯表單加入「分類」下拉選單（常用 / 特殊 / 其他，可自訂）和「排序」數字欄位
- 卡片列表依分類分組顯示，每組有標題
- 查詢時改用 `.order("category").order("sort_order")` 排序
- 支援拖曳排序或上下箭頭按鈕調整順序

---

## 2. Favicon 更換說明

可以更換。只需提供一張新的圖片檔案（PNG、SVG 或 ICO 格式），上傳後我會將它替換到 `public/` 目錄並更新 `index.html` 的引用。

請上傳你想使用的 favicon 圖片，我就能幫你替換。

---

## 3. 表情符號全面替換為 Lucide Icon

### 涉及檔案

| 檔案 | 改動內容 |
|------|----------|
| `src/components/guide/AdminGuide.tsx` | 所有 emoji（⚙️📊📜👥🔔🎨🔐✅❌✏️🗑️🟢🟡🔴🔹👤🛡️）替換為對應 Lucide icon |
| `src/components/guide/EmployeeGuide.tsx` | 所有 emoji（📝📋📅📱）替換為對應 Lucide icon |
| `src/pages/LeavePolicies.tsx` | 🔔 替換為 `<Bell>` icon |

### 對照表（部分）

| Emoji | Lucide Icon |
|-------|-------------|
| ⚙️ | `Settings` |
| 📊 | `BarChart3` |
| 📜 | `ScrollText` |
| 👥 | `Users` |
| 🔔 | `Bell` |
| 🎨 | `Palette` |
| 🔐 | `Lock` |
| ✅ | `Check` |
| ❌ | `X` |
| ✏️ | `Pencil` |
| 🗑️ | `Trash2` |
| 🟢🟡🔴 | 保留彩色圓點 `<span>` (已是 HTML) |
| 🔹 | `ChevronRight` |
| 👤 | `User` |
| 🛡️ | `Shield` |
| 📝 | `FileEdit` |
| 📋 | `ClipboardList` |
| 📅 | `Calendar` |
| 📱 | `Smartphone` |

Section 的 `title` 屬性中的 emoji 前綴會被移除，因為 Section 已經有 `icon` prop 顯示圖示。

---

## 技術細節

### 資料庫 Migration SQL
```sql
ALTER TABLE public.leave_policies
  ADD COLUMN category text NOT NULL DEFAULT '常用',
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
```

### LeavePolicies.tsx 主要變更
- 表單新增 `category`（Select 元件）和 `sort_order`（Input number）
- 查詢改為 `.order("category").order("sort_order")`
- 渲染時按 `category` 分組，每組顯示分組標題
- 每張卡片新增上移/下移按鈕，點擊後交換相鄰項目的 `sort_order` 值

### Guide 檔案變更
- 移除 Section title 中的 emoji 前綴（icon prop 已負責圖示）
- 內文中的 emoji 替換為對應的 inline Lucide icon（`<Icon className="h-4 w-4 inline" />`）

