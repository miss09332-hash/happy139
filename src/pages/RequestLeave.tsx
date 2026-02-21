import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, CalendarDays, Trash2, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const leaveTypes = ["特休", "病假", "事假", "婚假", "產假", "喪假"] as const;

const statusLabels: Record<string, string> = { pending: "待審核", approved: "已核准", rejected: "已拒絕" };
const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", approved: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive" };

export default function RequestLeave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: myLeaves = [] } = useQuery({
    queryKey: ["my-leaves", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leave_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      toast.success("休假申請已刪除");
    },
    onError: (err: any) => toast.error("刪除失敗", { description: err.message }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveType || !form.startDate || !form.endDate) {
      toast.error("請填寫所有必要欄位");
      return;
    }
    if (form.startDate > form.endDate) {
      toast.error("結束日期不能早於開始日期");
      return;
    }
    setSubmitting(true);
    try {
      const { data: overlapping } = await supabase
        .from("leave_requests")
        .select("id, leave_type, start_date, end_date")
        .eq("user_id", user!.id)
        .in("status", ["pending", "approved"])
        .lte("start_date", form.endDate)
        .gte("end_date", form.startDate);

      if (overlapping && overlapping.length > 0) {
        const existing = overlapping[0];
        toast.error("日期重疊", {
          description: `您已有一筆「${existing.leave_type}」假單（${existing.start_date} ~ ${existing.end_date}）與此日期重疊，無法重複申請。`,
        });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("leave_requests").insert({
        user_id: user!.id,
        leave_type: form.leaveType,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason,
      });
      if (error) throw error;
      toast.success("休假申請已提交");
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });

      // Notify admin via LINE
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, department")
        .eq("user_id", user!.id)
        .maybeSingle();
      supabase.functions.invoke("send-line-message", {
        body: {
          mode: "new-request",
          employeeName: profile?.name || "未知",
          department: profile?.department || "",
          leaveType: form.leaveType,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
        },
      }).catch(() => {});
    } catch (err: any) {
      toast.error("提交失敗", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">申請休假</h1>
        <p className="text-muted-foreground mt-1 text-sm">填寫以下表單提交休假申請</p>
      </div>

      <Card className="glass-card mb-6">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            休假申請表
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>休假類型</Label>
              <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇休假類型" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>開始日期</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>結束日期</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>休假原因</Label>
              <Textarea
                placeholder="請填寫休假原因..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "提交中..." : "提交申請"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My leave requests list */}
      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">我的休假申請</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {myLeaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">尚無休假申請</p>
          ) : (
            <div className="space-y-3">
              {myLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{leave.leave_type}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[leave.status]}`}>
                        {statusLabels[leave.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {leave.start_date === leave.end_date ? leave.start_date : `${leave.start_date} ~ ${leave.end_date}`}
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{leave.reason}</p>
                    )}
                  </div>
                  {leave.status === "pending" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 ml-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除這筆「{leave.leave_type}」休假申請（{leave.start_date}）嗎？此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(leave.id)}
                          >
                            刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
