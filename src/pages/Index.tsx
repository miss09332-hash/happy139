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
import { leaveRequests } from "@/data/mockData";
import { StatusBadge, LeaveTypeBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const todayLeaves = leaveRequests.filter(
  (r) => r.status === "approved" && r.startDate <= "2026-02-20" && r.endDate >= "2026-02-20"
);

const stats = [
  { label: "今日休假", value: todayLeaves.length, icon: Users, color: "text-primary" },
  { label: "待審核", value: leaveRequests.filter((r) => r.status === "pending").length, icon: Clock, color: "text-warning" },
  { label: "本月總休假", value: leaveRequests.length, icon: CalendarDays, color: "text-accent" },
];

export default function Index() {
  const [search, setSearch] = useState("");

  const filtered = todayLeaves.filter((r) =>
    r.employeeName.includes(search) || r.department.includes(search)
  );

  const handleLineNotify = () => {
    toast.success("LINE 通知已發送", {
      description: `已通知今日 ${todayLeaves.length} 位員工休假`,
    });
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">休假管理總覽</h1>
        <p className="text-muted-foreground mt-1">2026 年 2 月 20 日，星期五</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button onClick={handleLineNotify} className="gap-2">
          <Send className="h-4 w-4" />
          發送 LINE 通知
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/request-leave">
            <CalendarDays className="h-4 w-4" />
            申請休假
          </Link>
        </Button>
        <Button variant="outline" asChild className="gap-2">
          <Link to="/notification-settings">
            <Bell className="h-4 w-4" />
            通知設置
          </Link>
        </Button>
      </div>

      {/* Today's leaves */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">今日休假員工</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋員工或部門..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
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
                      {r.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{r.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{r.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <LeaveTypeBadge type={r.leaveType} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
        {[
          { to: "/request-leave", label: "申請休假", desc: "提交新的休假申請" },
          { to: "/leave-calendar", label: "休假日曆", desc: "查看全公司休假排程" },
          { to: "/admin", label: "管理後台", desc: "審核與管理休假申請" },
          { to: "/notification-settings", label: "通知設置", desc: "管理 LINE 通知偏好" },
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
