import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Clock, MessageSquare, BellOff, Save } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    dailyReminder: true,
    reminderTime: "08:00",
    lineChannel: "全公司群組",
    newLeaveNotify: true,
    approvalNotify: true,
    dndStart: "22:00",
    dndEnd: "07:00",
    dndEnabled: true,
  });

  const handleSave = () => {
    toast.success("通知設置已儲存");
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">通知設置</h1>
        <p className="text-muted-foreground mt-1">管理 LINE 通知與提醒偏好</p>
      </div>

      <div className="space-y-6">
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

        {/* Channel */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              通知頻道
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LINE 群組</Label>
              <Select
                value={settings.lineChannel}
                onValueChange={(v) => setSettings({ ...settings, lineChannel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全公司群組">全公司群組</SelectItem>
                  <SelectItem value="管理層群組">管理層群組</SelectItem>
                  <SelectItem value="HR群組">HR 群組</SelectItem>
                </SelectContent>
              </Select>
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
