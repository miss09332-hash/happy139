import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Palmtree, Bell, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LeavePolicy {
  id: string;
  leave_type: string;
  default_days: number;
  description: string;
  is_active: boolean;
  reminder_threshold_days: number;
  reminder_enabled: boolean;
  category: string;
  sort_order: number;
}

const CATEGORIES = ["常用", "特殊", "其他"];

const leaveTypeColors: Record<string, string> = {
  "特休": "bg-blue-500", "病假": "bg-red-500", "事假": "bg-amber-500",
  "婚假": "bg-violet-500", "產假": "bg-cyan-500", "喪假": "bg-gray-500",
};

function SortablePolicyCard({
  policy,
  onEdit,
  onToggleActive,
}: {
  policy: LeavePolicy;
  onEdit: (p: LeavePolicy) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: policy.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${!policy.is_active ? "opacity-50" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className={`inline-block w-3 h-3 rounded-full ${leaveTypeColors[policy.leave_type] ?? "bg-muted-foreground"}`} />
            <CardTitle className="text-lg">{policy.leave_type}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(policy)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Switch
              checked={policy.is_active}
              onCheckedChange={(val) => onToggleActive(policy.id, val)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{policy.default_days} <span className="text-sm font-normal text-muted-foreground">天/年</span></div>
        <p className="text-sm text-muted-foreground mt-1">{policy.description || "—"}</p>
        {policy.reminder_enabled && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" /> 已休 {policy.reminder_threshold_days} 天時提醒
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function LeavePolicies() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeavePolicy | null>(null);
  const [form, setForm] = useState({ leave_type: "", default_days: 0, description: "", reminder_threshold_days: 0, reminder_enabled: false, category: "常用", sort_order: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["leave-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_policies")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data as LeavePolicy[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: { id?: string; leave_type: string; default_days: number; description: string; reminder_threshold_days: number; reminder_enabled: boolean; category: string; sort_order: number }) => {
      const payload = { leave_type: values.leave_type, default_days: values.default_days, description: values.description, reminder_threshold_days: values.reminder_threshold_days, reminder_enabled: values.reminder_enabled, category: values.category, sort_order: values.sort_order };
      if (values.id) {
        const { error } = await supabase.from("leave_policies").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leave_policies").insert(payload);
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

  const batchUpdateOrder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from("leave_policies").update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-policies"] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ leave_type: "", default_days: 7, description: "", reminder_threshold_days: 0, reminder_enabled: false, category: "常用", sort_order: 0 });
    setDialogOpen(true);
  };

  const openEdit = (p: LeavePolicy) => {
    setEditing(p);
    setForm({ leave_type: p.leave_type, default_days: p.default_days, description: p.description, reminder_threshold_days: p.reminder_threshold_days, reminder_enabled: p.reminder_enabled, category: p.category, sort_order: p.sort_order });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate({ id: editing?.id, ...form });
  };

  // Group policies by category
  const grouped = policies.reduce<Record<string, LeavePolicy[]>>((acc, p) => {
    const cat = p.category || "常用";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const handleDragEnd = (category: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const catPolicies = grouped[category];
    if (!catPolicies) return;

    const oldIndex = catPolicies.findIndex((p) => p.id === active.id);
    const newIndex = catPolicies.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(catPolicies, oldIndex, newIndex);
    const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
    batchUpdateOrder.mutate(updates);
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>分類</Label>
                  <Select value={form.category} onValueChange={(val) => setForm((f) => ({ ...f, category: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>排序</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </div>
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
              <div className="space-y-2">
                <Label>提醒門檻（已休天數達此值時提醒）</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.reminder_threshold_days}
                  onChange={(e) => setForm((f) => ({ ...f, reminder_threshold_days: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>啟用自動提醒</Label>
                <Switch
                  checked={form.reminder_enabled}
                  onCheckedChange={(val) => setForm((f) => ({ ...f, reminder_enabled: val }))}
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
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, catPolicies]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">{category}</h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(category)}
              >
                <SortableContext items={catPolicies.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {catPolicies.map((p) => (
                      <SortablePolicyCard
                        key={p.id}
                        policy={p}
                        onEdit={openEdit}
                        onToggleActive={(id, val) => toggleActive.mutate({ id, is_active: val })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
