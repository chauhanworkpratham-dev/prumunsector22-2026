-- Stage 1 / Stage 2 verification system

-- Editions: payment config + editable copy
ALTER TABLE public.editions
  ADD COLUMN IF NOT EXISTS payment_mode_delegate text NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_mode_eb text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_mode_oc text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS bank_details text,
  ADD COLUMN IF NOT EXISTS payment_qr_url text,
  ADD COLUMN IF NOT EXISTS payment_instructions text DEFAULT 'Scan the QR or send to the UPI ID, then upload your receipt below.',
  ADD COLUMN IF NOT EXISTS txt_pay_upi_btn text NOT NULL DEFAULT 'Pay via UPI',
  ADD COLUMN IF NOT EXISTS txt_pay_cash_notice text NOT NULL DEFAULT 'Please pay cash to the Secretariat at the venue.',
  ADD COLUMN IF NOT EXISTS txt_auto_lock_notice text NOT NULL DEFAULT 'No payment required — your portfolio will lock automatically.',
  ADD COLUMN IF NOT EXISTS txt_receipt_uploaded text NOT NULL DEFAULT 'Receipt uploaded — awaiting Secretariat approval.',
  ADD COLUMN IF NOT EXISTS txt_payment_rejected text NOT NULL DEFAULT 'Payment rejected. Please re-upload your receipt.',
  ADD COLUMN IF NOT EXISTS txt_locked_awaiting_entry text NOT NULL DEFAULT 'Portfolio locked. Awaiting on-site entry verification by the Secretariat.',
  ADD COLUMN IF NOT EXISTS txt_change_portfolio_btn text NOT NULL DEFAULT 'Change Portfolio',
  ADD COLUMN IF NOT EXISTS txt_needs_reselection text NOT NULL DEFAULT 'Both your preferences were taken. Please pick from the remaining open portfolios.',
  ADD COLUMN IF NOT EXISTS txt_upload_receipt text NOT NULL DEFAULT 'Upload payment receipt';

-- Add 'paid' attendance is unrelated. Registrations: payment + entry verification fields
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('none','pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_receipt_path text,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_approved_by uuid,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason text,
  ADD COLUMN IF NOT EXISTS entry_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS entry_verified_by uuid,
  ADD COLUMN IF NOT EXISTS needs_reselection boolean NOT NULL DEFAULT false;

-- Allow users to view their own registration row (needed for status polling)
DROP POLICY IF EXISTS "Users view own registration" ON public.registrations;
CREATE POLICY "Users view own registration"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to upload receipt + change portfolio when bumped
DROP POLICY IF EXISTS "Users update own pending registration" ON public.registrations;
CREATE POLICY "Users update own pending registration"
  ON public.registrations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-qr', 'payment-qr', true)
  ON CONFLICT (id) DO NOTHING;

-- Receipts: owner uploads, secretariat reads
DROP POLICY IF EXISTS "Users upload own receipt" ON storage.objects;
CREATE POLICY "Users upload own receipt" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users view own receipt" ON storage.objects;
CREATE POLICY "Users view own receipt" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own receipt" ON storage.objects;
CREATE POLICY "Users update own receipt" ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Secretariats view receipts" ON storage.objects;
CREATE POLICY "Secretariats view receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts' AND has_role(auth.uid(), 'secretariat'::app_role));

-- Payment QR (public bucket)
DROP POLICY IF EXISTS "Public read payment qr" ON storage.objects;
CREATE POLICY "Public read payment qr" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-qr');

DROP POLICY IF EXISTS "Secretariats manage payment qr" ON storage.objects;
CREATE POLICY "Secretariats manage payment qr" ON storage.objects FOR ALL
  USING (bucket_id = 'payment-qr' AND has_role(auth.uid(), 'secretariat'::app_role))
  WITH CHECK (bucket_id = 'payment-qr' AND has_role(auth.uid(), 'secretariat'::app_role));
