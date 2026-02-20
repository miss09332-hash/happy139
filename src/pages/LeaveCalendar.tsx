import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { leaveRequests } from "@/data/mockData";
import { StatusBadge, LeaveTypeBadge } from "@/components/StatusBadge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

export default function LeaveCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // Feb = 1
  const [selectedDate, setSelectedDate] = useState("2026-02-20");
  const [search, setSearch] = useState("");

  const totalDays = daysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();

  const formatDate = (d: number) => {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    return `${year}-${m}-${day}`;
  };

  const getLeavesForDate = (dateStr: string) =>
    leaveRequests.filter(
      (r) => r.status === "approved" && r.startDate <= dateStr && r.endDate >= dateStr
    );

  const selectedLeaves = leaveRequests
    .filter((r) => r.startDate <= selectedDate && r.endDate >= selectedDate)
    .filter((r) => r.employeeName.includes(search) || r.department.includes(search));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">休假日曆</h1>
        <p className="text-muted-foreground mt-1">查看全公司休假排程</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Calendar */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">{year} 年 {monthNames[month]}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(day);
                const leaves = getLeavesForDate(dateStr);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === "2026-02-20";

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center rounded-lg p-2 text-sm transition-colors hover:bg-secondary ${
                      isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                    } ${isToday && !isSelected ? "ring-2 ring-primary/30" : ""}`}
                  >
                    <span className="font-medium">{day}</span>
                    {leaves.length > 0 && (
                      <span className={`mt-0.5 text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {leaves.length}人
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leave list for selected date */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{selectedDate} 休假清單</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋員工..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {r.employeeName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{r.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{r.department}</p>
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LeaveTypeBadge type={r.leaveType} />
                      <span>{r.startDate} ~ {r.endDate}</span>
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
