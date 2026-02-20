import { supabase } from "@/integrations/supabase/client";

export async function sendLineMessage(to: string, message: string) {
  const { data, error } = await supabase.functions.invoke("send-line-message", {
    body: { to, message },
  });

  if (error) throw error;
  return data;
}
