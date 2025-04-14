-- Create the orders table
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text NULL,
    last_name text NULL,
    email text NULL,
    status text NULL,
    document_paths text[] NULL,
    stripe_payment_intent_id text NULL
);

-- Add total_amount column to the orders table
-- Storing amount in cents as an integer is common practice
ALTER TABLE public.orders
ADD COLUMN total_amount integer;

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.orders.total_amount IS 'Total order amount in cents';

-- Optional: Add indexes for commonly queried columns if needed
-- CREATE INDEX idx_orders_status ON public.orders(status);
-- CREATE INDEX idx_orders_email ON public.orders(email);
