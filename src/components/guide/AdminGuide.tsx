import {
  Settings, Users, ClipboardList, Bell, BarChart3, Image, Shield,
  Check, X, Pencil, Trash2, ChevronRight, User,
} from "lucide-react";
import { Section, Step, Tip, Warning } from "./GuideComponents";

export default function AdminGuide() {
  return (
    <div className="space-y-4">
      <Section icon={Settings} title="管理後台（審核假單）">
        <Step n={1}>點左邊選單的「<b>管理後台</b>」。</Step>
        <Step n={2}>上方會顯示統計數字：待審核、已核准、已拒絕的假單數量。</Step>
        <Step n={3}>在下方表格找到要審核的假單。</Step>
        <Step n={4}>
          點右邊的按鈕來操作：
          <ul className="list-disc ml-5 mt-1">
            <li><Check className="h-4 w-4 inline text-green-500" /> <b>核准</b> — 同意這張假單</li>
            <li><X className="h-4 w-4 inline text-red-500" /> <b>拒絕</b> — 不同意這張假單</li>
            <li><Pencil className="h-4 w-4 inline text-muted-foreground" /> <b>編輯</b> — 修改假單內容</li>
            <li><Trash2 className="h-4 w-4 inline text-muted-foreground" /> <b>刪除</b> — 完全移除假單</li>
          </ul>
        </Step>
        <Step n={5}>審核後可以按「<b>發送 LINE 通知</b>」，讓員工在 LINE 收到結果。</Step>
      </Section>

      <Section icon={BarChart3} title="休假餘額">
        <Step n={1}>點左邊選單的「<b>休假餘額</b>」。</Step>
        <Step n={2}>這裡顯示每位員工各種假別的使用狀況。</Step>
        <Step n={3}>
          顏色代表的意思：
          <ul className="list-disc ml-5 mt-1">
            <li><span className="inline-block h-3 w-3 rounded-full bg-green-500 align-middle" /> <b>綠色</b> — 假還很多，不用擔心</li>
            <li><span className="inline-block h-3 w-3 rounded-full bg-yellow-500 align-middle" /> <b>黃色</b> — 快要用完了，要注意</li>
            <li><span className="inline-block h-3 w-3 rounded-full bg-red-500 align-middle" /> <b>紅色</b> — 已經超過上限了！</li>
          </ul>
        </Step>
      </Section>

      <Section icon={ClipboardList} title="休假條件（政策管理）">
        <Step n={1}>點左邊選單的「<b>休假條件</b>」。</Step>
        <Step n={2}>這裡設定每種假別的<b>年度天數上限</b>。</Step>
        <Step n={3}>可以開啟「<b>提醒功能</b>」，設定當員工剩餘天數低於某個數字時發出警告。</Step>
        <Step n={4}>修改後按「儲存」就會立刻生效。</Step>
      </Section>

      <Section icon={Users} title="員工管理">
        <Step n={1}>點左邊選單的「<b>員工管理</b>」。</Step>
        <Step n={2}>這裡列出所有註冊的員工。</Step>
        <Step n={3}>點右邊的<b>鉛筆圖示</b>可以編輯員工的<b>部門</b>和<b>入職日期</b>。</Step>
        <Step n={4}>設定入職日期後，系統會自動計算年資和特休天數。</Step>
        <Step n={5}>可以點「角色」欄位旁的按鈕，將員工<b>升級為管理員</b>或<b>降回一般員工</b>。</Step>
        <Warning>變更角色前系統會跳出確認視窗，請仔細確認後再操作。</Warning>
      </Section>

      <Section icon={Bell} title="通知設置">
        <Step n={1}>點左邊選單的「<b>通知設置</b>」。</Step>
        <Step n={2}>可以設定<b>每日報告</b>和<b>每週報告</b>的自動發送時間。</Step>
        <Step n={3}>開啟開關後，系統會定時透過 LINE 發送休假統計給管理員。</Step>
        <Step n={4}>也可以按「<b>手動觸發</b>」按鈕立即發送一次報告。</Step>
      </Section>

      <Section icon={Image} title="LINE 圖文選單設定">
        <p className="font-medium mb-2">這是最複雜的部分，但跟著步驟做就不會錯：</p>
        <Step n={1}>點左邊選單的「<b>圖文選單</b>」（只有管理員看得到）。</Step>
        <Step n={2}>系統會自動產生一張圖文選單圖片，按「<b>下載圖片</b>」存到電腦。</Step>
        <Step n={3}>打開 <b>LINE Official Account Manager</b>（LINE 官方帳號管理後台）。</Step>
        <Step n={4}>點左邊選單「<b>圖文選單</b>」→「<b>建立</b>」。</Step>
        <Step n={5}>版型選擇「<b>大型 → 上方 2 格 + 下方 3 格</b>」。</Step>
        <Step n={6}>上傳剛才下載的圖片。</Step>
        <Step n={7}>
          設定每個區塊的動作：
          <div className="bg-muted rounded-lg p-3 text-sm mt-1 space-y-1">
            <p><ChevronRight className="h-4 w-4 inline text-primary" /> 左上（申請休假）→ 類型：<b>文字</b>，內容：<code>申請休假</code></p>
            <p><ChevronRight className="h-4 w-4 inline text-primary" /> 右上（查詢假期）→ 類型：<b>文字</b>，內容：<code>查詢假期</code></p>
            <p><ChevronRight className="h-4 w-4 inline text-primary" /> 左下（當月休假）→ 類型：<b>文字</b>，內容：<code>當月休假</code></p>
            <p><ChevronRight className="h-4 w-4 inline text-primary" /> 中下（休假明細）→ 類型：<b>文字</b>，內容：<code>休假明細</code></p>
            <p><ChevronRight className="h-4 w-4 inline text-primary" /> 右下（網頁版請假）→ 類型：<b>連結</b>，網址：你的系統網址 + <code>/request-leave</code></p>
          </div>
        </Step>
        <Step n={8}>按「<b>儲存</b>」並「<b>開啟</b>」圖文選單，就完成了！</Step>
        <Tip>設定完成後，使用者在 LINE 聊天畫面下方就會看到選單按鈕，點一下就能快速操作！</Tip>
      </Section>

      <Section icon={Shield} title="管理員角色說明">
        <p>管理員和一般員工的差別：</p>
        <div className="bg-muted rounded-lg p-3 text-sm mt-2 space-y-1">
          <p><User className="h-4 w-4 inline text-muted-foreground" /> <b>一般員工</b>：可以申請休假、查看日曆、使用 LINE 指令</p>
          <p><Shield className="h-4 w-4 inline text-primary" /> <b>管理員</b>：除了員工功能外，還可以審核假單、管理員工、設定政策、管理通知、設定圖文選單、將其他人設為管理員</p>
        </div>
        <Tip>新註冊的帳號預設是「一般員工」。需要由現有管理員在「員工管理」頁面升級。</Tip>
      </Section>
    </div>
  );
}
