import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Palmtree } from "lucide-react";

interface LeavePolicy {
  id: string;
  leave_type: string;
  default_days: number;
  description: string;
  is_active: boolean;
}

export default function LeavePolicies() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeavePolicy | null>(null);
  const [form, setForm] = useState({ leave_type: "", default_days: 0, description: "" });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["leave-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_policies")
        .select("*")
        .order("leave_type");
      if (error) throw error;
      return data as LeavePolicy[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: { id?: string; leave_type: string; default_days: number; description: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from("leave_policies")
          .update({ leave_type: values.leave_type, default_days: values.default_days, description: values.description })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("leave_policies")
          .insert({ leave_type: values.leave_type, default_days: values.default_days, description: values.description });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-policies"] });
      toast({ title: editing ? "已更新" : "已新增", description: `假別「${form.leave_type}」已儲存` });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast({ title: "錯誤", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("leave_policies").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-policies"] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ leave_type: "", default_days: 7, description: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: LeavePolicy) => {
    setEditing(p);
    setForm({ leave_type: p.leave_type, default_days: p.default_days, description: p.description });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate({ id: editing?.id, ...form });
  };

  const leaveTypeColors: Record<string, string> = {
    "特休": "bg-blue-500", "病假": "bg-red-500", "事假": "bg-amber-500",
    "婚假": "bg-violet-500", "產假": "bg-cyan-500", "喪假": "bg-gray-500",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Palmtree className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">休假條件管理</h1>
            <p className="text-sm text-muted-foreground">設定各類假別的年度額度與說明</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> 新增假別</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "編輯假別" : "新增假別"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>假別名稱</Label>
                <Input
                  value={form.leave_type}
                  onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
                  placeholder="例如：特休"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>年度天數</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.default_days}
                  onChange={(e) => setForm((f) => ({ ...f, default_days: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>說明</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="假別用途說明"
                />
              </div>
              <Button type="submit" className="w-full" disabled={upsert.isPending}>
                {upsert.isPending ? "儲存中..." : "儲存"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">載入中...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {policies.map((p) => (
            <Card key={p.id} className={`transition-opacity ${!p.is_active ? "opacity-50" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${leaveTypeColors[p.leave_type] ?? "bg-muted-foreground"}`} />
                    <CardTitle className="text-lg">{p.leave_type}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(val) => toggleActive.mutate({ id: p.id, is_active: val })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{p.default_days} <span className="text-sm font-normal text-muted-foreground">天/年</span></div>
                <p className="text-sm text-muted-foreground mt-1">{p.description || "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
