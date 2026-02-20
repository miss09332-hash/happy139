import {
  Users,
  CalendarDays,
  Bell,
  Send,
  Search,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchLeavesWithProfiles, LeaveWithProfile } from "@/lib/queries";
import { sendDailySummary } from "@/lib/line";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};
const statusLabels: Record<string, string> = { pending: "待審核", approved: "已核准", rejected: "已拒絕" };
const leaveTypeColors: Record<string, string> = {
  "特休": "bg-primary/10 text-primary",
  "病假": "bg-destructive/10 text-destructive",
  "事假": "bg-warning/10 text-warning",
  "婚假": "bg-accent/10 text-accent",
  "產假": "bg-info/10 text-info",
  "喪假": "bg-muted text-muted-foreground",
};

export default function Index() {
  const [search, setSearch] = useState("");
  const { isAdmin } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: todayLeaves = [] } = useQuery({
    queryKey: ["today-leaves", today],
    queryFn: () => fetchLeavesWithProfiles({ status: "approved", dateFrom: today, dateTo: today }),
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const filtered = todayLeaves.filter((r) =>
    r.profile_name.includes(search) || r.profile_department.includes(search)
  );

  const stats = [
    { label: "今日休假", value: todayLeaves.length, icon: Users, color: "text-primary" },
    { label: "待審核", value: pendingCount, icon: Clock, color: "text-warning" },
    { label: "今日日期", value: today, icon: CalendarDays, color: "text-accent", isDate: true },
  ];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">休假管理總覽</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={s.isDate ? "text-lg font-bold" : "text-2xl font-bold"}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {isAdmin && (
          <Button onClick={async () => {
            try {
              toast.loading("正在發送 LINE 通知...", { id: "line-send" });
              await sendDailySummary();
              toast.success("LINE 通知已發送", { id: "line-send" });
            } catch (err: any) {
              toast.error("發送失敗", { id: "line-send", description: err.message });
            }
          }} className="gap-2">
            <Send className="h-4 w-4" />發送 LINE 通知
          </Button>
        )}
        <Button variant="outline" asChild className="gap-2">
          <Link to="/request-leave"><CalendarDays className="h-4 w-4" />申請休假</Link>
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">今日休假員工</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋員工或部門..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">今日無人休假 🎉</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {r.profile_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{r.profile_name}</p>
                      <p className="text-sm text-muted-foreground">{r.profile_department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${leaveTypeColors[r.leave_type] ?? ""}`}>{r.leave_type}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {[
          { to: "/request-leave", label: "申請休假", desc: "提交新的休假申請" },
          { to: "/leave-calendar", label: "休假日曆", desc: "查看全公司休假排程" },
          ...(isAdmin ? [
            { to: "/admin", label: "管理後台", desc: "審核與管理休假申請" },
            { to: "/notification-settings", label: "通知設置", desc: "管理 LINE 通知偏好" },
          ] : []),
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="glass-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
