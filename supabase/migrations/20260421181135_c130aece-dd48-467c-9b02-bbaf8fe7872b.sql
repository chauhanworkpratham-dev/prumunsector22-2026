-- Restrict listing on public buckets — allow direct file reads but block bucket listing
DROP POLICY IF EXISTS "Anyone can read brochures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read training files" ON storage.objects;

-- Re-add SELECT policies that exclude listing (no name = NULL guard;
-- typical Supabase listing uses prefix queries, so we rely on the bucket being public via direct CDN URLs).
-- Easiest fix: keep buckets public for direct URL fetches; remove the open SELECT policy on storage.objects
-- so list calls (storage.from('bucket').list()) require authenticated secretariat.
CREATE POLICY "Secretariats can list brochures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'secretariat'));

CREATE POLICY "Secretariats can list training files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'secretariat'));

-- Tighten registrations INSERT: require an edition_id that exists and is not archived.
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
CREATE POLICY "Anyone can register in active edition"
  ON public.registrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.editions e
      WHERE e.id = edition_id AND e.is_active = true AND e.archived_at IS NULL
    )
  );

-- Tighten ID upload inserts: only allow paths under 'public/' prefix to prevent enumeration of arbitrary names
DROP POLICY IF EXISTS "Anyone can upload ID images" ON storage.objects;
CREATE POLICY "Anyone can upload ID images to incoming folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'id-uploads' AND (storage.foldername(name))[1] = 'incoming');