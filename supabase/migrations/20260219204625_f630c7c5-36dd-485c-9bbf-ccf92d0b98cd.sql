
-- Étapes personnalisables du pipeline
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#9CA3AF',
  position int NOT NULL DEFAULT 0,
  alert_threshold_days int DEFAULT 5,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cartes pipeline (opportunités)
CREATE TABLE public.pipeline_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  event_id uuid REFERENCES public.events(id),
  quote_id uuid REFERENCES public.quotes(id),
  title text NOT NULL,
  amount decimal(10,2),
  entered_stage_at timestamptz DEFAULT now(),
  last_contacted_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Historique des mouvements
CREATE TABLE public.pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES public.pipeline_stages(id),
  to_stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id),
  moved_at timestamptz DEFAULT now(),
  moved_by uuid,
  note text
);

-- Templates de relance par étape
CREATE TABLE public.pipeline_followup_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage_id uuid NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  subject_template text NOT NULL DEFAULT '',
  body_template text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Relances programmées
CREATE TABLE public.scheduled_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.pipeline_cards(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  email_to text NOT NULL,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_pipeline_cards_user ON public.pipeline_cards(user_id);
CREATE INDEX idx_pipeline_cards_stage ON public.pipeline_cards(stage_id);
CREATE INDEX idx_pipeline_cards_entered ON public.pipeline_cards(entered_stage_at);
CREATE INDEX idx_pipeline_history_card ON public.pipeline_history(card_id);
CREATE INDEX idx_scheduled_followups_pending ON public.scheduled_followups(scheduled_at) WHERE status = 'pending';

-- RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_followup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pipeline stages" ON public.pipeline_stages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own pipeline cards" ON public.pipeline_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own pipeline history" ON public.pipeline_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.pipeline_cards WHERE pipeline_cards.id = pipeline_history.card_id AND pipeline_cards.user_id = auth.uid()));
CREATE POLICY "Users insert own pipeline history" ON public.pipeline_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.pipeline_cards WHERE pipeline_cards.id = pipeline_history.card_id AND pipeline_cards.user_id = auth.uid()));
CREATE POLICY "Users manage own followup templates" ON public.pipeline_followup_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own scheduled followups" ON public.scheduled_followups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pipeline_cards_updated_at BEFORE UPDATE ON public.pipeline_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pipeline_followup_templates_updated_at BEFORE UPDATE ON public.pipeline_followup_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour initialiser les étapes par défaut
CREATE OR REPLACE FUNCTION public.init_default_pipeline_stages()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.pipeline_stages (user_id, name, color, position, alert_threshold_days, is_default)
  VALUES
    (NEW.id, 'Prospect', '#9CA3AF', 0, 7, true),
    (NEW.id, 'Devis envoyé', '#F59E0B', 1, 3, false),
    (NEW.id, 'Négociation', '#3B82F6', 2, 5, false),
    (NEW.id, 'Confirmé', '#10B981', 3, 14, false),
    (NEW.id, 'Équipe créée', '#8B5CF6', 4, 7, false),
    (NEW.id, 'Perdu', '#EF4444', 5, 999, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_user_created_init_pipeline
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.init_default_pipeline_stages();

-- Realtime pour les cartes
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_cards;
