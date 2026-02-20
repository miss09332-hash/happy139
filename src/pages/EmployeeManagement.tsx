import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Users, Pencil } from "lucide-react";
import { getMonthsOfService, calculateAnnualLeaveDays } from "@/lib/leaveCalculation";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  department: string;
  hire_date: string | null;
}

interface AnnualLeaveRule {
  min_months: number;
  max_months: number | null;
  days: number;
}

export default function EmployeeManagement() {
  const qc = useQueryClient();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ department: "", hire_date: "" });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, department, hire_date")
        .order("name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["annual-leave-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("annual_leave_rules")
        .select("min_months, max_months, days")
        .order("min_months");
      if (error) throw error;
      return data as AnnualLeaveRule[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, department, hire_date }: { id: string; department: string; hire_date: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department, hire_date: hire_date || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
      toast.success("員工資料已更新");
      setEditingProfile(null);
    },
    onError: (e: Error) => toast.error("更新失敗", { description: e.message }),
  });

  const openEdit = (p: Profile) => {
    setEditingProfile(p);
    setForm({ department: p.department, hire_date: p.hire_date || "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    updateProfile.mutate({ id: editingProfile.id, ...form });
  };

  const getEmployeeInfo = (p: Profile) => {
    if (!p.hire_date) return { months: null, years: null, annualDays: null };
    const months = getMonthsOfService(p.hire_date);
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    const annualDays = calculateAnnualLeaveDays(months, rules);
    return { months, yearsLabel: `${years}年${remMonths}月`, annualDays };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">員工管理</h1>
          <p className="text-sm text-muted-foreground">管理員工入職日期與部門資訊</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>員工列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>入職日期</TableHead>
                  <TableHead>年資</TableHead>
                  <TableHead>特休天數</TableHead>
                  <TableHead className="w-16">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const info = getEmployeeInfo(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.department || "—"}</TableCell>
                      <TableCell>{p.hire_date || "未設定"}</TableCell>
                      <TableCell>{info.yearsLabel ?? "—"}</TableCell>
                      <TableCell>
                        {info.annualDays !== null ? (
                          <span className="font-semibold text-primary">{info.annualDays} 天</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯員工：{editingProfile?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>部門</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="例如：工程部"
              />
            </div>
            <div className="space-y-2">
              <Label>入職日期</Label>
              <Input
                type="date"
                value={form.hire_date}
                onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "儲存中..." : "儲存"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
