ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS share_token text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_share_token_unique
  ON public.bookings(share_token)
  WHERE share_token IS NOT NULL;
