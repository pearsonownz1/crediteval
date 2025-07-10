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
  const functionUrl = `${
    import.meta.env.VITE_SUPABASE_URL
  }/functions/v1/create-quote-payment-intent`;

  console.log("DEBUG: Calling payment intent function");
  console.log("DEBUG: Function URL:", functionUrl);
  console.log("DEBUG: Request payload:", { amount, quoteId, currency: "usd" });
  console.log(
    "DEBUG: Using API key:",
    import.meta.env.VITE_SUPABASE_ANON_KEY ? "Present" : "Missing"
  );

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount,
        quoteId,
        currency: "usd",
      }),
    });

    console.log("DEBUG: Function response status:", response.status);
    console.log(
      "DEBUG: Function response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const responseText = await response.text();
    console.log("DEBUG: Raw response text:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("DEBUG: Failed to parse response as JSON:", parseError);
      throw new Error(`Invalid JSON response from function: ${responseText}`);
    }

    console.log("DEBUG: Parsed response data:", responseData);

    if (!response.ok) {
      console.error("DEBUG: Function returned error status:", response.status);
      console.error("DEBUG: Error response body:", responseData);

      const errorMessage =
        responseData?.error ||
        responseData?.message ||
        `Function invocation failed with status ${response.status}`;

      throw new Error(errorMessage);
    }

    // Return the response data
    return {
      clientSecret: responseData.clientSecret || responseData.client_secret,
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
