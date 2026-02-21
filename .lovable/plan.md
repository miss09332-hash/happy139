

# 將 LINE 圖文選單的表情符號換成 Lucide 圖示

## 目標
把目前 Rich Menu 上的 emoji（📝📊📆📋🌐）替換為更專業的 Lucide SVG 圖示，畫在 Canvas 上。

## 做法

由於 Canvas 無法直接渲染 React 元件，需要將 Lucide 圖示的 SVG 路徑手動繪製到 Canvas 上。

### 具體步驟

1. **定義每個格子對應的 SVG path**
   - 申請休假 → `FilePen`（文件+筆）
   - 查詢假期 → `BarChart3`（長條圖）
   - 當月休假 → `CalendarDays`（日曆）
   - 休假明細 → `ClipboardList`（剪貼簿清單）
   - 網頁版請假 → `Globe`（地球）

2. **建立 `drawIcon` 輔助函式**
   - 使用 `ctx.save()` / `ctx.translate()` / `ctx.scale()` 把 24x24 的 Lucide path 放大到約 160px
   - 設定 `ctx.strokeStyle = "#FFFFFF"`、`ctx.lineWidth`、`ctx.lineCap = "round"` 等屬性模擬 Lucide 風格
   - 用 `new Path2D(svgPath)` 繪製每條路徑

3. **修改 `drawCell` 函式**
   - 移除 `ctx.fillText(emoji, ...)` 那段
   - 改為呼叫 `drawIcon(ctx, iconPaths, cx, cy, size)`

### 修改的檔案

| 檔案 | 變更 |
|---|---|
| `src/pages/RichMenuGenerator.tsx` | 移除 emoji 欄位，新增 SVG path 資料，改用 Path2D 繪製白色線條圖示 |

### 技術細節

- Lucide 圖示本質上是 24x24 viewBox 的 SVG stroke 路徑，可以透過 `Path2D` API 在 Canvas 上繪製
- 需要將座標縮放約 6-7 倍（24px -> ~160px）以適應 Rich Menu 的大尺寸
- 所有圖示統一使用白色描邊（`stroke`），不填充，保持 Lucide 的線條風格
- `lineJoin` 和 `lineCap` 設為 `round` 以匹配 Lucide 預設樣式

