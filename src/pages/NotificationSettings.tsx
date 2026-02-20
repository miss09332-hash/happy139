import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, Save, Send, CalendarDays, CalendarRange, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  sendDailySummary,
  sendWeeklySummary,
  sendNextWeekSummary,
  sendMonthlyLeaveList,
  sendLeaveBalanceReminder,
} from "@/lib/line";

interface NotificationSetting {
  id: string;
  setting_key: string;
  enabled: boolean;
  schedule_time: string;
}

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*");
      if (error) throw error;
      return data as NotificationSetting[];
    },
  });

  const getSetting = (key: string) => settings.find((s) => s.setting_key === key);

  const updateMutation = useMutation({
    mutationFn: async ({ key, enabled, schedule_time }: { key: string; enabled?: boolean; schedule_time?: string }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (enabled !== undefined) updates.enabled = enabled;
      if (schedule_time !== undefined) updates.schedule_time = schedule_time;
      const { error } = await supabase
        .from("notification_settings")
        .update(updates)
        .eq("setting_key", key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-settings"] }),
  });

  const handleToggle = (key: string, enabled: boolean) => {
    updateMutation.mutate({ key, enabled });
  };

  const handleTimeChange = (key: string, schedule_time: string) => {
    updateMutation.mutate({ key, schedule_time });
  };

  const handleSave = () => {
    toast.success("通知設置已儲存");
  };

  const handleSend = async (label: string, fn: () => Promise<any>, id: string) => {
    try {
      toast.loading(`正在發送${label}...`, { id });
      await fn();
      toast.success(`${label}已發送`, { id });
    } catch (err: any) {
      toast.error("發送失敗", { id, description: err.message });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">載入中...</div>;
  }

  const daily = getSetting("daily_reminder");
  const weekly = getSetting("weekly_reminder");
  const monthly = getSetting("monthly_reminder");
  const balance = getSetting("balance_reminder");

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
            <p className="text-sm text-muted-foreground">立即發送 Flex Message 格式的休假提醒至 LINE（不受自動開關影響）</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleSend("今日休假提醒", sendDailySummary, "line-daily")} className="gap-2">
                <Clock className="h-4 w-4" />今日休假
              </Button>
              <Button onClick={() => handleSend("本週休假總覽", sendWeeklySummary, "line-weekly")} variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />本週休假
              </Button>
              <Button onClick={() => handleSend("下週休假總覽", sendNextWeekSummary, "line-next-week")} variant="outline" className="gap-2">
                <CalendarRange className="h-4 w-4" />下週休假
              </Button>
              <Button onClick={() => handleSend("當月休假明細", sendMonthlyLeaveList, "line-monthly")} variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />當月休假
              </Button>
              <Button onClick={() => handleSend("休假餘額提醒", sendLeaveBalanceReminder, "line-balance")} variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />餘額提醒
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto Schedule Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              自動發送排程
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Daily */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">每日休假提醒</p>
                <p className="text-xs text-muted-foreground">每天自動發送當日休假員工清單</p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={daily?.schedule_time ?? "08:00"}
                  onChange={(e) => handleTimeChange("daily_reminder", e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <Switch
                  checked={daily?.enabled ?? false}
                  onCheckedChange={(v) => handleToggle("daily_reminder", v)}
                />
              </div>
            </div>

            {/* Weekly */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">每週休假總覽</p>
                <p className="text-xs text-muted-foreground">每週一自動發送本週休假總覽</p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={weekly?.schedule_time ?? "08:00"}
                  onChange={(e) => handleTimeChange("weekly_reminder", e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <Switch
                  checked={weekly?.enabled ?? false}
                  onCheckedChange={(v) => handleToggle("weekly_reminder", v)}
                />
              </div>
            </div>

            {/* Monthly */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">每月休假統計</p>
                <p className="text-xs text-muted-foreground">每月 1 號自動發送上月統計</p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={monthly?.schedule_time ?? "08:00"}
                  onChange={(e) => handleTimeChange("monthly_reminder", e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <Switch
                  checked={monthly?.enabled ?? false}
                  onCheckedChange={(v) => handleToggle("monthly_reminder", v)}
                />
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">休假餘額自動提醒</p>
                <p className="text-xs text-muted-foreground">定期自動發送休假餘額報告給員工</p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={balance?.schedule_time ?? "08:00"}
                  onChange={(e) => handleTimeChange("balance_reminder", e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <Switch
                  checked={balance?.enabled ?? false}
                  onCheckedChange={(v) => handleToggle("balance_reminder", v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
