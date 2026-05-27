# Pending Database Migrations

These SQL migrations must be run on your Supabase project to fully activate certain fixes.
Run them via the Supabase SQL Editor (Dashboard → SQL Editor → New query).

---

## Migration 1: Payer Details on Registrations

Stores the payer name and phone number submitted during the payment flow directly
on the registration row, making it visible to the secretariat in the admin console.

```sql
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payer_name  text,
  ADD COLUMN IF NOT EXISTS payer_phone text;
```

---

## Migration 2: Stable Owner Flag on user_roles

Replaces the fragile "earliest created_at = owner" heuristic with an explicit
boolean flag. After running this, manually set `is_owner = true` for the owner
account row in user_roles.

```sql
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- After running the above, identify your owner's user_id and run:
-- UPDATE user_roles SET is_owner = true WHERE user_id = '<your-owner-user-id>' AND role = 'secretariat';
```

---

## Migration 3: Portfolio Assignment Race Condition (Recommended)

Add a unique partial index to prevent two delegates from being assigned the same
portfolio in the same committee. This enforces uniqueness at the database level.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_delegate_committee_portfolio
  ON registrations (edition_id, committee_id, portfolio)
  WHERE role = 'delegate' AND portfolio IS NOT NULL;
```

This will make duplicate-portfolio writes fail at the DB level even if the
client-side TOCTOU check is bypassed.

---

## Migration 4: Server-side Payment Reservation Expiry (Recommended)

Add a `portfolio_reserved_until` column so the server can enforce expiry
independently of whether the user keeps their browser tab open.

```sql
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS portfolio_reserved_until timestamptz;
```

Then create a Supabase scheduled Edge Function (cron) that runs every 2 minutes:

```sql
-- Releases expired portfolio reservations.
UPDATE registrations
SET
  portfolio = NULL,
  committee_id = NULL,
  portfolio_reserved_until = NULL
WHERE
  payment_status NOT IN ('pending', 'approved')
  AND portfolio_reserved_until IS NOT NULL
  AND portfolio_reserved_until < now();
```
