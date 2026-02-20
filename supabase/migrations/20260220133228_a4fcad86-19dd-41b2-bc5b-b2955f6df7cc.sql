
-- HR Settings table
CREATE TABLE public.rh_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  guests_per_server INTEGER NOT NULL DEFAULT 25,
  guests_per_chef INTEGER NOT NULL DEFAULT 60,
  guests_per_bartender INTEGER NOT NULL DEFAULT 80,
  head_waiter_enabled BOOLEAN NOT NULL DEFAULT true,
  coeff_mariage NUMERIC NOT NULL DEFAULT 1.2,
  coeff_corporate NUMERIC NOT NULL DEFAULT 1.0,
  coeff_anniversaire NUMERIC NOT NULL DEFAULT 1.1,
  auto_replace_after_hours INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rh_settings_user_unique UNIQUE (user_id)
);

ALTER TABLE public.rh_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rh settings" ON public.rh_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_rh_settings_updated_at
  BEFORE UPDATE ON public.rh_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp Templates table
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp templates" ON public.whatsapp_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add staff requirement columns to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS staff_servers INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS staff_chefs INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS staff_bartenders INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS staff_head_waiter INTEGER DEFAULT NULL;

-- Add role column to event_staff for category tracking (serveur, chef, barman, maitre_hotel)
-- Already has role_assigned, so we're good

-- Add sent_at column to event_staff for tracking when WhatsApp was sent
ALTER TABLE public.event_staff
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ DEFAULT NULL;
