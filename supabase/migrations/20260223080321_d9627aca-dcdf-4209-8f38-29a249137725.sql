
-- Table: announcements (links an event to a public form token)
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  message_content TEXT NOT NULL DEFAULT '',
  staff_needs JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own announcements"
  ON public.announcements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read access via token (for the response form)
CREATE POLICY "Public can read announcements by token"
  ON public.announcements FOR SELECT
  USING (true);

-- Table: form_responses (public submissions from the response form)
CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  role TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a response (public form)
CREATE POLICY "Public can insert form responses"
  ON public.form_responses FOR INSERT
  WITH CHECK (true);

-- Anyone can read form responses (needed for duplicate check)
CREATE POLICY "Public can read form responses"
  ON public.form_responses FOR SELECT
  USING (true);

-- Anyone can update form responses (for upsert logic)
CREATE POLICY "Public can update form responses"
  ON public.form_responses FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Owner can manage form responses through announcements
CREATE POLICY "Users manage own form responses"
  ON public.form_responses FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = form_responses.announcement_id AND a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = form_responses.announcement_id AND a.user_id = auth.uid()
  ));

-- Trigger for updated_at on announcements
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
