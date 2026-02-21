import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateAnnualLeaveDays, getMonthsOfService, formatHoursDisplay } from "@/lib/leaveCalculation";
import { sendLeaveBalanceReminder } from "@/lib/line";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Bell, BarChart3, MessageCircle } from "lucide-react";

interface EmployeeBalance {
  userId: string;
  name: string;
  department: string;
  hireDate: string | null;
  lineBound: boolean;
  dailyWorkHours: number;
  balances: { leaveType: string; totalHours: number; usedHours: number }[];
}

export default function LeaveBalance() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const { data: annualRules = [] } = useQuery({
    queryKey: ["annual-leave-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("annual_leave_rules")
        .select("min_months, max_months, days")
        .order("min_months");
      if (error) throw error;
      return data;
    },
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["leave-policies-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_policies")
        .select("*")
        .eq("is_active", true)
        .order("leave_type");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["leave-balance-employees", annualRules, policies],
    enabled: annualRules.length > 0 || policies.length > 0,
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, name, department, hire_date, line_user_id, daily_work_hours")
        .order("name");
      if (pErr) throw pErr;

      const year = new Date().getFullYear();
      const { data: leaves, error: lErr } = await supabase
        .from("leave_requests")
        .select("user_id, leave_type, start_date, end_date, hours")
        .in("status", ["approved", "pending"])
        .gte("start_date", `${year}-01-01`)
        .lte("start_date", `${year}-12-31`);
      if (lErr) throw lErr;

      // Sum used hours per user per leave type
      const usedMap = new Map<string, Map<string, number>>();
      for (const l of leaves ?? []) {
        // Use hours field if available, otherwise fall back to day calculation
        const hours = (l as any).hours
          ? Number((l as any).hours)
          : (Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1) * 8;
        if (!usedMap.has(l.user_id)) usedMap.set(l.user_id, new Map());
        const m = usedMap.get(l.user_id)!;
        m.set(l.leave_type, (m.get(l.leave_type) ?? 0) + hours);
      }

      return (profiles ?? []).map((p): EmployeeBalance => {
        const dwh = (p as any).daily_work_hours ?? 8;
        const months = p.hire_date ? getMonthsOfService(p.hire_date) : 0;
        const userUsed = usedMap.get(p.user_id) ?? new Map<string, number>();

        const balances = (policies ?? []).map((pol) => {
          const totalDays = pol.leave_type === "特休"
            ? calculateAnnualLeaveDays(months, annualRules)
            : pol.default_days;
          return {
            leaveType: pol.leave_type,
            totalHours: totalDays * dwh,
            usedHours: userUsed.get(pol.leave_type) ?? 0,
          };
        });

        return {
          userId: p.user_id,
          name: p.name,
          department: p.department,
          hireDate: p.hire_date,
          lineBound: !!p.line_user_id,
          dailyWorkHours: dwh,
          balances,
        };
      });
    },
  });

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.department.includes(search)
  );

  const getStatusColor = (used: number, total: number) => {
    if (total === 0) return "";
    const ratio = used / total;
    if (ratio > 1) return "text-red-600 font-bold";
    if (ratio >= 0.8) return "text-amber-600 font-semibold";
    return "text-emerald-600";
  };

  const handleSendReminder = async () => {
    setSending(true);
    try {
      await sendLeaveBalanceReminder();
      toast({ title: "已發送", description: "休假餘額提醒已透過 LINE 發送" });
    } catch (e: any) {
      toast({ title: "發送失敗", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">休假餘額追蹤</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} 年度各員工休假使用狀況（以小時計）
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋員工或部門..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-60"
            />
          </div>
          <Button onClick={handleSendReminder} disabled={sending} variant="outline">
            <Bell className="h-4 w-4 mr-1" />
            {sending ? "發送中..." : "發送提醒"}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="flex items-center gap-6 py-3 flex-wrap">
          <span className="text-sm text-muted-foreground">狀態說明：</span>
          <span className="flex items-center gap-1 text-sm text-emerald-600">● 正常</span>
          <span className="flex items-center gap-1 text-sm text-amber-600">● 即將用完 (≥80%)</span>
          <span className="flex items-center gap-1 text-sm text-red-600">● 超休 (&gt;100%)</span>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">載入中...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>員工休假餘額總覽</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">員工</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead className="text-center">工時</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      LINE
                    </div>
                  </TableHead>
                  {policies.map((p) => (
                    <TableHead key={p.id} className="text-center min-w-[120px]">
                      {p.leave_type}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.userId}>
                    <TableCell className="font-medium sticky left-0 bg-background">{emp.name}</TableCell>
                    <TableCell className="text-muted-foreground">{emp.department || "—"}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{emp.dailyWorkHours}h</TableCell>
                    <TableCell className="text-center">
                      {emp.lineBound ? (
                        <Badge variant="default" className="bg-emerald-500 text-xs">已綁定</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">未綁定</Badge>
                      )}
                    </TableCell>
                    {emp.balances.map((b, i) => (
                      <TableCell key={i} className={`text-center ${getStatusColor(b.usedHours, b.totalHours)}`}>
                        <div className="text-sm">
                          {formatHoursDisplay(b.usedHours, emp.dailyWorkHours)} / {formatHoursDisplay(b.totalHours, emp.dailyWorkHours)}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4 + policies.length} className="text-center text-muted-foreground py-8">
                      無符合條件的員工
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
