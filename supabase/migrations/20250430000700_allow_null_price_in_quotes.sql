-- Migration to allow null values for the price column in the quotes table.
-- This is necessary because the price is not known when a quote request is initially submitted,
-- but is determined later by staff.

ALTER TABLE public.quotes
ALTER COLUMN price DROP NOT NULL;

COMMENT ON COLUMN public.quotes.price IS 'Price of the service in USD. Can be null initially for quote requests.';
