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
import { Send, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const leaveTypes = ["特休", "病假", "事假", "婚假", "產假", "喪假"] as const;

export default function RequestLeave() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveType || !form.startDate || !form.endDate) {
      toast.error("請填寫所有必要欄位");
      return;
    }
    setSubmitting(true);
    try {
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
      }).catch(() => {}); // fire-and-forget
    } catch (err: any) {
      toast.error("提交失敗", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">申請休假</h1>
        <p className="text-muted-foreground mt-1">填寫以下表單提交休假申請</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            休假申請表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}
