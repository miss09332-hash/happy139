import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, BellOff, Save, Send, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { sendDailySummary, sendWeeklySummary } from "@/lib/line";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    dailyReminder: true,
    reminderTime: "08:00",
    newLeaveNotify: true,
    approvalNotify: true,
    dndStart: "22:00",
    dndEnd: "07:00",
    dndEnabled: true,
  });

  const handleSave = () => {
    toast.success("通知設置已儲存");
  };

  const handleSendDaily = async () => {
    try {
      toast.loading("正在發送今日休假提醒...", { id: "line-daily" });
      await sendDailySummary();
      toast.success("今日休假提醒已發送", { id: "line-daily" });
    } catch (err: any) {
      toast.error("發送失敗", { id: "line-daily", description: err.message });
    }
  };

  const handleSendWeekly = async () => {
    try {
      toast.loading("正在發送本週休假總覽...", { id: "line-weekly" });
      await sendWeeklySummary();
      toast.success("本週休假總覽已發送", { id: "line-weekly" });
    } catch (err: any) {
      toast.error("發送失敗", { id: "line-weekly", description: err.message });
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">通知設置</h1>
        <p className="text-muted-foreground mt-1">管理 LINE 通知與提醒偏好</p>
      </div>

      <div className="space-y-6">
        {/* Manual Send */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              手動發送通知
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">立即發送 Flex Message 格式的休假提醒至 LINE</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSendDaily} className="gap-2">
                <Clock className="h-4 w-4" />今日休假提醒
              </Button>
              <Button onClick={handleSendWeekly} variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />本週休假總覽
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Reminder */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              每日休假提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">啟用每日提醒</p>
                <p className="text-xs text-muted-foreground">每天自動發送當日休假員工清單</p>
              </div>
              <Switch
                checked={settings.dailyReminder}
                onCheckedChange={(v) => setSettings({ ...settings, dailyReminder: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>提醒時間</Label>
              <Input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
                className="w-40"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              通知類型
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">新休假申請通知</p>
                <p className="text-xs text-muted-foreground">員工提交休假申請時通知</p>
              </div>
              <Switch
                checked={settings.newLeaveNotify}
                onCheckedChange={(v) => setSettings({ ...settings, newLeaveNotify: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">審核結果通知</p>
                <p className="text-xs text-muted-foreground">休假申請被核准或拒絕時通知</p>
              </div>
              <Switch
                checked={settings.approvalNotify}
                onCheckedChange={(v) => setSettings({ ...settings, approvalNotify: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* DND */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BellOff className="h-5 w-5 text-primary" />
              免打擾時間
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">啟用免打擾</p>
                <p className="text-xs text-muted-foreground">在指定時間內不發送通知</p>
              </div>
              <Switch
                checked={settings.dndEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, dndEnabled: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>開始時間</Label>
                <Input
                  type="time"
                  value={settings.dndStart}
                  onChange={(e) => setSettings({ ...settings, dndStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>結束時間</Label>
                <Input
                  type="time"
                  value={settings.dndEnd}
                  onChange={(e) => setSettings({ ...settings, dndEnd: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          儲存設置
        </Button>
      </div>
    </div>
  );
}
