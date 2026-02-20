import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leaveRequests, LeaveRequest } from "@/data/mockData";
import { StatusBadge, LeaveTypeBadge } from "@/components/StatusBadge";
import { Search, Check, X, Send } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const [requests, setRequests] = useState<LeaveRequest[]>(leaveRequests);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LeaveRequest | null>(null);

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
    const label = action === "approved" ? "已核准" : "已拒絕";
    toast.success(`休假申請${label}`, { description: "已發送 LINE 通知給申請人" });
    if (selected?.id === id) setSelected({ ...selected!, status: action });
  };

  const filterByStatus = (status: string) => {
    const filtered = status === "all" ? requests : requests.filter((r) => r.status === status);
    return filtered.filter(
      (r) => r.employeeName.includes(search) || r.department.includes(search)
    );
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理後台</h1>
          <p className="text-muted-foreground mt-1">審核與管理休假申請</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => toast.success("每日休假提醒已發送至 LINE 群組")}
        >
          <Send className="h-4 w-4" />
          發送每日提醒
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* List */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">休假申請</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋員工..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
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
                        <button
                          key={r.id}
                          onClick={() => setSelected(r)}
                          className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-secondary/50 rounded-lg transition-colors ${
                            selected?.id === r.id ? "bg-secondary" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {r.employeeName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{r.employeeName}</p>
                              <p className="text-xs text-muted-foreground">
                                {r.department} · {r.startDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <LeaveTypeBadge type={r.leaveType} />
                            <StatusBadge status={r.status} />
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

        {/* Detail */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">申請詳情</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-center text-muted-foreground py-12 text-sm">請選擇一個申請來查看詳情</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {selected.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{selected.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{selected.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">休假類型</p>
                    <div className="mt-1"><LeaveTypeBadge type={selected.leaveType} /></div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">狀態</p>
                    <div className="mt-1"><StatusBadge status={selected.status} /></div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">開始日期</p>
                    <p className="font-medium mt-1">{selected.startDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">結束日期</p>
                    <p className="font-medium mt-1">{selected.endDate}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">休假原因</p>
                  <p className="mt-1">{selected.reason}</p>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">申請日期</p>
                  <p className="mt-1">{selected.createdAt}</p>
                </div>

                {selected.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleAction(selected.id, "approved")}
                    >
                      <Check className="h-4 w-4" />
                      核准
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => handleAction(selected.id, "rejected")}
                    >
                      <X className="h-4 w-4" />
                      拒絕
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
