import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Quote } from "@/types/quote";
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
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  callQuotePaymentIntent,
  updateQuoteStatus,
} from "@/utils/quote/quoteAPI";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
console.log(
  "Stripe Publishable Key used:",
  stripePublishableKey
    ? `${stripePublishableKey.substring(0, 6)}...`
    : "MISSING!"
);

const stripePromise = loadStripe(stripePublishableKey);

// Payment Form Component - This must be inside Elements context
function PaymentForm({
  quote,
  onPaymentSuccess,
}: {
  quote: Quote;
  onPaymentSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [cardReady, setCardReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handlePaymentSubmit = async () => {
    if (!stripe || !elements) {
      setPaymentError(
        "Stripe is not ready. Please wait a moment and try again."
      );
      return;
    }

    if (!quote || !quote.price || !quote.id) {
      setPaymentError(
        "Cannot proceed with payment. Quote details are missing."
      );
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError(
        "Card details not found. Please refresh the page and try again."
      );
      setPaymentProcessing(false);
      return;
    }

    try {
      // Call the Supabase function to create a Payment Intent for the quote
      const { clientSecret, error: backendError } =
        await callQuotePaymentIntent(quote.id, Math.round(quote.price * 100));

      if (backendError || !clientSecret) {
        throw new Error(
          backendError || "Failed to get payment secret from backend."
        );
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (stripeError) {
        setPaymentError(
          stripeError.message || "Payment failed. Please try again."
        );
        setPaymentProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Update quote status to 'Paid'
        await updateQuoteStatus(quote.id, "Paid");

        // Call the Supabase function to send email to support
        const { data, error: sendEmailError } = await supabase.functions.invoke(
          "send-quote-payment-email",
          {
            body: { quoteId: quote.id, paymentIntentId: paymentIntent.id },
          }
        );

        if (sendEmailError) {
          console.error(
            "Error invoking send-quote-payment-email:",
            sendEmailError
          );
        } else {
          console.log("send-quote-payment-email invoked successfully:", data);
        }

        setPaymentProcessing(false);
        onPaymentSuccess();
        navigate(`/quote-success?quoteId=${quote.id}`);
      } else {
        setPaymentError("Payment processing. Please wait or contact support.");
        setPaymentProcessing(false);
      }
    } catch (err: any) {
      console.error("Quote payment processing error:", err);
      setPaymentError(
        err.message || "An unexpected error occurred during payment."
      );
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
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
                <strong>Language From:</strong> {quote.services.language_from}
              </p>
            )}
            {quote.services?.language_to && (
              <p>
                <strong>Language To:</strong> {quote.services.language_to}
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
          <strong>Total Price:</strong> ${Number(quote.price).toFixed(2)}
        </p>
        {quote.expires_at && (
          <p className="text-sm text-muted-foreground">
            Expires on: {new Date(quote.expires_at).toLocaleDateString()}
          </p>
        )}

        <div className="mt-4 p-4 border rounded-md">
          <h3 className="text-md font-semibold mb-2">Credit Card Details</h3>
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
            onReady={() => {
              console.log("CardElement is ready");
              setCardReady(true);
            }}
            onChange={(event) => {
              if (event.error) {
                setPaymentError(event.error.message);
              } else {
                setPaymentError(null);
              }
            }}
          />
        </div>
      </div>

      {paymentError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        onClick={handlePaymentSubmit}
        disabled={paymentProcessing || !cardReady || !stripe || !elements}>
        {paymentProcessing
          ? "Processing..."
          : !cardReady
          ? "Loading card form..."
          : "Pay Quote"}
      </Button>
    </div>
  );
}

// Main Component
export function QuotePaymentPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handlePaymentSuccess = () => {
    console.log("Payment successful!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading quote details...</p>
      </div>
    );
  }

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
            {fetchError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
            )}
            {quote && !fetchError && (
              <PaymentForm
                quote={quote}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Elements>
  );
}
