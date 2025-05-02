ALTER TABLE public.quotes
ADD COLUMN stripe_checkout_session_id TEXT;

COMMENT ON COLUMN public.quotes.stripe_checkout_session_id IS 'Stores the Stripe Checkout Session ID associated with the quote payment attempt.';

-- Trivial change to potentially trigger schema cache reload
