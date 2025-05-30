import { OrderData } from "../../types/order/index"; // Corrected import path
import { calculatePrice } from "./priceCalculation";

export const trackCheckoutStarted = async (
  orderData: OrderData,
  orderId: string
) => {
  try {
    if (window._learnq) {
      // Identify the user
      window._learnq.push([
        "identify",
        {
          $email: orderData.customerInfo.email,
          $first_name: orderData.customerInfo.firstName,
          $last_name: orderData.customerInfo.lastName,
          $phone_number: orderData.customerInfo.phone,
        },
      ]);

      // Track checkout_started event
      const klaviyoApiKey = import.meta.env.VITE_KLAVIYO_PRIVATE_API_KEY;

      if (klaviyoApiKey) {
        const estimatedPrice = calculatePrice(orderData.services);
        const resumeLink = `${window.location.origin}/checkout?resume_token=${orderId}`;

        const eventPayload = {
          email: orderData.customerInfo.email,
          metric: "checkout_started",
          quote_id: orderId,
          value: estimatedPrice,
          resume_link: resumeLink,
          service_type: orderData.services.type,
          evaluation_type: orderData.services.evaluationType,
          urgency: orderData.services.urgency,
        };

        const functionUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/send-klaviyo-event`;

        await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(eventPayload),
        });

        console.log("Klaviyo checkout_started event sent successfully");
      }
    }
  } catch (error) {
    console.error("Error during Klaviyo tracking:", error);
  }
};
