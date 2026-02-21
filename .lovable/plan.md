

# 增強操作指南 + 確認 LINE 關鍵字回覆

## 一、增強員工指南（UserGuide.tsx）

在現有的每個操作步驟中加入更多視覺元素，讓內容更生動易懂：

### 新增的視覺元件：
- **Tip 提示框**：淺藍色背景的小提示區塊（用 Lightbulb 圖示）
- **Warning 警告框**：淺黃色背景的注意事項區塊（用 AlertTriangle 圖示）
- **KeyboardShortcut 指令標籤**：用 Badge 元件呈現 LINE 指令，視覺上更突出
- **每個 Section 加入更多 Lucide 圖示**裝飾子項目

### 內容擴充：
- 註冊與登入：加入「密碼安全提示」和「忘記密碼流程」的詳細說明
- 申請休假：加入假別說明表格（特休、病假、事假各自的簡短說明）
- 休假日曆：加入顏色圖例說明區塊
- LINE 功能：將指令表格改為卡片式排版，每個指令配一個圖示，並加入「綁定失敗怎麼辦？」的 FAQ

### 新增 Lucide 圖示引用：
- `Lightbulb`, `AlertTriangle`, `Mail`, `Key`, `CheckCircle`, `XCircle`, `Smartphone`, `Link`, `HelpCircle`

## 二、LINE Bot 關鍵字回覆（已實作確認）

LINE webhook 目前已使用 `text.includes()` 做關鍵字比對，支援以下關鍵字：

| 關鍵字 | 功能 | 程式碼位置 |
|--------|------|-----------|
| 申請休假 | 顯示假別選擇輪播 | line 548 |
| 查詢假期 | 顯示假期餘額 | line 562 |
| 休假明細 | 顯示年度休假紀錄 | line 626 |
| 當月休假 | 顯示當月所有人休假 | line 648 |
| 綁定 + email | 綁定 LINE 帳號 | line 426-448 |

因為使用 `includes()` 而非完全比對，所以即使訊息中包含其他文字（例如「我想申請休假」），也會觸發對應功能 -- 這正是你要的行為。

**不需要修改 LINE webhook**，功能已完整運作。

## 修改檔案

| 檔案 | 動作 |
|------|------|
| `src/pages/UserGuide.tsx` | 修改 - 增強視覺元素與內容 |

無需修改 LINE webhook 或資料庫。

