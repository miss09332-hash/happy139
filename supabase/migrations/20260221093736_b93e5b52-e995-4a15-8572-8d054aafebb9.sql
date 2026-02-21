
CREATE TABLE public.line_conversation_state (
  line_user_id TEXT PRIMARY KEY,
  step TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed - only accessed by edge function via service role
ALTER TABLE public.line_conversation_state ENABLE ROW LEVEL SECURITY;
