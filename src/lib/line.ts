import { supabase } from "@/integrations/supabase/client";

export async function sendLineMessage(to: string, message: string) {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { to, message },
  });
  if (error) throw error;
  return data;
}

export async function sendDailySummary() {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { mode: "daily-summary" },
  });
  if (error) throw error;
  return data;
}

export async function sendWeeklySummary() {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { mode: "weekly-summary" },
  });
  if (error) throw error;
  return data;
}

export async function sendNextWeekSummary() {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { mode: "next-week-summary" },
  });
  if (error) throw error;
  return data;
}

export async function sendMonthlyLeaveList() {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { mode: "monthly-leave-list" },
  });
  if (error) throw error;
  return data;
}

export async function sendLeaveBalanceReminder() {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { mode: "leave-balance-reminder" },
  });
  if (error) throw error;
  return data;
}
