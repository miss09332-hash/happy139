import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LINE_API = "https://api.line.me/v2/bot/message/reply";

// In-memory conversation state (reset on cold start, acceptable for short flows)
const userState = new Map<string, { step: string; data: Record<string, string> }>();

function getLeaveTypeColor(type: string): string {
  const colors: Record<string, string> = {
    "特休": "#3B82F6", "病假": "#EF4444", "事假": "#F59E0B",
    "婚假": "#8B5CF6", "產假": "#06B6D4", "喪假": "#6B7280",
  };
  return colors[type] ?? "#9CA3AF";
}

function replyMessage(replyToken: string, token: string, messages: object[]) {
  return fetch(LINE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages }),
  });
}

// ===== Flex Builders =====

function buildLeaveTypeCarousel(policies: any[]): object {
  const bubbles = policies.map((p) => ({
    type: "bubble",
    size: "micro",
    header: {
      type: "box", layout: "vertical",
      contents: [{ type: "text", text: p.leave_type, size: "lg", color: "#FFFFFF", weight: "bold", align: "center" }],
      backgroundColor: getLeaveTypeColor(p.leave_type),
      paddingAll: "lg",
    },
    body: {
      type: "box", layout: "vertical",
      contents: [
        { type: "text", text: p.description || "　", size: "xs", color: "#888888", wrap: true },
        { type: "text", text: `年度 ${p.default_days} 天`, size: "sm", color: "#333333", weight: "bold", margin: "md" },
      ],
      paddingAll: "lg",
    },
    footer: {
      type: "box", layout: "vertical",
      contents: [{
        type: "button",
        action: { type: "postback", label: "選擇", data: `action=select_leave&type=${p.leave_type}` },
        style: "primary",
        color: getLeaveTypeColor(p.leave_type),
        height: "sm",
      }],
      paddingAll: "sm",
    },
  }));
  return {
    type: "flex", altText: "請選擇假別",
    contents: { type: "carousel", contents: bubbles.slice(0, 10) },
  };
}

function buildDatePrompt(leaveType: string): object {
  return {
    type: "flex", altText: "請輸入休假日期",
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `📅 ${leaveType}`, size: "lg", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: "請輸入休假日期", size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: getLeaveTypeColor(leaveType),
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "請依照以下格式輸入：", size: "sm", color: "#555555", margin: "md" },
          {
            type: "box", layout: "vertical",
            contents: [
              { type: "text", text: "單日：2025-07-01", size: "sm", color: "#3B82F6" },
              { type: "text", text: "多日：2025-07-01~2025-07-03", size: "sm", color: "#3B82F6", margin: "xs" },
            ],
            backgroundColor: "#F0F7FF",
            cornerRadius: "md",
            paddingAll: "md",
            margin: "md",
          },
          { type: "text", text: "輸入完成後也可附加原因", size: "xxs", color: "#AAAAAA", margin: "lg" },
        ],
        paddingAll: "lg",
      },
    },
  };
}

function buildSuccessBubble(leaveType: string, startDate: string, endDate: string, reason: string): object {
  return {
    type: "flex", altText: "休假申請成功！",
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "✅ 申請成功", size: "xl", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: "您的休假申請已提交", size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: "#10B981",
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          buildInfoRow("假別", leaveType),
          { type: "separator", margin: "md", color: "#F0F0F0" },
          buildInfoRow("開始", startDate),
          { type: "separator", margin: "md", color: "#F0F0F0" },
          buildInfoRow("結束", endDate),
          ...(reason ? [
            { type: "separator", margin: "md", color: "#F0F0F0" },
            buildInfoRow("原因", reason),
          ] : []),
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box", layout: "vertical",
        contents: [{ type: "text", text: "⏳ 等待主管審核中", size: "xs", color: "#F59E0B", align: "center" }],
        paddingAll: "md",
        backgroundColor: "#FFFBEB",
      },
    },
  };
}

function buildInfoRow(label: string, value: string): object {
  return {
    type: "box", layout: "horizontal", margin: "md",
    contents: [
      { type: "text", text: label, size: "sm", color: "#AAAAAA", flex: 2 },
      { type: "text", text: value, size: "sm", color: "#333333", weight: "bold", flex: 5, wrap: true },
    ],
  };
}

function buildBalanceBubble(balances: { type: string; total: number; used: number; color: string }[]): object {
  const rows = balances.map((b) => {
    const remaining = Math.max(b.total - b.used, 0);
    const pct = b.total > 0 ? Math.round((b.used / b.total) * 100) : 0;
    return {
      type: "box", layout: "vertical", margin: "lg",
      contents: [
        {
          type: "box", layout: "horizontal",
          contents: [
            { type: "text", text: b.type, size: "sm", color: "#333333", weight: "bold", flex: 3 },
            { type: "text", text: `${remaining}/${b.total} 天`, size: "sm", color: "#666666", align: "end", flex: 2 },
          ],
        },
        {
          type: "box", layout: "vertical", margin: "sm", height: "6px", cornerRadius: "3px", backgroundColor: "#E5E7EB",
          contents: [{
            type: "box", layout: "vertical",
            contents: [{ type: "filler" }],
            width: `${Math.min(pct, 100)}%`,
            height: "6px",
            backgroundColor: b.color,
          }],
        },
      ],
    };
  });

  return {
    type: "flex", altText: "假期餘額查詢",
    contents: {
      type: "bubble", size: "mega",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "🏖️ 假期餘額", size: "xl", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: `${new Date().getFullYear()} 年度`, size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: "#3B82F6",
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: rows,
        paddingAll: "lg",
      },
    },
  };
}

function buildMonthlyLeaveBubble(entries: { name: string; dept: string; type: string; dates: string }[]): object {
  const contents: object[] = entries.length === 0
    ? [{ type: "text", text: "🎉 本月無人休假", size: "md", color: "#4CAF50", align: "center", margin: "xl" }]
    : entries.map((e, i) => {
        const items: object[] = [{
          type: "box", layout: "horizontal", spacing: "sm", alignItems: "center",
          contents: [
            {
              type: "box", layout: "vertical", width: "32px", height: "32px", cornerRadius: "16px",
              backgroundColor: getLeaveTypeColor(e.type), justifyContent: "center", alignItems: "center",
              contents: [{ type: "text", text: e.name.charAt(0), size: "sm", color: "#FFFFFF", align: "center" }],
            },
            {
              type: "box", layout: "vertical", flex: 1, margin: "md",
              contents: [
                { type: "text", text: `${e.name}${e.dept ? ` (${e.dept})` : ""}`, size: "sm", color: "#333333", weight: "bold" },
                {
                  type: "box", layout: "horizontal", margin: "xs",
                  contents: [
                    {
                      type: "box", layout: "vertical", flex: 0,
                      contents: [{ type: "text", text: e.type, size: "xxs", color: "#FFFFFF", align: "center" }],
                      backgroundColor: getLeaveTypeColor(e.type), cornerRadius: "4px",
                      paddingAll: "2px", paddingStart: "6px", paddingEnd: "6px",
                    },
                    { type: "text", text: e.dates, size: "xxs", color: "#888888", margin: "sm", gravity: "center" },
                  ],
                },
              ],
            },
          ],
        }];
        if (i < entries.length - 1) items.push({ type: "separator", margin: "md", color: "#F0F0F0" });
        return items;
      }).flat();

  const now = new Date();
  const monthLabel = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    type: "flex", altText: `${monthLabel} 休假清單`,
    contents: {
      type: "bubble", size: "mega",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "📆 當月休假清單", size: "xl", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: monthLabel, size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: "#8B5CF6",
        paddingAll: "lg",
      },
      body: { type: "box", layout: "vertical", contents, paddingAll: "lg" },
      footer: {
        type: "box", layout: "vertical",
        contents: [{ type: "text", text: `共 ${entries.length} 人`, size: "xs", color: "#AAAAAA", align: "end" }],
        paddingAll: "md", backgroundColor: "#FAFAFA",
      },
      styles: { footer: { separator: true } },
    },
  };
}

function buildBindPrompt(): object {
  return {
    type: "flex", altText: "帳號綁定",
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "🔗 帳號綁定", size: "xl", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: "首次使用需綁定公司帳號", size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: "#F59E0B",
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "請輸入您的公司 Email：", size: "sm", color: "#555555" },
          {
            type: "box", layout: "vertical", margin: "md", backgroundColor: "#FFF7ED", cornerRadius: "md", paddingAll: "md",
            contents: [{ type: "text", text: "例如：user@company.com", size: "sm", color: "#D97706" }],
          },
        ],
        paddingAll: "lg",
      },
    },
  };
}

function buildTextMessage(text: string): object {
  return { type: "text", text };
}

// ===== Main Handler =====

serve(async (req) => {
  if (req.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  try {
    const LINE_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      const replyToken = event.replyToken;
      const userId = event.source?.userId;
      if (!replyToken || !userId) continue;

      // Look up bound profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, name, department")
        .eq("line_user_id", userId)
        .maybeSingle();

      // --- Handle postback ---
      if (event.type === "postback") {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get("action");

        if (action === "select_leave" && profile) {
          const leaveType = params.get("type")!;
          userState.set(userId, { step: "await_date", data: { leaveType } });
          await replyMessage(replyToken, LINE_TOKEN, [buildDatePrompt(leaveType)]);
        }
        continue;
      }

      // --- Handle text message ---
      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text.trim();
        const state = userState.get(userId);

        // Binding flow
        if (!profile) {
          if (state?.step === "await_email") {
            // Try to bind
            const email = text.toLowerCase();
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const matchedUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === email);
            if (matchedUser) {
              await supabase.from("profiles").update({ line_user_id: userId }).eq("user_id", matchedUser.id);
              userState.delete(userId);
              await replyMessage(replyToken, LINE_TOKEN, [
                buildTextMessage(`✅ 綁定成功！歡迎使用休假系統。\n\n您可以傳送：\n📝 申請休假\n📊 查詢假期\n📆 當月休假`),
              ]);
            } else {
              await replyMessage(replyToken, LINE_TOKEN, [
                buildTextMessage("❌ 找不到此 Email，請確認後重新輸入。"),
              ]);
            }
            continue;
          }
          // First message from unbound user
          userState.set(userId, { step: "await_email", data: {} });
          await replyMessage(replyToken, LINE_TOKEN, [buildBindPrompt()]);
          continue;
        }

        // --- Date input for leave application ---
        if (state?.step === "await_date") {
          const leaveType = state.data.leaveType;
          // Parse date: "2025-07-01" or "2025-07-01~2025-07-03" optionally followed by reason
          const dateMatch = text.match(/^(\d{4}-\d{2}-\d{2})(?:\s*[~～\-至到]\s*(\d{4}-\d{2}-\d{2}))?(?:\s+(.+))?$/);
          if (!dateMatch) {
            await replyMessage(replyToken, LINE_TOKEN, [
              buildTextMessage("❌ 日期格式不正確，請重新輸入。\n例如：2025-07-01 或 2025-07-01~2025-07-03"),
            ]);
            continue;
          }
          const startDate = dateMatch[1];
          const endDate = dateMatch[2] || startDate;
          const reason = dateMatch[3] || "";

          // Insert leave request
          const { error: insertErr } = await supabase.from("leave_requests").insert({
            user_id: profile.user_id,
            leave_type: leaveType,
            start_date: startDate,
            end_date: endDate,
            reason,
          });
          userState.delete(userId);

          if (insertErr) {
            await replyMessage(replyToken, LINE_TOKEN, [
              buildTextMessage(`❌ 申請失敗：${insertErr.message}`),
            ]);
          } else {
            await replyMessage(replyToken, LINE_TOKEN, [
              buildSuccessBubble(leaveType, startDate, endDate, reason),
            ]);
          }
          continue;
        }

        // --- Command dispatch ---
        if (text.includes("申請休假")) {
          const { data: policies } = await supabase
            .from("leave_policies")
            .select("*")
            .eq("is_active", true)
            .order("leave_type");
          if (!policies?.length) {
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("⚠️ 目前無可用假別，請聯繫管理員。")]);
            continue;
          }
          await replyMessage(replyToken, LINE_TOKEN, [buildLeaveTypeCarousel(policies)]);
          continue;
        }

        if (text.includes("查詢假期")) {
          const { data: policies } = await supabase
            .from("leave_policies")
            .select("*")
            .eq("is_active", true);
          const year = new Date().getFullYear();
          const { data: leaves } = await supabase
            .from("leave_requests")
            .select("leave_type, start_date, end_date")
            .eq("user_id", profile.user_id)
            .in("status", ["approved", "pending"])
            .gte("start_date", `${year}-01-01`)
            .lte("start_date", `${year}-12-31`);

          // Calculate used days per type
          const usedMap = new Map<string, number>();
          for (const l of leaves ?? []) {
            const days = Math.ceil(
              (new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000
            ) + 1;
            usedMap.set(l.leave_type, (usedMap.get(l.leave_type) ?? 0) + days);
          }

          const balances = (policies ?? []).map((p) => ({
            type: p.leave_type,
            total: p.default_days,
            used: usedMap.get(p.leave_type) ?? 0,
            color: getLeaveTypeColor(p.leave_type),
          }));

          await replyMessage(replyToken, LINE_TOKEN, [buildBalanceBubble(balances)]);
          continue;
        }

        if (text.includes("當月休假")) {
          const now = new Date();
          const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const monthEnd = nextMonth.toISOString().split("T")[0];

          const { data: leaves } = await supabase
            .from("leave_requests")
            .select("user_id, leave_type, start_date, end_date")
            .eq("status", "approved")
            .lte("start_date", monthEnd)
            .gte("end_date", monthStart);

          const uids = [...new Set((leaves ?? []).map((l: any) => l.user_id))];
          let pMap = new Map<string, any>();
          if (uids.length) {
            const { data: profiles } = await supabase.from("profiles").select("user_id, name, department").in("user_id", uids);
            pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
          }

          const entries = (leaves ?? []).map((l: any) => {
            const p = pMap.get(l.user_id);
            return {
              name: p?.name ?? "未知",
              dept: p?.department ?? "",
              type: l.leave_type,
              dates: l.start_date === l.end_date ? l.start_date : `${l.start_date}~${l.end_date}`,
            };
          });

          await replyMessage(replyToken, LINE_TOKEN, [buildMonthlyLeaveBubble(entries)]);
          continue;
        }

        // Default help
        await replyMessage(replyToken, LINE_TOKEN, [
          buildTextMessage("👋 您好！請傳送以下指令：\n\n📝 申請休假\n📊 查詢假期\n📆 當月休假"),
        ]);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    // LINE requires 200 even on error
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
