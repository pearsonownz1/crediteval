-- Add document_paths column to quotes table
ALTER TABLE public.quotes
ADD COLUMN document_paths text[]; -- Array of text to store multiple paths

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.quotes.document_paths IS 'Stores an array of storage paths for documents uploaded with the quote request.';
