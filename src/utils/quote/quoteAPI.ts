import { supabase } from "../../lib/supabaseClient";
import { Quote } from "../../types/quote";

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
  console.log("DEBUG: Calling payment intent function");
  console.log("DEBUG: Quote ID:", quoteId);
  console.log("DEBUG: Amount:", amount);

  // Remove session check for anonymous quote payments
  // Quote payments should work without user authentication

  try {
    const { data, error } = await supabase.functions.invoke(
      "create-quote-payment-intent",
      {
        body: {
          amount,
          quoteId,
          currency: "usd",
        },
      }
    );

    console.log("DEBUG: Function invoke result:", { data, error });

    if (error) {
      console.error("DEBUG: Supabase function error:", error);
      throw new Error(error.message || "Failed to create payment intent");
    }

    return {
      clientSecret: data?.clientSecret || data?.client_secret,
      error: null,
    };
  } catch (error: any) {
    console.error("DEBUG: callQuotePaymentIntent error:", error);

    // Return error in expected format
    return {
      clientSecret: null,
      error: error.message || "Failed to create payment intent",
    };
  }
};
