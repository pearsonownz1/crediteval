import { supabase } from "../../lib/supabaseClient";
import { Quote } from "../../types/quote"; // Assuming you have a Quote type

export const getQuote = async (quoteId: string) => {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateQuoteStatus = async (quoteId: string, status: string) => {
  const { error } = await supabase
    .from("quotes")
    .update({ status: status })
    .eq("id", quoteId);

  if (error) {
    throw new Error(`Failed to update quote status: ${error.message}`);
  }
};

export const callQuotePaymentIntent = async (
  quoteId: string,
  amount: number
) => {
  const functionUrl = `${
    import.meta.env.VITE_SUPABASE_URL
  }/functions/v1/create-quote-payment-intent`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      amount,
      quoteId,
      currency: "usd",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: "Failed to parse error response",
    }));
    throw new Error(
      errorBody.error ||
        `Function invocation failed with status ${response.status}`
    );
  }

  return response.json();
};
