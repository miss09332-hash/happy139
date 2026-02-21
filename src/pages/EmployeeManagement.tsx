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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Pencil, ShieldCheck, ShieldOff } from "lucide-react";
import { getMonthsOfService, calculateAnnualLeaveDays } from "@/lib/leaveCalculation";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  department: string;
  hire_date: string | null;
  daily_work_hours: number;
}

interface AnnualLeaveRule {
  min_months: number;
  max_months: number | null;
  days: number;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function EmployeeManagement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ department: "", hire_date: "", daily_work_hours: "8" });
  const [roleConfirm, setRoleConfirm] = useState<{ profile: Profile; action: "promote" | "demote" } | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, department, hire_date, daily_work_hours")
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

  const { data: userRoles = [] } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const isUserAdmin = (userId: string) =>
    userRoles.some((r) => r.user_id === userId && r.role === "admin");

  const updateProfile = useMutation({
    mutationFn: async ({ id, department, hire_date, daily_work_hours }: { id: string; department: string; hire_date: string; daily_work_hours: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department, hire_date: hire_date || null, daily_work_hours })
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

  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" as any });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
      toast.success("已升級為管理員");
      setRoleConfirm(null);
    },
    onError: (e: Error) => toast.error("操作失敗", { description: e.message }),
  });

  const demoteFromAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin" as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
      toast.success("已降為一般員工");
      setRoleConfirm(null);
    },
    onError: (e: Error) => toast.error("操作失敗", { description: e.message }),
  });

  const openEdit = (p: Profile) => {
    setEditingProfile(p);
    setForm({ department: p.department, hire_date: p.hire_date || "", daily_work_hours: String(p.daily_work_hours ?? 8) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    updateProfile.mutate({ id: editingProfile.id, department: form.department, hire_date: form.hire_date, daily_work_hours: Number(form.daily_work_hours) || 8 });
  };

  const handleRoleConfirm = () => {
    if (!roleConfirm) return;
    if (roleConfirm.action === "promote") {
      promoteToAdmin.mutate(roleConfirm.profile.user_id);
    } else {
      demoteFromAdmin.mutate(roleConfirm.profile.user_id);
    }
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
          <p className="text-sm text-muted-foreground">管理員工入職日期、部門資訊與角色</p>
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
                  <TableHead>每日工時</TableHead>
                  <TableHead>年資</TableHead>
                  <TableHead>特休天數</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead className="w-16">操作</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead className="w-16">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const info = getEmployeeInfo(p);
                  const admin = isUserAdmin(p.user_id);
                  const isSelf = p.user_id === user?.id;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.department || "—"}</TableCell>
                      <TableCell>{p.hire_date || "未設定"}</TableCell>
                      <TableCell>{p.daily_work_hours ?? 8}h</TableCell>
                      <TableCell>{info.yearsLabel ?? "—"}</TableCell>
                      <TableCell>
                        {info.annualDays !== null ? (
                          <span className="font-semibold text-primary">{info.annualDays} 天</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={admin ? "default" : "secondary"}>
                            {admin ? "管理員" : "員工"}
                          </Badge>
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={admin ? "降為員工" : "升為管理員"}
                              onClick={() =>
                                setRoleConfirm({
                                  profile: p,
                                  action: admin ? "demote" : "promote",
                                })
                              }
                            >
                              {admin ? (
                                <ShieldOff className="h-4 w-4 text-destructive" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                          )}
                        </div>
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

      {/* Edit profile dialog */}
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
            <div className="space-y-2">
              <Label>每日工時（小時）</Label>
              <Input
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={form.daily_work_hours}
                onChange={(e) => setForm((f) => ({ ...f, daily_work_hours: e.target.value }))}
                placeholder="8"
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "儲存中..." : "儲存"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role change confirmation */}
      <AlertDialog open={!!roleConfirm} onOpenChange={(open) => !open && setRoleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              確認{roleConfirm?.action === "promote" ? "升級" : "降級"}角色？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleConfirm?.action === "promote"
                ? `確定要將「${roleConfirm?.profile.name}」升級為管理員嗎？升級後該員工將擁有管理後台的所有權限。`
                : `確定要將「${roleConfirm?.profile.name}」降為一般員工嗎？降級後該員工將無法存取管理功能。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleConfirm}>
              確認{roleConfirm?.action === "promote" ? "升級" : "降級"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
