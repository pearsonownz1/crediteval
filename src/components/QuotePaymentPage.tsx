import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
// import { Database } from "@/types/supabase"; // Removed, using custom Quote type
import { Quote } from "@/types/quote"; // Import custom Quote type
import { usePostHog } from "posthog-js/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Elements, CardElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuotePaymentProcessing } from "./quote/hooks/useQuotePaymentProcessing.ts";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
console.log(
  "Stripe Publishable Key used:",
  stripePublishableKey
    ? `${stripePublishableKey.substring(0, 6)}...`
    : "MISSING!"
);

const stripePromise = loadStripe(stripePublishableKey);

// type Quote = Database["public"]["Tables"]["quotes"]["Row"]; // Removed, using custom Quote type

export function QuotePaymentPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    paymentProcessing,
    error: paymentError,
    setError: setPaymentError,
    processQuotePayment,
    isStripeReady,
  } = useQuotePaymentProcessing();
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) {
        setFetchError("Invalid quote link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
      try {
        const { data, error: supabaseFetchError } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", quoteId)
          .single();

        if (supabaseFetchError) {
          if (supabaseFetchError.code === "PGRST116") {
            setFetchError(
              "Quote not found. Please check the link or request a new quote."
            );
          } else {
            throw supabaseFetchError;
          }
        } else if (!data) {
          setFetchError(
            "Quote not found. Please check the link or request a new quote."
          );
        } else {
          if (data.status === "Paid") {
            setFetchError("This quote has already been paid.");
          } else if (
            data.status === "Expired" ||
            (data.expires_at && new Date(data.expires_at) < new Date())
          ) {
            setFetchError(
              "This quote has expired. Please request a new quote."
            );
            if (data.status !== "Expired") {
              await supabase
                .from("quotes")
                .update({ status: "Expired" })
                .eq("id", quoteId);
            }
          } else if (data.status !== "Pending") {
            setFetchError(
              `This quote cannot be paid (status: ${data.status}). Please contact support.`
            );
          } else {
            setQuote(data);
            if (posthog && data.id && data.price) {
              posthog.capture("checkout_started", {
                quote_id: data.id,
                amount: data.price,
                service_type: data.service_type,
              });
            }
          }
        }
      } catch (err: any) {
        console.error("Error fetching quote:", err);
        setFetchError(err.message || "Failed to load quote details.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId, navigate, posthog]);

  const handlePaymentSubmit = async () => {
    if (!quote || !quote.price || !quote.id) {
      setPaymentError(
        "Cannot proceed with payment. Quote details are missing."
      );
      return;
    }

    await processQuotePayment(
      quote.id,
      Math.round(quote.price * 100),
      (data) => {
        console.log("Payment successful:", data);
      }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading quote details...</p>
      </div>
    );
  }

  const displayError = fetchError || paymentError;

  return (
    <Elements stripe={stripePromise}>
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Pay Your Quote</CardTitle>
            <CardDescription>
              Review your quote details and proceed to payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}
            {quote && !displayError && (
              <div className="space-y-2">
                <p>
                  <strong>Quote ID:</strong> {quote.id.substring(0, 8)}...
                </p>
                <p>
                  <strong>Client:</strong> {quote.name}
                </p>
                <p>
                  <strong>Email:</strong> {quote.email}
                </p>
                <p>
                  <strong>Service:</strong> {quote.service_type}
                </p>

                {/* Display new fields from services JSON */}
                {quote.services?.delivery && (
                  <p>
                    <strong>Delivery:</strong> {quote.services.delivery}
                  </p>
                )}
                {quote.services?.urgency && (
                  <p>
                    <strong>Urgency:</strong> {quote.services.urgency}
                  </p>
                )}
                {quote.service_type === "Certified Translation" && (
                  <>
                    {quote.services?.language_from && (
                      <p>
                        <strong>Language From:</strong>{" "}
                        {quote.services.language_from}
                      </p>
                    )}
                    {quote.services?.language_to && (
                      <p>
                        <strong>Language To:</strong>{" "}
                        {quote.services.language_to}
                      </p>
                    )}
                    {quote.services?.total_page && (
                      <p>
                        <strong>Total Page:</strong> {quote.services.total_page}
                      </p>
                    )}
                  </>
                )}

                <p className="text-lg font-semibold">
                  <strong>Total Price:</strong> $
                  {Number(quote.price).toFixed(2)}
                </p>
                {quote.expires_at && (
                  <p className="text-sm text-muted-foreground">
                    Expires on:{" "}
                    {new Date(quote.expires_at).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-md font-semibold mb-2">
                    Credit Card Details
                  </h3>
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#424770",
                          "::placeholder": {
                            color: "#aab7c4",
                          },
                        },
                        invalid: {
                          color: "#9e2146",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          {!displayError && quote && (
            <CardFooter>
              <Button
                className="w-full"
                onClick={handlePaymentSubmit}
                disabled={paymentProcessing || loading || !isStripeReady}>
                {paymentProcessing ? "Processing..." : "Pay Quote"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </Elements>
  );
}
