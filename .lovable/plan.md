

# 三合一功能實作計畫

## 一、操作指南頁面（員工版 + 管理員版分開）

建立新頁面 `src/pages/UserGuide.tsx`，使用 Tabs 元件分為「員工指南」和「管理員指南」兩個分頁。非管理員只顯示員工分頁。

內容以純前端靜態呈現（不需資料庫），涵蓋之前產出的操作手冊內容：
- 員工指南：登入註冊、申請休假、查看日曆、LINE 綁定與指令
- 管理員指南：審核假單、員工管理、休假政策、通知設置、圖文選單設定

在 `AppLayout.tsx` 側邊欄新增「操作指南」導覽項（所有使用者可見），路由 `/user-guide`。

## 二、管理員可設定其他人為管理員

在 `src/pages/EmployeeManagement.tsx` 員工列表中，新增「角色」欄位，顯示目前角色（管理員/員工），並提供切換按鈕。

技術細節：
- 查詢 `user_roles` 表取得每位員工角色
- 新增 `useMutation` 呼叫：
  - 升級：`INSERT INTO user_roles (user_id, role) VALUES (..., 'admin')`
  - 降級：`DELETE FROM user_roles WHERE user_id = ... AND role = 'admin'`
- 使用 `AlertDialog` 確認操作，防止誤觸
- 現有 RLS 政策 `Admins can manage roles` 已允許管理員對 `user_roles` 進行 CRUD，無需新增資料庫遷移

## 三、忘記密碼 / 重設密碼功能

### 3a. Auth 頁面新增「忘記密碼」連結
在 `src/pages/Auth.tsx` 登入表單下方加入「忘記密碼？」連結，點擊後顯示 email 輸入框，呼叫：
```
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: window.location.origin + '/reset-password'
})
```

### 3b. 新增 `/reset-password` 頁面
建立 `src/pages/ResetPassword.tsx`：
- 偵測 URL hash 中的 `type=recovery`
- 顯示新密碼輸入表單
- 呼叫 `supabase.auth.updateUser({ password })` 更新密碼
- 成功後導向登入頁

### 3c. 路由設定
在 `App.tsx` 新增公開路由 `/reset-password`（不需登入即可存取）。

---

## 修改檔案清單

| 檔案 | 動作 |
|------|------|
| `src/pages/UserGuide.tsx` | 新建 - 操作指南頁面 |
| `src/pages/ResetPassword.tsx` | 新建 - 重設密碼頁面 |
| `src/pages/Auth.tsx` | 修改 - 加入忘記密碼流程 |
| `src/pages/EmployeeManagement.tsx` | 修改 - 加入角色管理功能 |
| `src/components/AppLayout.tsx` | 修改 - 側邊欄加入操作指南連結 |
| `src/App.tsx` | 修改 - 新增兩條路由 |

不需要資料庫遷移，現有 RLS 政策已足夠支援所有功能。
