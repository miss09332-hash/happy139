import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LINE_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!LINE_TOKEN) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");

    const { mode, to, message } = await req.json();

    // Mode: "daily-summary" - build message from today's leaves
    if (mode === "daily-summary") {
      const targetId = to || Deno.env.get("LINE_NOTIFY_TARGET_ID");
      if (!targetId) throw new Error("No LINE target ID configured");

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const today = new Date().toISOString().split("T")[0];

      // Fetch approved leaves overlapping today
      const { data: leaves, error: lErr } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today);

      if (lErr) throw lErr;

      let text: string;
      if (!leaves || leaves.length === 0) {
        text = `📋 ${today} 休假提醒\n\n今日無人休假 🎉`;
      } else {
        const userIds = [...new Set(leaves.map((l: any) => l.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, department")
          .in("user_id", userIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

        const lines = leaves.map((l: any) => {
          const p = profileMap.get(l.user_id);
          const name = p?.name ?? "未知";
          const dept = p?.department ? `(${p.department})` : "";
          return `• ${name}${dept} - ${l.leave_type}（${l.start_date} ~ ${l.end_date}）`;
        });

        text = `📋 ${today} 休假提醒\n\n今日共 ${leaves.length} 人休假：\n${lines.join("\n")}`;
      }

      // Also fetch pending count
      const { count: pendingCount } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingCount && pendingCount > 0) {
        text += `\n\n⏳ 目前有 ${pendingCount} 筆待審核申請`;
      }

      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_TOKEN}`,
        },
        body: JSON.stringify({ to: targetId, messages: [{ type: "text", text }] }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`LINE API error [${response.status}]: ${errorBody}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: text }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mode: direct message (original behavior)
    if (!to || !message) {
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
      body: JSON.stringify({ to, messages: [{ type: "text", text: message }] }),
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
