ALTER TABLE public.editions
  ADD COLUMN IF NOT EXISTS header_logo_url text,
  ADD COLUMN IF NOT EXISTS qr_message_approved text NOT NULL DEFAULT 'Approved — use this QR to enter',
  ADD COLUMN IF NOT EXISTS qr_message_delegate_pending text NOT NULL DEFAULT 'Pay cash at the venue and ask the secretariat to verify your registration.',
  ADD COLUMN IF NOT EXISTS qr_message_eb_pending text NOT NULL DEFAULT 'EB members don''t pay — the secretariat will approve your access shortly.',
  ADD COLUMN IF NOT EXISTS qr_message_oc_pending text NOT NULL DEFAULT 'OC members don''t pay — the secretariat will approve your access shortly.',
  ADD COLUMN IF NOT EXISTS qr_pending_title text NOT NULL DEFAULT 'Waiting for Secretariat''s approval';