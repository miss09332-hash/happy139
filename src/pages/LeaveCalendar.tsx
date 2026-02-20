import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchLeavesWithProfiles } from "@/lib/queries";
import { getHolidayName } from "@/lib/taiwanHolidays";

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const dayNames = ["一", "二", "三", "四", "五", "六", "日"];

const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", approved: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive" };
const statusLabels: Record<string, string> = { pending: "待審核", approved: "已核准", rejected: "已拒絕" };
const leaveTypeColors: Record<string, string> = {
  "特休": "bg-primary/10 text-primary", "病假": "bg-destructive/10 text-destructive",
  "事假": "bg-warning/10 text-warning", "婚假": "bg-accent/10 text-accent",
  "產假": "bg-info/10 text-info", "喪假": "bg-muted text-muted-foreground",
};

export default function LeaveCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  const totalDays = daysInMonth(year, month);
  // Monday-start: convert Sunday(0) to 6, others subtract 1
  const rawDay = new Date(year, month, 1).getDay();
  const firstDay = rawDay === 0 ? 6 : rawDay - 1;
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;

  const { data: monthLeaves = [] } = useQuery({
    queryKey: ["month-leaves", monthStart, monthEnd],
    queryFn: () => fetchLeavesWithProfiles({ status: "approved", dateFrom: monthStart, dateTo: monthEnd }),
  });

  const formatDate = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const getLeavesForDate = (dateStr: string) => monthLeaves.filter((r) => r.start_date <= dateStr && r.end_date >= dateStr);

  const isWeekend = (day: number) => {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
  };

  const selectedLeaves = monthLeaves
    .filter((r) => r.start_date <= selectedDate && r.end_date >= selectedDate)
    .filter((r) => r.profile_name.includes(search) || r.profile_department.includes(search));

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };
  const todayStr = now.toISOString().split("T")[0];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">休假日曆</h1>
        <p className="text-muted-foreground mt-1">查看全公司休假排程</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-lg">{year} 年 {monthNames[month]}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((d, i) => (
                <div key={d} className={`text-center text-xs font-medium py-2 ${i >= 5 ? "text-destructive" : "text-muted-foreground"}`}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(day);
                const leaves = getLeavesForDate(dateStr);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const weekend = isWeekend(day);
                const holiday = getHolidayName(dateStr);
                const isRedDay = weekend || !!holiday;
                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center rounded-lg p-1.5 text-sm transition-colors hover:bg-secondary ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""} ${isToday && !isSelected ? "ring-2 ring-primary/30" : ""}`}>
                    <span className={`font-medium ${!isSelected && isRedDay ? "text-destructive" : ""}`}>{day}</span>
                    {holiday && (
                      <span className={`text-[8px] leading-tight truncate w-full text-center ${isSelected ? "text-primary-foreground/80" : "text-destructive/70"}`}>{holiday}</span>
                    )}
                    {leaves.length > 0 && <span className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{leaves.length}人</span>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{selectedDate} 休假清單</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋員工..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {selectedLeaves.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">此日無休假記錄</p>
            ) : (
              <div className="space-y-3">
                {selectedLeaves.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">{r.profile_name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-sm">{r.profile_name}</p>
                          <p className="text-xs text-muted-foreground">{r.profile_department}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${leaveTypeColors[r.leave_type] ?? ""}`}>{r.leave_type}</span>
                      <span>{r.start_date} ~ {r.end_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
