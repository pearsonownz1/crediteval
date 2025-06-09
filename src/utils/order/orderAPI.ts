import { supabase } from "../../lib/supabaseClient";
import { CustomerInfo } from "../../types/order/index"; // Corrected import path

export const createOrder = async (customerInfo: CustomerInfo) => {
  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      },
    ])
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data?.id?.toString();
};

export const updateOrderWithServices = async (
  orderId: string,
  services: any
) => {
  const { error } = await supabase
    .from("orders")
    .update({
      services: services,
      status: "pending_payment",
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update order details: ${error.message}`);
  }
};

export const updateOrderServices = async (
  orderId: string,
  services: any // Consider defining a more specific type for services if available
) => {
  const functionUrl = `${
    import.meta.env.VITE_SUPABASE_URL
  }/functions/v1/update-order-services`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      orderId,
      services,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: "Failed to parse error response from function",
    }));
    throw new Error(
      errorBody.error ||
        `Function invocation failed with status ${response.status}`
    );
  }

  return response.json();
};

export const callPaymentIntent = async (
  orderId: string,
  amount: number,
  services: any
) => {
  const functionUrl = `${
    import.meta.env.VITE_SUPABASE_URL
  }/functions/v1/create-payment-intent`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      amount,
      orderId,
      services,
      currency: "usd",
      isQuote: false,
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

export const sendReceiptEmail = async (orderId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-receipt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ orderId }),
      }
    );

    if (!response.ok) {
      console.error(`Failed to send receipt email for order ${orderId}`);
    } else {
      console.log(`Receipt email request successful for order ${orderId}`);
    }
  } catch (error) {
    console.error(`Error calling send-order-receipt function:`, error);
  }
};

export const getOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};
