import { supabase } from "@/integrations/supabase/client";

export interface LeaveWithProfile {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
  profile_name: string;
  profile_department: string;
}

export async function fetchLeavesWithProfiles(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<LeaveWithProfile[]> {
  let query = supabase.from("leave_requests").select("*");
  
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.dateFrom) query = query.lte("start_date", filters.dateTo ?? filters.dateFrom);
  if (filters?.dateTo) query = query.gte("end_date", filters.dateFrom ?? filters.dateTo);

  const { data: leaves, error: lErr } = await query.order("created_at", { ascending: false });
  if (lErr) throw lErr;
  if (!leaves?.length) return [];

  const userIds = [...new Set(leaves.map((l) => l.user_id))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("user_id, name, department")
    .in("user_id", userIds);
  if (pErr) throw pErr;

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  return leaves.map((l) => {
    const p = profileMap.get(l.user_id);
    return {
      ...l,
      profile_name: p?.name ?? "未知",
      profile_department: p?.department ?? "",
    };
  });
}
