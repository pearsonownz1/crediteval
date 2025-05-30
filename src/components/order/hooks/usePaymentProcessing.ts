import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { OrderData } from "../../../types/order";
import { calculatePrice } from "../../../utils/order/priceCalculation";
import {
  updateOrderWithServices,
  callPaymentIntent,
  sendReceiptEmail,
} from "../../../utils/order/orderAPI";

export const usePaymentProcessing = () => {
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const processPayment = async (
    orderData: OrderData,
    orderId: string,
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
      // Update order with final details
      await updateOrderWithServices(orderId, orderData.services);

      // Create payment intent
      const calculatedAmount = Math.round(calculatePrice(orderData) * 100);
      const { clientSecret, error: backendError } = await callPaymentIntent(
        orderId,
        calculatedAmount,
        orderData.services
      );

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
            billing_details: {
              name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
              email: orderData.customerInfo.email,
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Payment failed. Please try again.");
        setPaymentProcessing(false);
        return false;
      }

      if (paymentIntent?.status === "succeeded") {
        // Send receipt email asynchronously
        sendReceiptEmail(orderId);

        setPaymentProcessing(false);
        onComplete({
          ...orderData,
          orderId,
          paymentIntentId: paymentIntent.id,
        });

        navigate(`/order-success?orderId=${orderId}`);
        return true;
      } else {
        setError("Payment processing. Please wait or contact support.");
        setPaymentProcessing(false);
        return false;
      }
    } catch (err: any) {
      console.error("Payment processing error:", err);
      setError(err.message || "An unexpected error occurred during payment.");
      setPaymentProcessing(false);
      return false;
    }
  };

  return {
    paymentProcessing,
    error,
    setError,
    processPayment,
    isStripeReady: !!(stripe && elements),
  };
};
