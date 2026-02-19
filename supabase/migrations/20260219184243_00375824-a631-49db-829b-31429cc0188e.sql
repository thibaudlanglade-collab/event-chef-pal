
-- Table catalogue de prestations
CREATE TABLE public.catalog_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'restauration',
  pricing_type text NOT NULL DEFAULT 'quantity',
  internal_cost numeric NOT NULL DEFAULT 0,
  margin_percent numeric NOT NULL DEFAULT 30,
  sale_price numeric GENERATED ALWAYS AS (internal_cost * (1 + margin_percent / 100)) STORED,
  default_tva numeric NOT NULL DEFAULT 10,
  unit text DEFAULT 'unité',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own catalog items"
  ON public.catalog_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour filtrage rapide
CREATE INDEX idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX idx_catalog_items_user ON public.catalog_items(user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
