
-- Create custom_templates table for storing user template structures
CREATE TABLE public.custom_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('client', 'traiteur', 'maitreHotel')),
  structure jsonb NOT NULL DEFAULT '{"titre":"","sections":[]}'::jsonb,
  source_filename text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_type)
);

-- Enable RLS
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own templates"
  ON public.custom_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON public.custom_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
