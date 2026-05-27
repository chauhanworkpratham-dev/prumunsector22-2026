-- Allow anonymous receipt uploads + portfolio reselection
DROP POLICY IF EXISTS "Users update own pending registration" ON public.registrations;

CREATE POLICY "Anyone can submit receipt or reselect portfolio"
  ON public.registrations FOR UPDATE
  USING (payment_status <> 'approved')
  WITH CHECK (payment_status IN ('none','pending','rejected'));

-- Storage: payment-receipts open to anon (path includes registration id, secretariat moderates)
DROP POLICY IF EXISTS "Users upload own receipt" ON storage.objects;
DROP POLICY IF EXISTS "Users view own receipt" ON storage.objects;
DROP POLICY IF EXISTS "Users update own receipt" ON storage.objects;

CREATE POLICY "Anyone upload receipt" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-receipts');
CREATE POLICY "Anyone update receipt" ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-receipts');
CREATE POLICY "Anyone read own receipt" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');
