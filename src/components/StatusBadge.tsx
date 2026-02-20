import { cn } from "@/lib/utils";
import { LeaveStatus, LeaveType, statusColors, statusLabels, leaveTypeColors } from "@/data/mockData";

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[status])}>
      {statusLabels[status]}
    </span>
  );
}

export function LeaveTypeBadge({ type }: { type: LeaveType }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", leaveTypeColors[type])}>
      {type}
    </span>
  );
}
