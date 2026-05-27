
-- Page backgrounds for public pages and delegate portfolio
CREATE TABLE public.page_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_id UUID NOT NULL,
  page_key TEXT NOT NULL,
  image_url TEXT,
  opacity NUMERIC NOT NULL DEFAULT 0.25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (edition_id, page_key)
);

ALTER TABLE public.page_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view backgrounds" ON public.page_backgrounds FOR SELECT USING (true);
CREATE POLICY "Secretariats manage backgrounds" ON public.page_backgrounds FOR ALL
  USING (has_role(auth.uid(), 'secretariat'::app_role))
  WITH CHECK (has_role(auth.uid(), 'secretariat'::app_role));

CREATE TRIGGER update_page_backgrounds_updated_at BEFORE UPDATE ON public.page_backgrounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for background images (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('page-backgrounds', 'page-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view background images" ON storage.objects FOR SELECT
  USING (bucket_id = 'page-backgrounds');
CREATE POLICY "Secretariats upload backgrounds" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'page-backgrounds' AND has_role(auth.uid(), 'secretariat'::app_role));
CREATE POLICY "Secretariats update backgrounds" ON storage.objects FOR UPDATE
  USING (bucket_id = 'page-backgrounds' AND has_role(auth.uid(), 'secretariat'::app_role));
CREATE POLICY "Secretariats delete backgrounds" ON storage.objects FOR DELETE
  USING (bucket_id = 'page-backgrounds' AND has_role(auth.uid(), 'secretariat'::app_role));
