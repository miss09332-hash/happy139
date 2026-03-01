import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Check, X, Send, Pencil, Save, Trash2, Clock, Download, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchLeavesWithProfiles, LeaveWithProfile } from "@/lib/queries";
import { sendDailySummary } from "@/lib/line";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatHoursDisplay } from "@/lib/leaveCalculation";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", approved: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive" };
const statusLabels: Record<string, string> = { pending: "待審核", approved: "已核准", rejected: "已拒絕" };
const leaveTypeColors: Record<string, string> = {
  "特休": "bg-primary/10 text-primary", "病假": "bg-destructive/10 text-destructive",
  "事假": "bg-warning/10 text-warning", "婚假": "bg-accent/10 text-accent",
  "產假": "bg-info/10 text-info", "喪假": "bg-muted text-muted-foreground",
};

export default function Admin() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editHours, setEditHours] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState("pending");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-leaves"],
    queryFn: () => fetchLeavesWithProfiles(),
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leave_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leaves"] });
      toast.success(`休假申請${status === "approved" ? "已核准" : "已拒絕"}`);
    },
    onError: (err: any) => toast.error("操作失敗", { description: err.message }),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, status, start_date, end_date, start_time, end_time, hours }: {
      id: string; status: string; start_date: string; end_date: string;
      start_time?: string; end_time?: string; hours?: number;
    }) => {
      const update: any = { status, start_date, end_date };
      if (start_time !== undefined) update.start_time = start_time;
      if (end_time !== undefined) update.end_time = end_time;
      if (hours !== undefined) update.hours = hours;
      const { error } = await supabase.from("leave_requests").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leaves"] });
      setEditing(false);
      toast.success("休假申請已更新");
    },
    onError: (err: any) => toast.error("更新失敗", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leave_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leaves"] });
      setSelectedId(null);
      toast.success("休假申請已刪除");
    },
    onError: (err: any) => toast.error("刪除失敗", { description: err.message }),
  });

  const notifyMutation = useMutation({
    mutationFn: async (leave: LeaveWithProfile) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("line_user_id")
        .eq("user_id", leave.user_id)
        .single();

      if (!profile?.line_user_id) throw new Error("該員工尚未綁定 LINE 帳號");

      const days = Math.ceil((new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / 86400000) + 1;
      const dateText = leave.start_date === leave.end_date ? leave.start_date : `${leave.start_date} ~ ${leave.end_date}`;
      const statusText = statusLabels[leave.status] ?? leave.status;
      const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

      const bodyContents: any[] = [
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "假別", size: "sm", color: "#AAAAAA", flex: 2 },
          { type: "text", text: leave.leave_type, size: "sm", color: "#333333", weight: "bold", flex: 5 },
        ]},
        { type: "separator", margin: "md", color: "#F0F0F0" },
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "日期", size: "sm", color: "#AAAAAA", flex: 2 },
          { type: "text", text: `${dateText} 共計${days}天`, size: "sm", color: "#333333", weight: "bold", flex: 5, wrap: true },
        ]},
      ];

      if (leave.hours) {
        bodyContents.push(
          { type: "separator", margin: "md", color: "#F0F0F0" },
          { type: "box", layout: "horizontal", margin: "md", contents: [
            { type: "text", text: "時數", size: "sm", color: "#AAAAAA", flex: 2 },
            { type: "text", text: `${leave.hours}h`, size: "sm", color: "#333333", weight: "bold", flex: 5 },
          ]},
        );
      }

      bodyContents.push(
        { type: "separator", margin: "md", color: "#F0F0F0" },
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "狀態", size: "sm", color: "#AAAAAA", flex: 2 },
          { type: "text", text: statusText, size: "sm", color: leave.status === "approved" ? "#22C55E" : leave.status === "rejected" ? "#EF4444" : "#F59E0B", weight: "bold", flex: 5 },
        ]},
        { type: "separator", margin: "md", color: "#F0F0F0" },
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "更新時間", size: "sm", color: "#AAAAAA", flex: 2 },
          { type: "text", text: now, size: "sm", color: "#333333", flex: 5, wrap: true },
        ]},
      );

      const bubble = {
        type: "bubble",
        header: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📝 休假申請更新", size: "xl", color: "#FFFFFF", weight: "bold" },
            { type: "text", text: "管理員已更新您的休假申請", size: "xs", color: "#FFFFFFCC", margin: "xs" },
          ],
          backgroundColor: "#3B82F6", paddingAll: "lg",
        },
        body: {
          type: "box", layout: "vertical", paddingAll: "lg",
          contents: bodyContents,
        },
        footer: {
          type: "box", layout: "vertical",
          contents: [{ type: "text", text: "✅ 此為系統自動通知", size: "xs", color: "#AAAAAA", align: "center" }],
          paddingAll: "md", backgroundColor: "#FAFAFA",
        },
        styles: { footer: { separator: true } },
      };

      const { error } = await supabase.functions.invoke("send-line-message", {
        body: { mode: "flex-push", to: profile.line_user_id, altText: `休假申請更新：${statusText}`, bubble },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("已通知員工"),
    onError: (err: any) => toast.error("通知失敗", { description: err.message }),
  });

  const selected = requests.find((r) => r.id === selectedId);

  const startEditing = () => {
    if (!selected) return;
    setEditStatus(selected.status);
    setEditStartDate(selected.start_date);
    setEditEndDate(selected.end_date);
    setEditStartTime(selected.start_time || "");
    setEditEndTime(selected.end_time || "");
    setEditHours(selected.hours ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    if (editStartDate > editEndDate) {
      toast.error("開始日期不能晚於結束日期");
      return;
    }
    editMutation.mutate({
      id: selected.id,
      status: editStatus,
      start_date: editStartDate,
      end_date: editEndDate,
      start_time: editStartTime || undefined,
      end_time: editEndTime || undefined,
      hours: editHours !== "" ? Number(editHours) : undefined,
    });
  };

  const filterByStatus = (status: string) => {
    let filtered = status === "all" ? requests : requests.filter((r) => r.status === status);
    filtered = filtered.filter((r) => r.profile_name.includes(search) || r.profile_department.includes(search));
    if (dateFrom) {
      const fromStr = format(dateFrom, "yyyy-MM-dd");
      filtered = filtered.filter((r) => r.start_date >= fromStr);
    }
    if (dateTo) {
      const toStr = format(dateTo, "yyyy-MM-dd");
      filtered = filtered.filter((r) => r.start_date <= toStr);
    }
    return filtered;
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const exportCSV = () => {
    const data = filterByStatus(activeTab);
    if (data.length === 0) {
      toast.error("目前無資料可匯出");
      return;
    }
    const headers = ["員工姓名", "部門", "假別", "開始日期", "結束日期", "開始時間", "結束時間", "時數", "狀態", "原因", "申請時間"];
    const rows = data.map((r) => [
      r.profile_name,
      r.profile_department,
      r.leave_type,
      r.start_date,
      r.end_date,
      r.start_time || "",
      r.end_time || "",
      r.hours != null ? String(r.hours) : "",
      statusLabels[r.status] ?? r.status,
      r.reason,
      new Date(r.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `休假紀錄_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV 已匯出");
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理後台</h1>
          <p className="text-muted-foreground mt-1">審核與管理休假申請</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" />匯出 CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={async () => {
            try {
              toast.loading("正在發送每日提醒...", { id: "line-daily" });
              await sendDailySummary();
              toast.success("每日休假提醒已發送", { id: "line-daily" });
            } catch (err: any) {
              toast.error("發送失敗", { id: "line-daily", description: err.message });
            }
          }}>
            <Send className="h-4 w-4" />發送每日提醒
          </Button>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">日期篩選：</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "開始日期"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground">～</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "yyyy-MM-dd") : "結束日期"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-muted-foreground">
            清除篩選
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">休假申請</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜尋員工..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">待審核</TabsTrigger>
                <TabsTrigger value="approved">已核准</TabsTrigger>
                <TabsTrigger value="rejected">已拒絕</TabsTrigger>
                <TabsTrigger value="all">全部</TabsTrigger>
              </TabsList>
              {["pending", "approved", "rejected", "all"].map((status) => (
                <TabsContent key={status} value={status}>
                  <div className="divide-y divide-border">
                    {filterByStatus(status).length === 0 ? (
                      <p className="text-center text-muted-foreground py-6 text-sm">無相關記錄</p>
                    ) : (
                      filterByStatus(status).map((r) => (
                        <button key={r.id} onClick={() => { setSelectedId(r.id); setEditing(false); }}
                          className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-secondary/50 rounded-lg transition-colors ${selectedId === r.id ? "bg-secondary" : ""}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">{r.profile_name.charAt(0)}</div>
                            <div>
                              <p className="font-medium text-sm">{r.profile_name}</p>
                              <p className="text-xs text-muted-foreground">{r.profile_department} · {r.start_date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${leaveTypeColors[r.leave_type] ?? ""}`}>{r.leave_type}</span>
                            {r.hours && (
                              <span className="text-xs text-muted-foreground">{r.hours}h</span>
                            )}
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">申請詳情</CardTitle>
              {selected && !editing && (
                <Button variant="ghost" size="icon" onClick={startEditing} title="編輯">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-center text-muted-foreground py-12 text-sm">請選擇一個申請來查看詳情</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">{selected.profile_name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold">{selected.profile_name}</p>
                    <p className="text-sm text-muted-foreground">{selected.profile_department}</p>
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">休假類型</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${leaveTypeColors[selected.leave_type] ?? ""}`}>{selected.leave_type}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">狀態</p>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">待審核</SelectItem>
                          <SelectItem value="approved">已核准</SelectItem>
                          <SelectItem value="rejected">已拒絕</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">開始日期</p>
                        <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">結束日期</p>
                        <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">開始時間</Label>
                        <Input value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} placeholder="09:00" />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">結束時間</Label>
                        <Input value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} placeholder="18:00" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">請假時數</Label>
                      <Input type="number" min={0} step={0.5} value={editHours} onChange={(e) => setEditHours(e.target.value ? Number(e.target.value) : "")} placeholder="8" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1 gap-2" onClick={saveEdit} disabled={editMutation.isPending}>
                        <Save className="h-4 w-4" />儲存
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>取消</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">休假類型</p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${leaveTypeColors[selected.leave_type] ?? ""}`}>{selected.leave_type}</span>
                      </div>
                      <div>
                        <p className="text-muted-foreground">狀態</p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${statusColors[selected.status]}`}>{statusLabels[selected.status]}</span>
                      </div>
                      <div><p className="text-muted-foreground">開始日期</p><p className="font-medium mt-1">{selected.start_date}</p></div>
                      <div><p className="text-muted-foreground">結束日期</p><p className="font-medium mt-1">{selected.end_date}</p></div>
                      {selected.start_time && (
                        <div><p className="text-muted-foreground">開始時間</p><p className="font-medium mt-1">{selected.start_time}</p></div>
                      )}
                      {selected.end_time && (
                        <div><p className="text-muted-foreground">結束時間</p><p className="font-medium mt-1">{selected.end_time}</p></div>
                      )}
                    </div>
                    {selected.hours && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        請假時數：{selected.hours}h（{formatHoursDisplay(selected.hours)}）
                      </div>
                    )}
                    <div className="text-sm"><p className="text-muted-foreground">休假原因</p><p className="mt-1">{selected.reason || "無"}</p></div>
                    <div className="text-sm"><p className="text-muted-foreground">最後更新</p><p className="mt-1">{new Date(selected.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</p></div>

                    {selected.status === "pending" && (
                      <div className="flex gap-3 pt-2">
                        <Button className="flex-1 gap-2" onClick={() => updateMutation.mutate({ id: selected.id, status: "approved" })}><Check className="h-4 w-4" />核准</Button>
                        <Button variant="destructive" className="flex-1 gap-2" onClick={() => updateMutation.mutate({ id: selected.id, status: "rejected" })}><X className="h-4 w-4" />拒絕</Button>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const latest = requests.find((r) => r.id === selectedId);
                        if (latest) notifyMutation.mutate(latest);
                      }}
                      disabled={notifyMutation.isPending}
                    >
                      <Send className="h-4 w-4" />通知員工已修改
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full gap-2">
                          <Trash2 className="h-4 w-4" />刪除此申請
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除 {selected.profile_name} 的「{selected.leave_type}」休假申請（{selected.start_date}）嗎？此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(selected.id)}
                          >
                            刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
