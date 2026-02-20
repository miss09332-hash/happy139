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
                    text: e.startDate === e.endDate ? e.startDate : `${e.startDate} ~ ${e.endDate}`,
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

  // Add separators between entries
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

function getWeekDates(offset = 0): { start: string; end: string; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    start: fmt(monday),
    end: fmt(friday),
    label: `${fmt(monday)} ~ ${fmt(friday)}`,
  };
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
          backgroundColor: "#F59E0B",
          paddingAll: "lg",
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

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
        body: JSON.stringify({ to: targetId, messages: [{ type: "flex", altText: `新休假申請：${employeeName} - ${leaveType}`, contents: bubble }] }),
      });
      if (!response.ok) throw new Error(`LINE API error [${response.status}]: ${await response.text()}`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === Monthly Summary ===
    if (mode === "monthly-summary") {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEnd = lastDay.toISOString().split("T")[0];
      const monthLabel = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

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

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
        body: JSON.stringify({ to: targetId, messages: [{ type: "flex", altText: `${monthLabel} 月統計報告`, contents: bubble }] }),
      });
      if (!response.ok) throw new Error(`LINE API error [${response.status}]: ${await response.text()}`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "daily-summary" || mode === "weekly-summary") {
      let startDate: string, endDate: string, title: string, subtitle: string, emoji: string, accentColor: string;

      if (mode === "daily-summary") {
        const today = new Date().toISOString().split("T")[0];
        startDate = today;
        endDate = today;
        title = "今日休假提醒";
        subtitle = today;
        emoji = "📋";
        accentColor = "#3B82F6";
      } else {
        const week = getWeekDates(0);
        startDate = week.start;
        endDate = week.end;
        title = "本週休假總覽";
        subtitle = week.label;
        emoji = "📅";
        accentColor = "#8B5CF6";
      }

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
        return { name: p?.name ?? "未知", department: p?.department ?? "", leaveType: l.leave_type, startDate: l.start_date, endDate: l.end_date };
      });

      const { count: pendingCount } = await supabase.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
      const bubble = buildFlexBubble(title, subtitle, emoji, accentColor, entries, pendingCount ?? 0);

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
        body: JSON.stringify({ to: targetId, messages: [{ type: "flex", altText: `${title}：共 ${entries.length} 人休假`, contents: bubble }] }),
      });
      if (!response.ok) throw new Error(`LINE API error [${response.status}]: ${await response.text()}`);

      return new Response(
        JSON.stringify({ success: true, entries: entries.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_TOKEN}`,
      },
      body: JSON.stringify({ to: targetId, messages: [{ type: "text", text: message }] }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LINE API error [${response.status}]: ${errorBody}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending LINE message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
