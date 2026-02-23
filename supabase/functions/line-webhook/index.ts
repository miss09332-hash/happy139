import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LINE_API = "https://api.line.me/v2/bot/message/reply";

// ===== DB-backed conversation state =====

async function getState(supabase: any, lineUserId: string) {
  const { data } = await supabase
    .from("line_conversation_state")
    .select("step, data, updated_at")
    .eq("line_user_id", lineUserId)
    .maybeSingle();
  if (!data) return null;
  const updatedAt = new Date(data.updated_at).getTime();
  if (Date.now() - updatedAt > 30 * 60 * 1000) {
    await clearState(supabase, lineUserId);
    return null;
  }
  return { step: data.step, data: data.data };
}

async function setState(supabase: any, lineUserId: string, step: string, stateData: Record<string, any>) {
  await supabase.from("line_conversation_state").upsert({
    line_user_id: lineUserId,
    step,
    data: stateData,
    updated_at: new Date().toISOString(),
  }, { onConflict: "line_user_id" });
}

async function clearState(supabase: any, lineUserId: string) {
  await supabase.from("line_conversation_state").delete().eq("line_user_id", lineUserId);
}

// ===== Helpers =====

function calculateAnnualDays(hireDate: string | null, rules: { min_months: number; max_months: number | null; days: number }[]): number | null {
  if (!hireDate || !rules?.length) return null;
  const hire = new Date(hireDate);
  const now = new Date();
  const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  if (months < 6) return 0;
  const sorted = [...rules].sort((a, b) => a.min_months - b.min_months);
  for (const rule of sorted) {
    if (rule.max_months === null) {
      return Math.min(rule.days + Math.floor((months - rule.min_months) / 12), 30);
    }
    if (months >= rule.min_months && months < rule.max_months) {
      return rule.days;
    }
  }
  return 0;
}

function formatHoursDisplay(totalHours: number, dailyWorkHours: number = 8): string {
  if (totalHours <= 0) return "0h";
  const days = Math.floor(totalHours / dailyWorkHours);
  const remainingHours = totalHours % dailyWorkHours;
  if (days === 0) return `${remainingHours}h`;
  if (remainingHours === 0) return `${days}天`;
  return `${days}天 ${remainingHours}h`;
}

// Leave types are now fully driven by DB category + sort_order

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

function buildLeaveTypeCarousel(policies: any[], annualDaysOverride?: number | null): object {
  // policies are already sorted by category + sort_order from DB
  const MAX_CAROUSEL = 10;
  const toShow = policies.slice(0, MAX_CAROUSEL);
  const overflow = policies.slice(MAX_CAROUSEL);

  const bubbles = toShow.map((p) => {
    const displayDays = (p.leave_type === "特休" && annualDaysOverride != null) ? annualDaysOverride : p.default_days;
    return {
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
          { type: "text", text: `年度 ${displayDays} 天`, size: "sm", color: "#333333", weight: "bold", margin: "md" },
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
    };
  });

  if (overflow.length > 0) {
    // Replace last bubble with "more" card if we hit the limit
    bubbles[MAX_CAROUSEL - 1] = {
      type: "bubble",
      size: "micro",
      header: {
        type: "box", layout: "vertical",
        contents: [{ type: "text", text: "更多假別", size: "lg", color: "#FFFFFF", weight: "bold", align: "center" }],
        backgroundColor: "#9CA3AF",
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `還有${overflow.length + 1}種假別`, size: "xs", color: "#888888", wrap: true },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box", layout: "vertical",
        contents: [{
          type: "button",
          action: { type: "postback", label: "查看更多", data: "action=show_other_types" },
          style: "primary",
          color: "#9CA3AF",
          height: "sm",
        }],
        paddingAll: "sm",
      },
    };
  }

  return {
    type: "flex", altText: "請選擇假別",
    contents: { type: "carousel", contents: bubbles },
  };
}

function buildOtherLeaveTypeCarousel(policies: any[], annualDaysOverride?: number | null): object {
  // Show all policies (already sorted by category + sort_order)
  const bubbles = policies.map((p) => {
    const displayDays = (p.leave_type === "特休" && annualDaysOverride != null) ? annualDaysOverride : p.default_days;
    return {
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
          { type: "text", text: `年度 ${displayDays} 天`, size: "sm", color: "#333333", weight: "bold", margin: "md" },
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
    };
  });
  return {
    type: "flex", altText: "全部假別",
    contents: { type: "carousel", contents: bubbles.slice(0, 10) },
  };
}

function buildStartDatePicker(leaveType: string): object {
  const today = new Date().toISOString().split("T")[0];
  return {
    type: "flex", altText: `${leaveType} - 選擇開始日期`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `📅 ${leaveType}`, size: "lg", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: "選擇休假日期", size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: getLeaveTypeColor(leaveType),
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "請選擇休假開始日期", size: "sm", color: "#555555" },
          { type: "text", text: "或直接輸入日期格式：2026-03-01", size: "xxs", color: "#AAAAAA", margin: "sm" },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          {
            type: "button", style: "primary",
            color: getLeaveTypeColor(leaveType),
            action: {
              type: "datetimepicker",
              label: "📅 選擇開始日期",
              data: `action=pick_start_date&type=${leaveType}`,
              mode: "date",
              initial: today,
              min: today,
            },
          },
          {
            type: "button", style: "secondary",
            action: { type: "postback", label: "❌ 取消申請", data: "action=cancel_leave" },
          },
        ],
        paddingAll: "sm",
      },
    },
  };
}

function buildEndDatePicker(leaveType: string, startDate: string): object {
  return {
    type: "flex", altText: `${leaveType} - 選擇結束日期`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `📅 ${leaveType}`, size: "lg", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: "選擇結束日期", size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: getLeaveTypeColor(leaveType),
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `開始日期：${startDate}`, size: "sm", color: "#333333", weight: "bold" },
          { type: "text", text: "請選擇結束日期", size: "sm", color: "#555555", margin: "md" },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          {
            type: "button", style: "primary",
            color: getLeaveTypeColor(leaveType),
            action: {
              type: "datetimepicker",
              label: "📅 選擇結束日期",
              data: `action=pick_end_date&type=${leaveType}&start=${startDate}`,
              mode: "date",
              initial: startDate,
              min: startDate,
            },
          },
          {
            type: "button", style: "primary",
            color: "#10B981",
            action: { type: "postback", label: "📌 只請一天", data: `action=same_day&type=${leaveType}&start=${startDate}` },
          },
          {
            type: "button", style: "secondary",
            action: { type: "postback", label: "❌ 取消", data: "action=cancel_leave" },
          },
        ],
        paddingAll: "sm",
      },
    },
  };
}

function buildFullDayPrompt(leaveType: string, startDate: string, endDate: string): object {
  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
  return {
    type: "flex", altText: `${leaveType} - 選擇整天或時段`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `⏰ ${leaveType}`, size: "lg", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: "選擇請假方式", size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: getLeaveTypeColor(leaveType),
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents: [
          buildInfoRow("日期", startDate === endDate ? startDate : `${startDate} ~ ${endDate}`),
          { type: "separator", margin: "md", color: "#F0F0F0" },
          buildInfoRow("天數", `${days} 天`),
          { type: "text", text: "請選擇整天請假或指定時段", size: "sm", color: "#555555", margin: "lg" },
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          {
            type: "button", style: "primary", color: "#10B981",
            action: { type: "postback", label: "✅ 整天請假", data: `action=full_day&type=${leaveType}&start=${startDate}&end=${endDate}` },
          },
          {
            type: "button", style: "primary", color: getLeaveTypeColor(leaveType),
            action: { type: "postback", label: "⏰ 選擇時間", data: `action=pick_time&type=${leaveType}&start=${startDate}&end=${endDate}` },
          },
          {
            type: "button", style: "secondary",
            action: { type: "postback", label: "❌ 取消", data: "action=cancel_leave" },
          },
        ],
        paddingAll: "sm",
      },
    },
  };
}

function buildTimeQuickReply(prompt: string, actionPrefix: string, leaveType: string, startDate: string, endDate: string): object {
  const times = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
  return {
    type: "text",
    text: prompt,
    quickReply: {
      items: times.map(t => ({
        type: "action",
        action: {
          type: "postback",
          label: t,
          data: `action=${actionPrefix}&type=${leaveType}&start=${startDate}&end=${endDate}&time=${t}`,
        },
      })),
    },
  };
}

function buildReasonPrompt(leaveType: string, startDate: string, endDate: string, startTime?: string, endTime?: string, hours?: number): object {
  const contents: any[] = [
    buildInfoRow("開始", startDate),
    { type: "separator", margin: "md", color: "#F0F0F0" },
    buildInfoRow("結束", endDate),
  ];

  if (startTime && endTime) {
    contents.push(
      { type: "separator", margin: "md", color: "#F0F0F0" },
      buildInfoRow("時段", `${startTime} ~ ${endTime}`),
    );
  }
  if (hours) {
    contents.push(
      { type: "separator", margin: "md", color: "#F0F0F0" },
      buildInfoRow("時數", `${hours}h（${formatHoursDisplay(hours)}）`),
    );
  }

  contents.push(
    { type: "separator", margin: "md", color: "#F0F0F0" },
    { type: "text", text: "請輸入休假原因", size: "sm", color: "#555555", margin: "lg" },
    { type: "text", text: "直接輸入文字即可", size: "xxs", color: "#AAAAAA", margin: "xs" },
  );

  // Encode time info into skip_reason postback data
  let skipData = `action=skip_reason&type=${leaveType}&start=${startDate}&end=${endDate}`;
  if (startTime) skipData += `&st=${startTime}`;
  if (endTime) skipData += `&et=${endTime}`;
  if (hours) skipData += `&hours=${hours}`;

  return {
    type: "flex", altText: `${leaveType} - 填寫原因`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: `📝 ${leaveType} - 填寫原因`, size: "lg", color: "#FFFFFF", weight: "bold" },
        ],
        backgroundColor: getLeaveTypeColor(leaveType),
        paddingAll: "lg",
      },
      body: {
        type: "box", layout: "vertical",
        contents,
        paddingAll: "lg",
      },
      footer: {
        type: "box", layout: "vertical", spacing: "sm",
        contents: [
          {
            type: "button", style: "primary", color: "#10B981",
            action: { type: "postback", label: "📌 不填原因，直接送出", data: skipData },
          },
          {
            type: "button", style: "secondary",
            action: { type: "postback", label: "❌ 取消", data: "action=cancel_leave" },
          },
        ],
        paddingAll: "sm",
      },
    },
  };
}

function buildSuccessBubble(leaveType: string, startDate: string, endDate: string, reason: string, startTime?: string, endTime?: string, hours?: number): object {
  const bodyContents: any[] = [
    buildInfoRow("假別", leaveType),
    { type: "separator", margin: "md", color: "#F0F0F0" },
    buildInfoRow("開始", startDate),
    { type: "separator", margin: "md", color: "#F0F0F0" },
    buildInfoRow("結束", endDate),
  ];

  if (startTime && endTime) {
    bodyContents.push(
      { type: "separator", margin: "md", color: "#F0F0F0" },
      buildInfoRow("時段", `${startTime} ~ ${endTime}`),
    );
  }
  if (hours) {
    bodyContents.push(
      { type: "separator", margin: "md", color: "#F0F0F0" },
      buildInfoRow("時數", `${hours}h（${formatHoursDisplay(hours)}）`),
    );
  }
  if (reason) {
    bodyContents.push(
      { type: "separator", margin: "md", color: "#F0F0F0" },
      buildInfoRow("原因", reason),
    );
  }

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
        contents: bodyContents,
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

function buildBalanceBubble(balances: { type: string; totalHours: number; usedHours: number; color: string; dailyWorkHours: number }[], showAll: boolean = false): object {
  const filtered = showAll ? balances : balances.filter(b => b.usedHours > 0);
  
  if (filtered.length === 0) {
    return {
      type: "flex", altText: "休假餘額查詢",
      contents: {
        type: "bubble", size: "mega",
        header: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "🏖️ 休假餘額", size: "xl", color: "#FFFFFF", weight: "bold" },
            { type: "text", text: `${new Date().getFullYear()} 年度`, size: "xs", color: "#FFFFFFCC", margin: "xs" },
          ],
          backgroundColor: "#3B82F6", paddingAll: "lg",
        },
        body: {
          type: "box", layout: "vertical", paddingAll: "lg",
          contents: [
            { type: "text", text: "🎉 今年尚無休假紀錄", size: "md", color: "#4CAF50", align: "center", margin: "xl" },
          ],
        },
        footer: {
          type: "box", layout: "vertical", paddingAll: "md",
          contents: [{
            type: "button", style: "link",
            action: { type: "postback", label: "📋 查看全部假別", data: "action=show_all_balance" },
          }],
        },
      },
    };
  }

  const rows = filtered.map((b) => {
    const remainingHours = Math.max(b.totalHours - b.usedHours, 0);
    const pct = b.totalHours > 0 ? Math.round((b.usedHours / b.totalHours) * 100) : 0;
    const usedDisplay = formatHoursDisplay(b.usedHours, b.dailyWorkHours);
    const totalDisplay = formatHoursDisplay(b.totalHours, b.dailyWorkHours);
    const remainDisplay = formatHoursDisplay(remainingHours, b.dailyWorkHours);
    return {
      type: "box", layout: "vertical", margin: "lg",
      contents: [
        {
          type: "box", layout: "horizontal",
          contents: [
            { type: "text", text: b.type, size: "sm", color: "#333333", weight: "bold", flex: 3 },
            { type: "text", text: `剩 ${remainDisplay} / 共 ${totalDisplay}`, size: "xs", color: "#666666", align: "end", flex: 4 },
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
        {
          type: "text", text: `已用 ${usedDisplay}`, size: "xxs", color: "#999999", margin: "xs",
        },
      ],
    };
  });

  const footerContents: any[] = [];
  if (!showAll) {
    footerContents.push({
      type: "button", style: "link",
      action: { type: "postback", label: "📋 查看全部假別", data: "action=show_all_balance" },
    });
  }
  footerContents.push(
    { type: "text", text: showAll ? "顯示全部假別" : "僅顯示已使用的假別", size: "xxs", color: "#AAAAAA", align: "center" },
  );

  return {
    type: "flex", altText: "休假餘額查詢",
    contents: {
      type: "bubble", size: "mega",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "🏖️ 休假餘額", size: "xl", color: "#FFFFFF", weight: "bold" },
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
      footer: {
        type: "box", layout: "vertical",
        contents: footerContents,
        paddingAll: "md", backgroundColor: "#FAFAFA",
      },
      styles: { footer: { separator: true } },
    },
  };
}

function buildLeaveDetailBubble(records: { type: string; start: string; end: string; status: string; reason: string; hours?: number; startTime?: string; endTime?: string }[]): object {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "待審核", color: "#F59E0B" },
    approved: { label: "已核准", color: "#22C55E" },
    rejected: { label: "已拒絕", color: "#EF4444" },
  };

  const year = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getUTCFullYear();

  if (records.length === 0) {
    return {
      type: "flex", altText: `${year} 年休假明細`,
      contents: {
        type: "bubble",
        header: {
          type: "box", layout: "vertical",
          contents: [
            { type: "text", text: "📋 休假明細", size: "xl", color: "#FFFFFF", weight: "bold" },
            { type: "text", text: `${year} 年度`, size: "xs", color: "#FFFFFFCC", margin: "xs" },
          ],
          backgroundColor: "#6366F1", paddingAll: "lg",
        },
        body: {
          type: "box", layout: "vertical", paddingAll: "lg",
          contents: [{ type: "text", text: "🎉 今年尚無休假紀錄", size: "md", color: "#4CAF50", align: "center", margin: "xl" }],
        },
      },
    };
  }

  const rows: object[] = [];
  records.forEach((r, i) => {
    const s = statusMap[r.status] ?? { label: r.status, color: "#999999" };
    const dateText = r.start === r.end ? r.start : `${r.start} ~ ${r.end}`;
    const hoursText = r.hours ? `${r.hours}h` : (() => {
      const days = Math.ceil((new Date(r.end).getTime() - new Date(r.start).getTime()) / 86400000) + 1;
      return `${days}天`;
    })();

    rows.push({
      type: "box", layout: "vertical", margin: i > 0 ? "lg" : "none",
      contents: [
        {
          type: "box", layout: "horizontal", alignItems: "center",
          contents: [
            {
              type: "box", layout: "vertical", flex: 0,
              contents: [{ type: "text", text: r.type, size: "xxs", color: "#FFFFFF", align: "center" }],
              backgroundColor: getLeaveTypeColor(r.type), cornerRadius: "4px",
              paddingAll: "3px", paddingStart: "6px", paddingEnd: "6px",
            },
            {
              type: "box", layout: "vertical", flex: 0, margin: "sm",
              contents: [{ type: "text", text: s.label, size: "xxs", color: s.color, align: "center" }],
              backgroundColor: `${s.color}15`, cornerRadius: "4px",
              paddingAll: "3px", paddingStart: "6px", paddingEnd: "6px",
            },
            { type: "text", text: hoursText, size: "xs", color: "#666666", align: "end", flex: 1 },
          ],
        },
        { type: "text", text: dateText, size: "xs", color: "#888888", margin: "xs" },
        ...(r.startTime && r.endTime ? [{ type: "text", text: `${r.startTime} ~ ${r.endTime}`, size: "xxs", color: "#AAAAAA", margin: "xs" }] : []),
        ...(r.reason ? [{ type: "text", text: `原因：${r.reason}`, size: "xxs", color: "#AAAAAA", margin: "xs", wrap: true }] : []),
      ],
    });

    if (i < records.length - 1) {
      rows.push({ type: "separator", margin: "md", color: "#F0F0F0" });
    }
  });

  return {
    type: "flex", altText: `${year} 年休假明細`,
    contents: {
      type: "bubble", size: "mega",
      header: {
        type: "box", layout: "vertical",
        contents: [
          { type: "text", text: "📋 休假明細", size: "xl", color: "#FFFFFF", weight: "bold" },
          { type: "text", text: `${year} 年度 · 共 ${records.length} 筆`, size: "xs", color: "#FFFFFFCC", margin: "xs" },
        ],
        backgroundColor: "#6366F1", paddingAll: "lg",
      },
      body: { type: "box", layout: "vertical", contents: rows, paddingAll: "lg" },
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

  const twNow = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const monthLabel = `${twNow.getUTCFullYear()}/${String(twNow.getUTCMonth() + 1).padStart(2, "0")}`;

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

// ===== Submit Leave Request =====

async function submitLeaveRequest(
  supabase: any, lineUserId: string, profile: any,
  leaveType: string, startDate: string, endDate: string, reason: string,
  replyToken: string, LINE_TOKEN: string,
  startTime?: string, endTime?: string, hours?: number
) {
  // Check overlap
  const { data: overlapping } = await supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date")
    .eq("user_id", profile.user_id)
    .in("status", ["pending", "approved"])
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (overlapping && overlapping.length > 0) {
    const existing = overlapping[0];
    await clearState(supabase, lineUserId);
    await replyMessage(replyToken, LINE_TOKEN, [
      buildTextMessage(`❌ 日期重疊！\n您已有一筆「${existing.leave_type}」假單（${existing.start_date} ~ ${existing.end_date}）與此日期重疊，無法重複申請。`),
    ]);
    return;
  }

  const insertData: any = {
    user_id: profile.user_id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason,
  };
  if (startTime) insertData.start_time = startTime;
  if (endTime) insertData.end_time = endTime;
  if (hours) insertData.hours = hours;

  const { error: insertErr } = await supabase.from("leave_requests").insert(insertData);
  await clearState(supabase, lineUserId);

  if (insertErr) {
    await replyMessage(replyToken, LINE_TOKEN, [
      buildTextMessage(`❌ 申請失敗：${insertErr.message}`),
    ]);
  } else {
    await replyMessage(replyToken, LINE_TOKEN, [
      buildSuccessBubble(leaveType, startDate, endDate, reason, startTime, endTime, hours),
    ]);
    // Notify admin
    const NOTIFY_TARGET = Deno.env.get("LINE_NOTIFY_TARGET_ID");
    if (NOTIFY_TARGET) {
      const dateText = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
      const bodyContents: any[] = [
        { type: "box", layout: "horizontal", margin: "md", contents: [
          { type: "text", text: "員工", size: "sm", color: "#AAAAAA", flex: 2 },
          { type: "text", text: `${profile.name}${profile.department ? ` (${profile.department})` : ""}`, size: "sm", color: "#333333", weight: "bold", flex: 5, wrap: true },
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
      ];

      if (startTime && endTime) {
        bodyContents.push(
          { type: "separator", margin: "md", color: "#F0F0F0" },
          { type: "box", layout: "horizontal", margin: "md", contents: [
            { type: "text", text: "時段", size: "sm", color: "#AAAAAA", flex: 2 },
            { type: "text", text: `${startTime} ~ ${endTime}`, size: "sm", color: "#333333", weight: "bold", flex: 5 },
          ]},
        );
      }
      if (hours) {
        bodyContents.push(
          { type: "separator", margin: "md", color: "#F0F0F0" },
          { type: "box", layout: "horizontal", margin: "md", contents: [
            { type: "text", text: "時數", size: "sm", color: "#AAAAAA", flex: 2 },
            { type: "text", text: `${hours}h（${formatHoursDisplay(hours, profile.daily_work_hours || 8)}）`, size: "sm", color: "#333333", weight: "bold", flex: 5 },
          ]},
        );
      }
      if (reason) {
        bodyContents.push(
          { type: "separator", margin: "md", color: "#F0F0F0" },
          { type: "box", layout: "horizontal", margin: "md", contents: [
            { type: "text", text: "原因", size: "sm", color: "#AAAAAA", flex: 2 },
            { type: "text", text: reason, size: "sm", color: "#333333", weight: "bold", flex: 5, wrap: true },
          ]},
        );
      }

      const notifyBubble = {
        type: "bubble",
        header: { type: "box", layout: "vertical", contents: [
          { type: "text", text: "📨 新休假申請 (LINE)", size: "lg", color: "#FFFFFF", weight: "bold" },
        ], backgroundColor: "#F59E0B", paddingAll: "lg" },
        body: { type: "box", layout: "vertical", paddingAll: "lg", contents: bodyContents },
        footer: { type: "box", layout: "vertical", contents: [
          { type: "text", text: "⏳ 請前往後台審核", size: "xs", color: "#F59E0B", align: "center" },
        ], paddingAll: "md", backgroundColor: "#FFFBEB" },
      };
      fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LINE_TOKEN}` },
        body: JSON.stringify({ to: NOTIFY_TARGET, messages: [{ type: "flex", altText: `新休假申請：${profile.name} - ${leaveType}`, contents: notifyBubble }] }),
      }).catch(() => {});
    }
  }
}

// ===== Balance query helper =====

async function queryBalance(supabase: any, profile: any, showAll: boolean) {
  const { data: policies } = await supabase
    .from("leave_policies")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("sort_order");

  const { data: annualRules } = await supabase
    .from("annual_leave_rules")
    .select("min_months, max_months, days")
    .order("min_months");

  const year = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getUTCFullYear();
  const { data: leaves } = await supabase
    .from("leave_requests")
    .select("leave_type, start_date, end_date, hours")
    .eq("user_id", profile.user_id)
    .in("status", ["approved", "pending"])
    .gte("start_date", `${year}-01-01`)
    .lte("start_date", `${year}-12-31`);

  const dailyWorkHours = profile.daily_work_hours || 8;

  const usedHoursMap = new Map<string, number>();
  for (const l of leaves ?? []) {
    const h = l.hours || ((Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1) * dailyWorkHours);
    usedHoursMap.set(l.leave_type, (usedHoursMap.get(l.leave_type) ?? 0) + h);
  }

  const dynamicAnnualDays = calculateAnnualDays(profile.hire_date, annualRules ?? []);

  const balances = (policies ?? []).map((p: any) => {
    const totalDays = p.leave_type === "特休" && dynamicAnnualDays !== null ? dynamicAnnualDays : p.default_days;
    return {
      type: p.leave_type,
      totalHours: totalDays * dailyWorkHours,
      usedHours: usedHoursMap.get(p.leave_type) ?? 0,
      color: getLeaveTypeColor(p.leave_type),
      dailyWorkHours,
    };
  });

  return buildBalanceBubble(balances, showAll);
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
        .select("user_id, name, department, hire_date, daily_work_hours")
        .eq("line_user_id", userId)
        .maybeSingle();

      // --- Handle postback ---
      if (event.type === "postback") {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get("action");

        // Cancel leave flow
        if (action === "cancel_leave") {
          await clearState(supabase, userId);
          await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("已取消申請。")]);
          continue;
        }

        if (!profile) {
          await replyMessage(replyToken, LINE_TOKEN, [buildBindPrompt()]);
          continue;
        }

        // Show all balance
        if (action === "show_all_balance") {
          const bubble = await queryBalance(supabase, profile, true);
          await replyMessage(replyToken, LINE_TOKEN, [bubble]);
          continue;
        }

        // Show other leave types
        if (action === "show_other_types") {
          const [{ data: policies }, { data: annualRules }] = await Promise.all([
            supabase.from("leave_policies").select("*").eq("is_active", true).order("category").order("sort_order"),
            supabase.from("annual_leave_rules").select("min_months, max_months, days").order("min_months"),
          ]);
          if (!policies?.length) {
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("⚠️ 目前無其他假別。")]);
            continue;
          }
          const annualDays = calculateAnnualDays(profile.hire_date, annualRules ?? []);
          await replyMessage(replyToken, LINE_TOKEN, [buildOtherLeaveTypeCarousel(policies, annualDays)]);
          continue;
        }

        // Step 1: User selected leave type → show start date picker
        if (action === "select_leave") {
          const leaveType = params.get("type")!;
          await setState(supabase, userId, "await_start_date", { leaveType });
          await replyMessage(replyToken, LINE_TOKEN, [buildStartDatePicker(leaveType)]);
          continue;
        }

        // Step 2: User picked start date via datetime picker → show end date picker
        if (action === "pick_start_date") {
          const leaveType = params.get("type")!;
          const startDate = event.postback.params?.date;
          if (!startDate) {
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("❌ 無法取得日期，請重試。")]);
            continue;
          }
          await setState(supabase, userId, "await_end_date", { leaveType, startDate });
          await replyMessage(replyToken, LINE_TOKEN, [buildEndDatePicker(leaveType, startDate)]);
          continue;
        }

        // Step 3a: User picked end date → show full day prompt
        if (action === "pick_end_date") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          const endDate = event.postback.params?.date;
          if (!endDate) {
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("❌ 無法取得日期，請重試。")]);
            continue;
          }
          await setState(supabase, userId, "await_full_day", { leaveType, startDate, endDate });
          await replyMessage(replyToken, LINE_TOKEN, [buildFullDayPrompt(leaveType, startDate, endDate)]);
          continue;
        }

        // Step 3b: Same day shortcut → show full day prompt
        if (action === "same_day") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          await setState(supabase, userId, "await_full_day", { leaveType, startDate, endDate: startDate });
          await replyMessage(replyToken, LINE_TOKEN, [buildFullDayPrompt(leaveType, startDate, startDate)]);
          continue;
        }

        // Step 4a: Full day → go to reason
        if (action === "full_day") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          const endDate = params.get("end")!;
          const dailyWorkHours = profile.daily_work_hours || 8;
          const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
          const hours = days * dailyWorkHours;
          await setState(supabase, userId, "await_reason", { leaveType, startDate, endDate, startTime: "09:00", endTime: "18:00", hours: String(hours) });
          await replyMessage(replyToken, LINE_TOKEN, [buildReasonPrompt(leaveType, startDate, endDate, undefined, undefined, hours)]);
          continue;
        }

        // Step 4b: Pick time → ask start time
        if (action === "pick_time") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          const endDate = params.get("end")!;
          await setState(supabase, userId, "await_start_time", { leaveType, startDate, endDate });
          await replyMessage(replyToken, LINE_TOKEN, [
            buildTimeQuickReply("請選擇開始時間：", "set_start_time", leaveType, startDate, endDate),
          ]);
          continue;
        }

        // Step 4c: Set start time → ask end time
        if (action === "set_start_time") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          const endDate = params.get("end")!;
          const time = params.get("time")!;
          await setState(supabase, userId, "await_end_time", { leaveType, startDate, endDate, startTime: time });
          await replyMessage(replyToken, LINE_TOKEN, [
            buildTimeQuickReply(`開始時間：${time}\n請選擇結束時間：`, "set_end_time", leaveType, startDate, endDate),
          ]);
          continue;
        }

        // Step 4d: Set end time → calculate hours → go to reason
        if (action === "set_end_time") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          const endDate = params.get("end")!;
          const endTime = params.get("time")!;
          const state = await getState(supabase, userId);
          const startTime = state?.data?.startTime || "09:00";
          const dailyWorkHours = profile.daily_work_hours || 8;

          // Calculate hours
          const timeToHours = (t: string) => { const [h, m] = t.split(":").map(Number); return h + m / 60; };
          const sTime = timeToHours(startTime);
          const eTime = timeToHours(endTime);
          const diffDays = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
          let hours: number;
          if (diffDays === 0) {
            hours = Math.max(0, Math.round((eTime - sTime) * 2) / 2);
          } else {
            const workEnd = 9 + dailyWorkHours;
            const firstDayHours = Math.max(0, Math.round((workEnd - sTime) * 2) / 2);
            const lastDayHours = Math.max(0, Math.round((eTime - 9) * 2) / 2);
            const middleDays = Math.max(0, diffDays - 1);
            hours = firstDayHours + (middleDays * dailyWorkHours) + lastDayHours;
          }

          await setState(supabase, userId, "await_reason", { leaveType, startDate, endDate, startTime, endTime, hours: String(hours) });
          await replyMessage(replyToken, LINE_TOKEN, [buildReasonPrompt(leaveType, startDate, endDate, startTime, endTime, hours)]);
          continue;
        }

        // Step 5: Skip reason → submit directly
        if (action === "skip_reason") {
          const leaveType = params.get("type")!;
          const startDate = params.get("start")!;
          const endDate = params.get("end")!;
          const st = params.get("st") || undefined;
          const et = params.get("et") || undefined;
          const h = params.get("hours") ? Number(params.get("hours")) : undefined;
          await submitLeaveRequest(supabase, userId, profile, leaveType, startDate, endDate, "", replyToken, LINE_TOKEN, st, et, h);
          continue;
        }

        continue;
      }

      // --- Handle text message ---
      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text.trim();

        // Binding flow (not bound yet)
        if (!profile) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          let emailToCheck = text.toLowerCase();
          if (emailToCheck.startsWith("綁定")) {
            emailToCheck = emailToCheck.replace(/^綁定\s*/, "").trim();
          }
          if (emailRegex.test(emailToCheck)) {
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const matchedUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === emailToCheck);
            if (matchedUser) {
              await supabase.from("profiles").update({ line_user_id: userId }).eq("user_id", matchedUser.id);
              await replyMessage(replyToken, LINE_TOKEN, [
                buildTextMessage(`✅ 綁定成功！歡迎使用休假系統。\n\n您可以透過下方選單操作，或傳送：\n📝 申請休假\n📊 查詢休假\n📆 當月休假`),
              ]);
            } else {
              await replyMessage(replyToken, LINE_TOKEN, [
                buildTextMessage("❌ 找不到此 Email，請確認後重新輸入。"),
              ]);
            }
            continue;
          }
          await replyMessage(replyToken, LINE_TOKEN, [buildBindPrompt()]);
          continue;
        }

        // Check if user is in a conversation state
        const state = await getState(supabase, userId);

        // Cancel command
        if (text === "取消") {
          if (state) {
            await clearState(supabase, userId);
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("已取消申請。")]);
          } else {
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("目前沒有進行中的操作。")]);
          }
          continue;
        }

        // Handle await_reason state: user typing reason text
        if (state?.step === "await_reason") {
          const { leaveType, startDate, endDate, startTime, endTime, hours } = state.data;
          await submitLeaveRequest(
            supabase, userId, profile, leaveType, startDate, endDate, text, replyToken, LINE_TOKEN,
            startTime || undefined, endTime || undefined, hours ? Number(hours) : undefined
          );
          continue;
        }

        // Fallback: text date input while in leave flow
        if (state?.step === "await_start_date" || state?.step === "await_end_date") {
          const leaveType = state.data.leaveType;
          const dateMatch = text.match(/^(\d{4}-\d{2}-\d{2})(?:\s*[~～\-至到]\s*(\d{4}-\d{2}-\d{2}))?(?:\s+(.+))?$/);
          if (dateMatch) {
            const startDate = state.step === "await_end_date" ? (state.data.startDate || dateMatch[1]) : dateMatch[1];
            const endDate = dateMatch[2] || (state.step === "await_end_date" ? dateMatch[1] : dateMatch[1]);
            const reason = dateMatch[3] || "";
            if (reason) {
              // User provided reason inline with date, calculate full day hours and submit
              const dailyWorkHours = profile.daily_work_hours || 8;
              const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
              const hours = days * dailyWorkHours;
              await submitLeaveRequest(supabase, userId, profile, leaveType, startDate, endDate, reason, replyToken, LINE_TOKEN, "09:00", "18:00", hours);
            } else {
              // Show full day prompt
              await setState(supabase, userId, "await_full_day", { leaveType, startDate, endDate });
              await replyMessage(replyToken, LINE_TOKEN, [buildFullDayPrompt(leaveType, startDate, endDate)]);
            }
            continue;
          }
          await replyMessage(replyToken, LINE_TOKEN, [
            buildTextMessage("❌ 日期格式不正確。\n請使用日期選擇器，或輸入格式：2026-03-01\n\n傳送「取消」可放棄申請。"),
          ]);
          continue;
        }

        // --- Command dispatch ---
        if (text.includes("申請休假")) {
          const [{ data: policies }, { data: annualRules }] = await Promise.all([
            supabase.from("leave_policies").select("*").eq("is_active", true).order("category").order("sort_order"),
            supabase.from("annual_leave_rules").select("min_months, max_months, days").order("min_months"),
          ]);
          if (!policies?.length) {
            await replyMessage(replyToken, LINE_TOKEN, [buildTextMessage("⚠️ 目前無可用假別，請聯繫管理員。")]);
            continue;
          }
          const annualDays = calculateAnnualDays(profile.hire_date, annualRules ?? []);
          await replyMessage(replyToken, LINE_TOKEN, [buildLeaveTypeCarousel(policies, annualDays)]);
          continue;
        }

        if (text.includes("查詢休假") || text.includes("查詢假期") || text.includes("假期餘額") || text.includes("休假餘額")) {
          const bubble = await queryBalance(supabase, profile, false);
          await replyMessage(replyToken, LINE_TOKEN, [bubble]);
          continue;
        }

        if (text.includes("休假明細")) {
          const year = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getUTCFullYear();
          const { data: leaves } = await supabase
            .from("leave_requests")
            .select("leave_type, start_date, end_date, status, reason, hours, start_time, end_time")
            .eq("user_id", profile.user_id)
            .gte("start_date", `${year}-01-01`)
            .lte("start_date", `${year}-12-31`)
            .order("start_date", { ascending: false });

          const records = (leaves ?? []).map((l: any) => ({
            type: l.leave_type,
            start: l.start_date,
            end: l.end_date,
            status: l.status,
            reason: l.reason || "",
            hours: l.hours || undefined,
            startTime: l.start_time || undefined,
            endTime: l.end_time || undefined,
          }));

          await replyMessage(replyToken, LINE_TOKEN, [buildLeaveDetailBubble(records)]);
          continue;
        }

        if (text.includes("當月休假")) {
          const twNow = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
          const monthStart = `${twNow.getUTCFullYear()}-${String(twNow.getUTCMonth() + 1).padStart(2, "0")}-01`;
          const nextMonth = new Date(Date.UTC(twNow.getUTCFullYear(), twNow.getUTCMonth() + 1, 0));
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

        // Default reply: guide to Rich Menu
        const APP_URL = "https://happy139.lovable.app";
        await replyMessage(replyToken, LINE_TOKEN, [{
          type: "text",
          text: "👋 請使用下方圖文選單操作休假功能。\n\n若選單未顯示，也可輸入以下指令：\n📝 申請休假\n📊 查詢休假\n📋 休假明細\n📆 當月休假",
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "📝 申請休假", text: "申請休假" } },
              { type: "action", action: { type: "message", label: "📊 查詢休假", text: "查詢休假" } },
              { type: "action", action: { type: "message", label: "📋 休假明細", text: "休假明細" } },
              { type: "action", action: { type: "message", label: "📆 當月休假", text: "當月休假" } },
              { type: "action", action: { type: "uri", label: "🌐 網頁版", uri: `${APP_URL}/request-leave` } },
            ],
          },
        }]);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
