
-- Sessions de confirmation (une par envoi de message)
CREATE TABLE public.confirmation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.confirmation_sessions ENABLE ROW LEVEL SECURITY;

-- Owner can manage their sessions
CREATE POLICY "Users manage own confirmation sessions"
ON public.confirmation_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public read for confirmation page (via session_id)
CREATE POLICY "Public can read confirmation sessions"
ON public.confirmation_sessions FOR SELECT
USING (true);

-- Demandes individuelles par employé
CREATE TABLE public.confirmation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.confirmation_sessions(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  respondent_firstname text,
  respondent_lastname text,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.confirmation_requests ENABLE ROW LEVEL SECURITY;

-- Owner can manage via session
CREATE POLICY "Users manage own confirmation requests"
ON public.confirmation_requests FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.confirmation_sessions cs
  WHERE cs.id = confirmation_requests.session_id AND cs.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.confirmation_sessions cs
  WHERE cs.id = confirmation_requests.session_id AND cs.user_id = auth.uid()
));

-- Public can read confirmation requests (for confirm page)
CREATE POLICY "Public can read confirmation requests"
ON public.confirmation_requests FOR SELECT
USING (true);

-- Public can update confirmation requests (for confirm page responses)
CREATE POLICY "Public can update confirmation requests"
ON public.confirmation_requests FOR UPDATE
USING (true)
WITH CHECK (true);

-- Public can insert confirmation requests (for unidentified respondents)
CREATE POLICY "Public can insert confirmation requests"
ON public.confirmation_requests FOR INSERT
WITH CHECK (true);

-- Conflits détectés
CREATE TABLE public.conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  event_id_1 uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_id_2 uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false
);

ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conflicts"
ON public.conflicts FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE (e.id = conflicts.event_id_1 OR e.id = conflicts.event_id_2) AND e.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events e
  WHERE (e.id = conflicts.event_id_1 OR e.id = conflicts.event_id_2) AND e.user_id = auth.uid()
));

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  action_url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for confirmation_requests (live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.confirmation_requests;
