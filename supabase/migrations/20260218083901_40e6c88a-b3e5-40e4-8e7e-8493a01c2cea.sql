
-- Tables fournisseurs
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    franco_threshold DECIMAL(10,2) DEFAULT 0,
    delivery_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    reference_unit TEXT DEFAULT 'kg',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    master_product_id UUID REFERENCES public.master_products(id) ON DELETE SET NULL,
    raw_label TEXT NOT NULL,
    external_ref TEXT,
    raw_unit TEXT,
    current_price DECIMAL(10,3),
    conversion_factor DECIMAL(10,3) DEFAULT 1,
    last_update TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own suppliers" ON public.suppliers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own master products" ON public.master_products FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own supplier products" ON public.supplier_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_products.supplier_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id = supplier_products.supplier_id AND s.user_id = auth.uid()));
