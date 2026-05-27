ALTER TABLE public.page_backgrounds
  ADD COLUMN IF NOT EXISTS image_url_dark text,
  ADD COLUMN IF NOT EXISTS opacity_dark numeric NOT NULL DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS fit_dark text NOT NULL DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS position_dark text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS blur_dark integer NOT NULL DEFAULT 0;