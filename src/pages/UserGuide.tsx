import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  LogIn,
  FileText,
  Calendar,
  MessageCircle,
  Settings,
  Users,
  ClipboardList,
  Bell,
  BarChart3,
  Image,
  Shield,
} from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none text-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start mb-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {n}
      </span>
      <div className="pt-0.5">{children}</div>
    </div>
  );
}

function EmployeeGuide() {
  return (
    <div className="space-y-4">
      <Section icon={LogIn} title="📝 註冊與登入">
        <Step n={1}>打開系統網址，會看到登入畫面。</Step>
        <Step n={2}>第一次使用？點上方的「<b>註冊</b>」分頁。</Step>
        <Step n={3}>填寫你的<b>姓名、Email、密碼</b>（密碼至少 6 個字）。</Step>
        <Step n={4}>按「註冊」按鈕，系統會自動幫你登入。</Step>
        <Step n={5}>之後每次回來，只要在「登入」分頁輸入 Email 和密碼就可以了。</Step>
        <p className="text-muted-foreground text-sm mt-2">💡 忘記密碼？登入頁面下方有「忘記密碼？」的連結，點一下就能收到重設密碼的信。</p>
      </Section>

      <Section icon={FileText} title="📋 申請休假">
        <Step n={1}>點左邊選單的「<b>申請休假</b>」。</Step>
        <Step n={2}>選擇<b>假別</b>（特休、病假、事假...等）。</Step>
        <Step n={3}>用日曆選擇<b>開始日期</b>和<b>結束日期</b>。</Step>
        <Step n={4}>在「原因」欄位寫上請假原因。</Step>
        <Step n={5}>按「<b>提交申請</b>」按鈕送出。</Step>
        <p className="text-muted-foreground text-sm mt-2">⚠️ 如果日期和之前的假單重疊，系統會提醒你喔！</p>
        <p className="text-muted-foreground text-sm">💡 假單還在「待審核」狀態時，可以在首頁點垃圾桶圖示刪除。</p>
      </Section>

      <Section icon={Calendar} title="📅 休假日曆">
        <Step n={1}>點左邊選單的「<b>休假日曆</b>」。</Step>
        <Step n={2}>日曆上會顯示所有人的休假狀況，用不同顏色區分。</Step>
        <Step n={3}>紅色的日期是<b>國定假日</b>，不用上班！</Step>
        <Step n={4}>點日曆上的標記可以看到詳細資訊。</Step>
      </Section>

      <Section icon={MessageCircle} title="📱 LINE 功能">
        <p className="font-medium mb-2">如何綁定 LINE：</p>
        <Step n={1}>加入公司的 LINE 官方帳號為好友。</Step>
        <Step n={2}>在聊天視窗輸入「<b>綁定 你的Email</b>」（例如：綁定 wang@company.com）。</Step>
        <Step n={3}>系統會回覆「綁定成功」，以後就能收到 LINE 通知了！</Step>

        <p className="font-medium mb-2 mt-4">LINE 指令大全：</p>
        <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
          <p>🔹 輸入「<b>申請休假</b>」→ 快速建立假單</p>
          <p>🔹 輸入「<b>查詢假期</b>」→ 查看你的待審核假單</p>
          <p>🔹 輸入「<b>當月休假</b>」→ 查看這個月所有人的休假</p>
          <p>🔹 輸入「<b>休假明細</b>」→ 查看你今年所有休假紀錄</p>
        </div>
      </Section>
    </div>
  );
}

function AdminGuide() {
  return (
    <div className="space-y-4">
      <Section icon={Settings} title="⚙️ 管理後台（審核假單）">
        <Step n={1}>點左邊選單的「<b>管理後台</b>」。</Step>
        <Step n={2}>上方會顯示統計數字：待審核、已核准、已拒絕的假單數量。</Step>
        <Step n={3}>在下方表格找到要審核的假單。</Step>
        <Step n={4}>
          點右邊的按鈕來操作：
          <ul className="list-disc ml-5 mt-1">
            <li>✅ <b>核准</b> — 同意這張假單</li>
            <li>❌ <b>拒絕</b> — 不同意這張假單</li>
            <li>✏️ <b>編輯</b> — 修改假單內容</li>
            <li>🗑️ <b>刪除</b> — 完全移除假單</li>
          </ul>
        </Step>
        <Step n={5}>審核後可以按「<b>發送 LINE 通知</b>」，讓員工在 LINE 收到結果。</Step>
      </Section>

      <Section icon={BarChart3} title="📊 休假餘額">
        <Step n={1}>點左邊選單的「<b>休假餘額</b>」。</Step>
        <Step n={2}>這裡顯示每位員工各種假別的使用狀況。</Step>
        <Step n={3}>
          顏色代表的意思：
          <ul className="list-disc ml-5 mt-1">
            <li>🟢 <b>綠色</b> — 假還很多，不用擔心</li>
            <li>🟡 <b>黃色</b> — 快要用完了，要注意</li>
            <li>🔴 <b>紅色</b> — 已經超過上限了！</li>
          </ul>
        </Step>
      </Section>

      <Section icon={ClipboardList} title="📜 休假條件（政策管理）">
        <Step n={1}>點左邊選單的「<b>休假條件</b>」。</Step>
        <Step n={2}>這裡設定每種假別的<b>年度天數上限</b>。</Step>
        <Step n={3}>可以開啟「<b>提醒功能</b>」，設定當員工剩餘天數低於某個數字時發出警告。</Step>
        <Step n={4}>修改後按「儲存」就會立刻生效。</Step>
      </Section>

      <Section icon={Users} title="👥 員工管理">
        <Step n={1}>點左邊選單的「<b>員工管理</b>」。</Step>
        <Step n={2}>這裡列出所有註冊的員工。</Step>
        <Step n={3}>點右邊的<b>鉛筆圖示</b>可以編輯員工的<b>部門</b>和<b>入職日期</b>。</Step>
        <Step n={4}>設定入職日期後，系統會自動計算年資和特休天數。</Step>
        <Step n={5}>可以點「角色」欄位旁的按鈕，將員工<b>升級為管理員</b>或<b>降回一般員工</b>。</Step>
        <p className="text-muted-foreground text-sm mt-2">⚠️ 變更角色前系統會跳出確認視窗，請仔細確認後再操作。</p>
      </Section>

      <Section icon={Bell} title="🔔 通知設置">
        <Step n={1}>點左邊選單的「<b>通知設置</b>」。</Step>
        <Step n={2}>可以設定<b>每日報告</b>和<b>每週報告</b>的自動發送時間。</Step>
        <Step n={3}>開啟開關後，系統會定時透過 LINE 發送休假統計給管理員。</Step>
        <Step n={4}>也可以按「<b>手動觸發</b>」按鈕立即發送一次報告。</Step>
      </Section>

      <Section icon={Image} title="🎨 LINE 圖文選單設定">
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
            <p>🔹 左上（申請休假）→ 類型：<b>文字</b>，內容：<code>申請休假</code></p>
            <p>🔹 右上（查詢假期）→ 類型：<b>文字</b>，內容：<code>查詢假期</code></p>
            <p>🔹 左下（當月休假）→ 類型：<b>文字</b>，內容：<code>當月休假</code></p>
            <p>🔹 中下（休假明細）→ 類型：<b>文字</b>，內容：<code>休假明細</code></p>
            <p>🔹 右下（網頁版請假）→ 類型：<b>連結</b>，網址：你的系統網址 + <code>/request-leave</code></p>
          </div>
        </Step>
        <Step n={8}>按「<b>儲存</b>」並「<b>開啟</b>」圖文選單，就完成了！</Step>
      </Section>

      <Section icon={Shield} title="🔐 管理員角色說明">
        <p>管理員和一般員工的差別：</p>
        <div className="bg-muted rounded-lg p-3 text-sm mt-2 space-y-1">
          <p>👤 <b>一般員工</b>：可以申請休假、查看日曆、使用 LINE 指令</p>
          <p>🛡️ <b>管理員</b>：除了員工功能外，還可以審核假單、管理員工、設定政策、管理通知、設定圖文選單、將其他人設為管理員</p>
        </div>
        <p className="text-muted-foreground text-sm mt-2">💡 新註冊的帳號預設是「一般員工」。需要由現有管理員在「員工管理」頁面升級。</p>
      </Section>
    </div>
  );
}

export default function UserGuide() {
  const { isAdmin } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">操作指南</h1>
          <p className="text-sm text-muted-foreground">一步一步教你使用休假管理系統</p>
        </div>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="employee">
          <TabsList className="mb-4">
            <TabsTrigger value="employee">👤 員工指南</TabsTrigger>
            <TabsTrigger value="admin">🛡️ 管理員指南</TabsTrigger>
          </TabsList>
          <TabsContent value="employee">
            <EmployeeGuide />
          </TabsContent>
          <TabsContent value="admin">
            <AdminGuide />
          </TabsContent>
        </Tabs>
      ) : (
        <EmployeeGuide />
      )}
    </div>
  );
}
