

# 五項功能改進計畫

## 1. 請假表單新增「整天」勾選欄位

在 `src/pages/RequestLeave.tsx` 的日期選擇區下方加入 Checkbox「整天請假」：
- 預設勾選，勾選時隱藏開始/結束時間選擇器
- 整天模式下自動計算時數 = 天數 x daily_work_hours
- 取消勾選時顯示時間選擇器，使用現有的 calculateLeaveHours 計算

## 2. 休假條件改用拖拉排序

在 `src/pages/LeavePolicies.tsx` 中：
- 安裝 `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities`
- 移除上下箭頭按鈕，改用 GripVertical 拖拉手柄
- 同分類內拖拉排序，拖拉結束後批次更新所有項目的 sort_order（依序 0, 1, 2...）
- 使用 SortableContext + useSortable 實作每張卡片的拖拉

## 3. 員工查詢休假僅顯示已休過的假別

在 LINE webhook 的「查詢休假」功能中：
- 預設只顯示 used > 0 的假別餘額
- 底部加一個「查看全部假別」postback 按鈕
- 新增 `action=show_all_balance` 處理，顯示完整餘額（包含未使用的假別）

## 4. LINE Webhook 支援小時制請假

在 `supabase/functions/line-webhook/index.ts` 中全面更新：

**申請流程新增時間選擇步驟：**
- 選完結束日期（或選「只請一天」）後，新增「選擇是否整天」步驟
- Quick Reply 提供「整天」和「選擇時間」兩個按鈕
- 選「整天」→ 直接進入填寫原因步驟，hours = 天數 x daily_work_hours
- 選「選擇時間」→ 依序選開始時間、結束時間（Quick Reply 按鈕：09:00 / 09:30 / ... / 18:00）
- 提交時帶入 start_time、end_time、hours 欄位

**餘額查詢改用小時制：**
- 讀取員工的 daily_work_hours
- 查詢時讀取 leave_requests 的 hours 欄位（回退到天數 x 工時）
- 餘額顯示改為「已用 Xh / 總共 Yh」或「X天 Yh / Z天」格式

**成功氣泡和管理員通知更新：**
- 顯示請假時間段和時數

## 5. 管理後台顯示請假時間和時數

在 `src/lib/queries.ts` 和 `src/pages/Admin.tsx` 中：
- `LeaveWithProfile` 介面加入 start_time、end_time、hours 欄位
- 詳情面板顯示「開始時間」「結束時間」「請假時數」
- 列表中每筆也顯示時數標籤
- 編輯模式加入時間和時數的修改欄位

---

## 技術細節

### 需要安裝的套件
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### 修改的檔案

| 檔案 | 變更內容 |
|---|---|
| `src/pages/RequestLeave.tsx` | 加入「整天」Checkbox，控制時間選擇器顯示/隱藏，整天模式自動算時數 |
| `src/pages/LeavePolicies.tsx` | 移除箭頭排序，改用 dnd-kit 拖拉排序，批次更新 sort_order |
| `src/lib/queries.ts` | LeaveWithProfile 加入 start_time、end_time、hours |
| `src/pages/Admin.tsx` | 詳情面板顯示時間與時數，編輯模式支援修改時間/時數 |
| `supabase/functions/line-webhook/index.ts` | 申請流程加時間選擇步驟、hours 計算、餘額用小時顯示、僅顯示已休假別 |

