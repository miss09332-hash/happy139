import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeaveEntry {
  name: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
}

function buildFlexBubble(
  title: string,
  subtitle: string,
  emoji: string,
  accentColor: string,
  entries: LeaveEntry[],
  pendingCount: number
): object {
  const entryBoxes = entries.length === 0
    ? [{
        type: "box",
        layout: "vertical",
        contents: [{
          type: "text",
          text: "🎉 無人休假",
          size: "md",
          color: "#4CAF50",
          align: "center",
          margin: "xl",
        }],
        paddingAll: "lg",
      }]
    : entries.map((e, i) => ({
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: e.name.charAt(0),
                size: "sm",
                color: "#FFFFFF",
                align: "center",
                gravity: "center",
              },
            ],
            width: "36px",
            height: "36px",
            cornerRadius: "18px",
            backgroundColor: accentColor,
            justifyContent: "center",
            alignItems: "center",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `${e.name}　${e.department ? `(${e.department})` : ""}`,
                size: "sm",
                color: "#333333",
                weight: "bold",
                wrap: true,
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [{
                      type: "text",
                      text: e.leaveType,
                      size: "xxs",
                      color: "#FFFFFF",
                      align: "center",
                    }],
                    backgroundColor: getLeaveTypeColor(e.leaveType),
                    cornerRadius: "4px",
                    paddingAll: "3px",
                    paddingStart: "6px",
                    paddingEnd: "6px",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: e.startDate === e.endDate
                      ? `${e.startDate} 共計${e.days}天`
                      : `${e.startDate}~${e.endDate} 共計${e.days}天`,
                    size: "xxs",
                    color: "#888888",
                    margin: "sm",
                    gravity: "center",
                  },
                ],
                margin: "xs",
              },
            ],
            margin: "md",
            flex: 1,
          },
        ],
        spacing: "sm",
        alignItems: "center",
        ...(i < entries.length - 1 ? { paddingBottom: "md" } : {}),
      }));

  const bodyContents: object[] = [];
  entryBoxes.forEach((box, i) => {
    bodyContents.push(box);
    if (entries.length > 0 && i < entryBoxes.length - 1) {
      bodyContents.push({ type: "separator", margin: "md", color: "#F0F0F0" });
    }
  });

  const footerContents: object[] = [];
  if (pendingCount > 0) {
    footerContents.push({
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: "⏳", size: "sm", flex: 0 },
        {
          type: "text",
          text: `${pendingCount} 筆待審核申請`,
          size: "xs",
          color: "#FF9800",
          margin: "sm",
          weight: "bold",
        },
      ],
    });
  }

  footerContents.push({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: `共 ${entries.length} 人休假`,
        size: "xs",
        color: "#AAAAAA",
        align: "end",
      },
    ],
    ...(pendingCount > 0 ? { marginTop: "sm" } : {}),
  });

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: emoji, size: "xxl", flex: 0 },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: title,
                  size: "xl",
                  color: "#FFFFFF",
                  weight: "bold",
                },
                {
                  type: "text",
                  text: subtitle,
                  size: "xs",
                  color: "#FFFFFFCC",
                  margin: "xs",
                },
              ],
              margin: "lg",
            },
          ],
          alignItems: "center",
        },
      ],
      backgroundColor: accentColor,
      paddingAll: "lg",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: bodyContents,
      paddingAll: "lg",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: footerContents,
      paddingAll: "lg",
      backgroundColor: "#FAFAFA",
    },
    styles: {
      footer: { separator: true },
    },
  };
}

function getLeaveTypeColor(type: string): string {
  const colors: Record<string, string> = {
    "特休": "#3B82F6",
    "病假": "#EF4444",
    "事假": "#F59E0B",
    "婚假": "#8B5CF6",
    "產假": "#06B6D4",
    "喪假": "#6B7280",
  };
  return colors[type] ?? "#9CA3AF";
}

function getTaiwanDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

function getTaiwanToday(): string {
  return getTaiwanDate().toISOString().split("T")[0];
}

function getWeekDates(offset = 0): { start: string; end: string; label: string } {
  const now = getTaiwanDate();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday + offset * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    start: fmt(monday),
    end: fmt(sunday),
    label: `${fmt(monday)} ~ ${fmt(sunday)}`,
  };
}

function getMonthDates(): { start: string; end: string; label: string } {
  const now = getTaiwanDate();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0));
  const monthEnd = lastDay.toISOString().split("T")[0];
  return {
    start: monthStart,
    end: monthEnd,
    label: `${year}/${String(month).padStart(2, "0")}`,
  };
}

async function fetchLeavesAndProfiles(
  supabase: any,
  startDate: string,
  endDate: string
): Promise<{ entries: LeaveEntry[]; pendingCount: number }> {
  const { data: leaves, error: lErr } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("status", "approved")
    .lte("start_date", endDate)
    .gte("end_date", startDate);
  if (lErr) throw lErr;

  const userIds = [...new Set((leaves ?? []).map((l: any) => l.user_id))];
  let profileMap = new Map<string, any>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("user_id, name, department").in("user_id", userIds);
    profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
  }

  const entries: LeaveEntry[] = (leaves ?? []).map((l: any) => {
    const p = profileMap.get(l.user_id);
    const days = Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
    return { name: p?.name ?? "未知", department: p?.department ?? "", leaveType: l.leave_type, startDate: l.start_date, endDate: l.end_date, days };
  });

  const { count: pendingCount } = await supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending");

  return { entries, pendingCount: pendingCount ?? 0 };
}

async function sendFlexPush(token: string, targetId: string, altText: string, bubble: object) {
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: targetId, messages: [{ type: "flex", altText, contents: bubble }] }),
  });
  if (!response.ok) throw new Error(`LINE API error [${response.status}]: ${await response.text()}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LINE_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!LINE_TOKEN) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");

    const body = await req.json();
    const { mode, to } = body;
    const targetId = to || Deno.env.get("LINE_NOTIFY_TARGET_ID");
    if (!targetId) throw new Error("No LINE target ID configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const jsonOk = (data: object) =>
      new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // === New Request Notification ===
    if (mode === "new-request") {
      const { employeeName, department, leaveType, startDate, endDate, reason } = body;
      const dateText = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
      const bubble = {
        type: "bubble",
        header: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📨 新休假申請", size: "xl", color: "#FFFFFF", weight: "bold" },
            { type: "text", text: "有員工提交了休假申請", size: "xs", color: "#FFFFFFCC", margin: "xs" },
          ],
          backgroundColor: "#F59E0B", paddingAll: "lg",
        },
        body: {
          type: "box", layout: "vertical", paddingAll: "lg",
          contents: [
            { type: "box", layout: "horizontal", margin: "md", contents: [
              { type: "text", text: "員工", size: "sm", color: "#AAAAAA", flex: 2 },
              { type: "text", text: `${employeeName}${department ? ` (${department})` : ""}`, size: "sm", color: "#333333", weight: "bold", flex: 5, wrap: true },
            ]},
            { type: "separator", margin: "md", color: "#F0F0F0" },
            { type: "box", layout: "horizontal", margin: "md", contents: [
              { type: "text", text: "假別", size: "sm", color: "#AAAAAA", flex: 2 },
              { type: "text", text: leaveType, size: "sm", color: "#333333", weight: "bold", flex: 5 },
            ]},
            { type: "separator", margin: "md", color: "#F0F0F0" },
            { type: "box", layout: "horizontal", margin: "md", contents: [
              { type: "text", text: "日期", size: "sm", color: "#AAAAAA", flex: 2 },
              { type: "text", text: dateText, size: "sm", color: "#333333", weight: "bold", flex: 5 },
            ]},
            ...(reason ? [
              { type: "separator", margin: "md", color: "#F0F0F0" },
              { type: "box", layout: "horizontal", margin: "md", contents: [
                { type: "text", text: "原因", size: "sm", color: "#AAAAAA", flex: 2 },
                { type: "text", text: reason, size: "sm", color: "#333333", flex: 5, wrap: true },
              ]},
            ] : []),
          ],
        },
        footer: {
          type: "box", layout: "vertical",
          contents: [{ type: "text", text: "⏳ 請前往後台審核", size: "xs", color: "#F59E0B", align: "center" }],
          paddingAll: "md", backgroundColor: "#FFFBEB",
        },
      };

      await sendFlexPush(LINE_TOKEN, targetId, `新休假申請：${employeeName} - ${leaveType}`, bubble);
      return jsonOk({ success: true });
    }

    // === Monthly Summary (stats) ===
    if (mode === "monthly-summary") {
      const now = getTaiwanDate();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() + 1;
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(Date.UTC(year, month, 0));
      const monthEnd = lastDay.toISOString().split("T")[0];
      const monthLabel = `${year}/${String(month).padStart(2, "0")}`;

      const { data: leaves } = await supabase
        .from("leave_requests")
        .select("leave_type, start_date, end_date")
        .eq("status", "approved")
        .lte("start_date", monthEnd)
        .gte("end_date", monthStart);

      const stats = new Map<string, { count: number; days: number }>();
      for (const l of leaves ?? []) {
        const days = Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
        const prev = stats.get(l.leave_type) ?? { count: 0, days: 0 };
        stats.set(l.leave_type, { count: prev.count + 1, days: prev.days + days });
      }

      const rows: object[] = [];
      for (const [type, s] of stats) {
        rows.push({
          type: "box", layout: "horizontal", margin: "lg",
          contents: [
            { type: "box", layout: "vertical", flex: 0, width: "8px", height: "8px", cornerRadius: "4px", backgroundColor: getLeaveTypeColor(type), margin: "sm" },
            { type: "text", text: type, size: "sm", color: "#333333", flex: 3, margin: "md" },
            { type: "text", text: `${s.count} 人次`, size: "sm", color: "#666666", flex: 2, align: "end" },
            { type: "text", text: `${s.days} 天`, size: "sm", color: "#333333", weight: "bold", flex: 2, align: "end" },
          ],
          alignItems: "center",
        });
      }
      if (rows.length === 0) {
        rows.push({ type: "text", text: "🎉 本月無休假紀錄", size: "md", color: "#4CAF50", align: "center", margin: "xl" });
      }

      const bubble = {
        type: "bubble", size: "mega",
        header: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📊 月統計報告", size: "xl", color: "#FFFFFF", weight: "bold" },
            { type: "text", text: monthLabel, size: "xs", color: "#FFFFFFCC", margin: "xs" },
          ],
          backgroundColor: "#10B981", paddingAll: "lg",
        },
        body: { type: "box", layout: "vertical", contents: rows, paddingAll: "lg" },
        footer: {
          type: "box", layout: "vertical",
          contents: [{ type: "text", text: `共 ${leaves?.length ?? 0} 筆休假`, size: "xs", color: "#AAAAAA", align: "end" }],
          paddingAll: "md", backgroundColor: "#FAFAFA",
        },
        styles: { footer: { separator: true } },
      };

      await sendFlexPush(LINE_TOKEN, targetId, `${monthLabel} 月統計報告`, bubble);
      return jsonOk({ success: true });
    }

    // === Daily / Weekly / Next-Week Summary ===
    if (mode === "daily-summary" || mode === "weekly-summary" || mode === "next-week-summary") {
      let startDate: string, endDate: string, title: string, subtitle: string, emoji: string, accentColor: string;

      if (mode === "daily-summary") {
        const today = getTaiwanToday();
        startDate = today;
        endDate = today;
        title = "今日休假提醒";
        subtitle = today;
        emoji = "📋";
        accentColor = "#3B82F6";
      } else if (mode === "next-week-summary") {
        const week = getWeekDates(1);
        startDate = week.start;
        endDate = week.end;
        title = "下週休假總覽";
        subtitle = week.label;
        emoji = "📅";
        accentColor = "#F59E0B";
      } else {
        const week = getWeekDates(0);
        startDate = week.start;
        endDate = week.end;
        title = "本週休假總覽";
        subtitle = week.label;
        emoji = "📅";
        accentColor = "#8B5CF6";
      }

      const { entries, pendingCount } = await fetchLeavesAndProfiles(supabase, startDate, endDate);
      const bubble = buildFlexBubble(title, subtitle, emoji, accentColor, entries, pendingCount);
      await sendFlexPush(LINE_TOKEN, targetId, `${title}：共 ${entries.length} 人休假`, bubble);

      return jsonOk({ success: true, entries: entries.length });
    }

    // === Monthly Leave List (detailed per-person list) ===
    if (mode === "monthly-leave-list") {
      const m = getMonthDates();
      const { entries, pendingCount } = await fetchLeavesAndProfiles(supabase, m.start, m.end);
      const bubble = buildFlexBubble("當月休假明細", m.label, "📆", "#10B981", entries, pendingCount);
      await sendFlexPush(LINE_TOKEN, targetId, `${m.label} 當月休假明細：共 ${entries.length} 人休假`, bubble);

      return jsonOk({ success: true, entries: entries.length });
    }

    // === Leave Balance Reminder (enhanced with full details + Flex Message) ===
    if (mode === "leave-balance-reminder") {
      const year = getTaiwanDate().getUTCFullYear();

      const { data: policies } = await supabase
        .from("leave_policies")
        .select("*")
        .eq("is_active", true);

      const { data: annualRules } = await supabase
        .from("annual_leave_rules")
        .select("min_months, max_months, days")
        .order("min_months");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, department, hire_date, line_user_id")
        .not("line_user_id", "is", null);

      const { data: allLeaves } = await supabase
        .from("leave_requests")
        .select("user_id, leave_type, start_date, end_date")
        .in("status", ["approved", "pending"])
        .gte("start_date", `${year}-01-01`)
        .lte("start_date", `${year}-12-31`);

      const usedMap = new Map<string, Map<string, number>>();
      for (const l of allLeaves ?? []) {
        const days = Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
        if (!usedMap.has(l.user_id)) usedMap.set(l.user_id, new Map());
        const m = usedMap.get(l.user_id)!;
        m.set(l.leave_type, (m.get(l.leave_type) ?? 0) + days);
      }

      function calcAnnualDays(hireDate: string | null, rules: any[]): number {
        if (!hireDate || !rules?.length) return 0;
        const hire = new Date(hireDate);
        const now = new Date();
        const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
        if (months < 6) return 0;
        for (const rule of rules) {
          if (rule.max_months === null) {
            return Math.min(rule.days + Math.floor((months - rule.min_months) / 12), 30);
          }
          if (months >= rule.min_months && months < rule.max_months) return rule.days;
        }
        return 0;
      }

      const currentMonth = getTaiwanDate().getUTCMonth() + 1;
      let sentCount = 0;

      for (const profile of profiles ?? []) {
        const userUsed = usedMap.get(profile.user_id) ?? new Map<string, number>();

        // Build Flex Message body rows with full details
        const balanceRows: object[] = [];
        const alertRows: object[] = [];

        for (const pol of policies ?? []) {
          const total = pol.leave_type === "特休"
            ? calcAnnualDays(profile.hire_date, annualRules ?? [])
            : pol.default_days;
          const used = userUsed.get(pol.leave_type) ?? 0;
          const remaining = Math.max(total - used, 0);
          const ratio = total > 0 ? Math.min(used / total, 1) : 0;

          // Progress bar color
          let barColor = "#4CAF50";
          if (total > 0 && used > total) barColor = "#EF4444";
          else if (ratio >= 0.8) barColor = "#F59E0B";

          // Balance row with progress bar
          balanceRows.push({
            type: "box", layout: "vertical", margin: "lg",
            contents: [
              {
                type: "box", layout: "horizontal",
                contents: [
                  { type: "text", text: pol.leave_type, size: "sm", color: "#333333", weight: "bold", flex: 3 },
                  { type: "text", text: `已休 ${used} / 額度 ${total} / 剩餘 ${remaining}`, size: "xxs", color: "#888888", flex: 5, align: "end" },
                ],
              },
              {
                type: "box", layout: "vertical", margin: "sm", height: "6px", cornerRadius: "3px", backgroundColor: "#E0E0E0",
                contents: [
                  {
                    type: "box", layout: "vertical", height: "6px", cornerRadius: "3px",
                    backgroundColor: barColor,
                    width: `${Math.round(ratio * 100)}%`,
                    contents: [],
                  },
                ],
              },
            ],
          });

          // Alerts
          if (pol.reminder_enabled && pol.reminder_threshold_days > 0 && used >= pol.reminder_threshold_days) {
            alertRows.push({ type: "text", text: `⚠️ ${pol.leave_type}：已達門檻 ${pol.reminder_threshold_days} 天`, size: "xs", color: "#F59E0B", margin: "sm", wrap: true });
          }
          if (total > 0 && used > total) {
            alertRows.push({ type: "text", text: `🔴 ${pol.leave_type}：已超休！`, size: "xs", color: "#EF4444", margin: "sm" });
          }
          if (pol.leave_type === "特休" && currentMonth >= 10 && total > 0 && used / total < 0.5) {
            alertRows.push({ type: "text", text: `🟡 特休僅使用 ${Math.round((used / total) * 100)}%，請安排休假`, size: "xs", color: "#F59E0B", margin: "sm", wrap: true });
          }
        }

        if (balanceRows.length === 0) continue;

        const bodyContents: object[] = [...balanceRows];
        if (alertRows.length > 0) {
          bodyContents.push({ type: "separator", margin: "lg", color: "#F0F0F0" });
          bodyContents.push(...alertRows);
        }

        const bubble = {
          type: "bubble", size: "mega",
          header: {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "📊 休假餘額報告", size: "xl", color: "#FFFFFF", weight: "bold" },
              { type: "text", text: `${profile.name} — ${year} 年度`, size: "xs", color: "#FFFFFFCC", margin: "xs" },
            ],
            backgroundColor: "#3B82F6", paddingAll: "lg",
          },
          body: { type: "box", layout: "vertical", contents: bodyContents, paddingAll: "lg" },
          footer: {
            type: "box", layout: "vertical",
            contents: [{ type: "text", text: alertRows.length > 0 ? `${alertRows.length} 項提醒` : "✅ 休假使用正常", size: "xs", color: "#AAAAAA", align: "end" }],
            paddingAll: "md", backgroundColor: "#FAFAFA",
          },
          styles: { footer: { separator: true } },
        };

        if (profile.line_user_id) {
          await sendFlexPush(LINE_TOKEN, profile.line_user_id, `${profile.name} 的休假餘額報告`, bubble);
          sentCount++;
        }
      }

      // Admin summary
      const summaryText = `✅ 休假餘額提醒已發送給 ${sentCount} 位員工（含完整天數明細）`;
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
        body: JSON.stringify({ to: targetId, messages: [{ type: "text", text: summaryText }] }),
      });

      return jsonOk({ success: true, sentCount });
    }

    // Direct message fallback
    const { message } = body;
    if (!targetId || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'to' or 'message'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
      body: JSON.stringify({ to: targetId, messages: [{ type: "text", text: message }] }),
    });
    if (!response.ok) throw new Error(`LINE API error [${response.status}]: ${await response.text()}`);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error sending LINE message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
