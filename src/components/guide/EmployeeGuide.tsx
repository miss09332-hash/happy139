import {
  LogIn, FileText, Calendar, MessageCircle,
  Key, Mail, Smartphone, CheckCircle, HelpCircle,
  ClipboardList, Search, CalendarDays, FileBarChart,
} from "lucide-react";
import { Section, Step, Tip, Warning, CommandBadge } from "./GuideComponents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmployeeGuide() {
  return (
    <div className="space-y-4">
      <Section icon={LogIn} title="註冊與登入">
        <Step n={1}>打開系統網址，會看到登入畫面。</Step>
        <Step n={2}>第一次使用？點上方的「<b>註冊</b>」分頁。</Step>
        <Step n={3}>
          填寫你的<b>姓名、Email、密碼</b>（密碼至少 6 個字）。
        </Step>
        <Step n={4}>按「註冊」按鈕，系統會自動幫你登入。</Step>
        <Step n={5}>之後每次回來，只要在「登入」分頁輸入 Email 和密碼就可以了。</Step>

        <Tip>
          <span className="flex items-center gap-1"><Key className="h-3.5 w-3.5" /> <b>密碼安全提示：</b></span>
          建議使用<b>英文 + 數字 + 符號</b>混合，至少 8 個字元以上，不要使用生日或簡單的密碼。
        </Tip>

        <Tip>
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> <b>忘記密碼怎麼辦？</b></span>
          登入頁面下方有「忘記密碼？」連結，點一下後輸入你的 Email，系統會寄一封重設密碼的信到你的信箱。打開信中的連結，設定新密碼就能重新登入了。
        </Tip>
      </Section>

      <Section icon={FileText} title="申請休假">
        <Step n={1}>點左邊選單的「<b>申請休假</b>」。</Step>
        <Step n={2}>選擇<b>假別</b>（參考下方表格）。</Step>
        <Step n={3}>用日曆選擇<b>開始日期</b>和<b>結束日期</b>。</Step>
        <Step n={4}>在「原因」欄位寫上請假原因。</Step>
        <Step n={5}>按「<b>提交申請</b>」按鈕送出。</Step>

        <p className="font-medium mt-3 mb-2 flex items-center gap-1.5"><ClipboardList className="h-4 w-4 text-primary" /> 常見假別說明：</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">假別</TableHead>
              <TableHead>說明</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell className="font-medium">特休</TableCell><TableCell>依年資計算，每年重新發放</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">病假</TableCell><TableCell>因病就醫或休養，每年上限 30 天</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">事假</TableCell><TableCell>因個人事務需請假，每年上限 14 天</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">喪假</TableCell><TableCell>親屬過世，依親等 3~8 天</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">公假</TableCell><TableCell>公務需要或法定義務（如投票）</TableCell></TableRow>
          </TableBody>
        </Table>

        <Warning>如果日期和之前的假單重疊，系統會提醒你喔！</Warning>
        <Tip>假單還在「待審核」狀態時，可以在首頁點垃圾桶圖示刪除。</Tip>
      </Section>

      <Section icon={Calendar} title="休假日曆">
        <Step n={1}>點左邊選單的「<b>休假日曆</b>」。</Step>
        <Step n={2}>日曆上會顯示所有人的休假狀況，用不同顏色區分。</Step>
        <Step n={3}>紅色的日期是<b>國定假日</b>，不用上班！</Step>
        <Step n={4}>點日曆上的標記可以看到詳細資訊。</Step>

        <p className="font-medium mt-3 mb-2 flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> 顏色圖例：</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> <span>已核准休假</span></div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-500" /> <span>待審核假單</span></div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> <span>國定假日</span></div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-gray-400" /> <span>已拒絕假單</span></div>
        </div>
      </Section>

      <Section icon={MessageCircle} title="LINE 功能">
        <p className="font-medium mb-2 flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" /> 如何綁定 LINE：</p>
        <Step n={1}>加入公司的 LINE 官方帳號為好友。</Step>
        <Step n={2}>在聊天視窗輸入「<CommandBadge>綁定 你的Email</CommandBadge>」（例如：綁定 wang@company.com）。</Step>
        <Step n={3}>
          <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> 系統會回覆「綁定成功」，以後就能收到 LINE 通知了！</span>
        </Step>

        <p className="font-medium mb-2 mt-4 flex items-center gap-1.5"><Search className="h-4 w-4 text-primary" /> LINE 指令大全：</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: FileText, cmd: "申請休假", desc: "快速建立假單" },
            { icon: Search, cmd: "查詢假期", desc: "查看你的待審核假單" },
            { icon: CalendarDays, cmd: "當月休假", desc: "查看這個月所有人的休假" },
            { icon: FileBarChart, cmd: "休假明細", desc: "查看你今年所有休假紀錄" },
          ].map(({ icon: I, cmd, desc }) => (
            <div key={cmd} className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3">
              <I className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <CommandBadge>{cmd}</CommandBadge>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Tip>
          你只要在訊息中<b>提到關鍵字</b>就會觸發功能，例如輸入「我想申請休假」也能執行。不需要打完整的指令！
        </Tip>

        <div className="mt-4 rounded-lg border p-3">
          <p className="font-medium flex items-center gap-1.5 mb-2"><HelpCircle className="h-4 w-4 text-primary" /> 綁定失敗怎麼辦？</p>
          <ul className="text-sm space-y-1 ml-5 list-disc text-muted-foreground">
            <li>確認 Email 拼寫正確，必須和系統註冊時一樣</li>
            <li>確認你已經完成系統註冊（先在網頁端註冊帳號）</li>
            <li>格式為「綁定 email」，綁定和 email 之間有一個空格</li>
            <li>如果還是不行，請聯絡管理員協助</li>
          </ul>
        </div>
      </Section>
    </div>
  );
}
