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

    if (error) {
      throw new Error(error.message || "Failed to create payment intent");
    }

    return {
      clientSecret: data?.clientSecret || data?.client_secret,
      error: null,
    };
  } catch (error: any) {
    return {
      clientSecret: null,
      error: error.message || "Failed to create payment intent",
    };
  }
};
