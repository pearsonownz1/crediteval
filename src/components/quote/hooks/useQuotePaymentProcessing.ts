import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import {
  callQuotePaymentIntent,
  updateQuoteStatus,
} from "../../../utils/quote/quoteAPI";
import { Quote } from "../../../types/quote"; // Assuming you have a Quote type

export const useQuotePaymentProcessing = () => {
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const processQuotePayment = async (
    quoteId: string,
    amount: number,
    onComplete: (data: any) => void
  ) => {
    if (!stripe || !elements) {
      setError("Stripe is not ready. Please wait a moment and try again.");
      return false;
    }

    setPaymentProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card details not found. Please try again.");
      setPaymentProcessing(false);
      return false;
    }

    try {
      // Call the Supabase function to create a Payment Intent for the quote
      const { clientSecret, error: backendError } =
        await callQuotePaymentIntent(quoteId, amount);

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
            // Billing details can be added here if available from the quote or user input
            // For now, we'll assume minimal details are needed for quotes
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Payment failed. Please try again.");
        setPaymentProcessing(false);
        return false;
      }

      if (paymentIntent?.status === "succeeded") {
        // Update quote status to 'Paid'
        await updateQuoteStatus(quoteId, "Paid");

        setPaymentProcessing(false);
        onComplete({
          quoteId,
          paymentIntentId: paymentIntent.id,
        });

        navigate(`/quote-success?quoteId=${quoteId}`); // Redirect to a success page
        return true;
      } else {
        setError("Payment processing. Please wait or contact support.");
        setPaymentProcessing(false);
        return false;
      }
    } catch (err: any) {
      console.error("Quote payment processing error:", err);
      setError(err.message || "An unexpected error occurred during payment.");
      setPaymentProcessing(false);
      return false;
    }
  };

  return {
    paymentProcessing,
    error,
    setError,
    processQuotePayment,
    isStripeReady: !!(stripe && elements),
  };
};
