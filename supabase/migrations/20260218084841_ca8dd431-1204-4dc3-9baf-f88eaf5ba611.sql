
-- OAuth tokens pour Gmail/Outlook
CREATE TABLE public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'google' ou 'microsoft'
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  email_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Configuration email du user
CREATE TABLE public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  auto_triage_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Emails reçus et analysés
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_provider_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  category TEXT, -- 'new_lead', 'modification', 'cancellation', 'question'
  is_urgent BOOLEAN DEFAULT false,
  extracted_info JSONB,
  calendar_check JSONB,
  upsell_suggestions JSONB,
  suggested_response TEXT,
  response_sent BOOLEAN DEFAULT false,
  response_sent_at TIMESTAMPTZ,
  final_response_text TEXT,
  client_id UUID REFERENCES public.clients(id),
  event_id UUID REFERENCES public.events(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates de checklist personnalisables
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT, -- null = template par défaut
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tâches générées pour chaque événement
CREATE TABLE public.event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  task_name TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_emails_user ON public.emails(user_id);
CREATE INDEX idx_emails_sender ON public.emails(sender_email);
CREATE INDEX idx_emails_provider_id ON public.emails(email_provider_id);
CREATE INDEX idx_event_tasks_event ON public.event_tasks(event_id);
CREATE INDEX idx_event_tasks_deadline ON public.event_tasks(deadline) WHERE status = 'pending';

-- RLS
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own oauth tokens" ON public.oauth_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own email settings" ON public.email_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own emails" ON public.emails FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own checklist templates" ON public.checklist_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own event tasks" ON public.event_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_tasks.event_id AND events.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_tasks.event_id AND events.user_id = auth.uid()));

-- Realtime pour notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
