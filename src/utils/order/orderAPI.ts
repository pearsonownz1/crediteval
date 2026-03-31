import { supabase } from "../../lib/supabaseClient";
import { ordersTable } from "../../lib/ordersTable";
import { publicEnv } from "../../lib/publicEnv";
import { CustomerInfo } from "../../types/order/index"; // Corrected import path
import { Quote } from "@/types/quote";

type CreateOrderResult = {
  orderId: string;
  editToken: string;
};

const generateOrderEditToken = () =>
  `${crypto.randomUUID()}-${crypto.randomUUID()}`;

const invokeOrderServicesFunction = async (
  payload: Record<string, unknown>
) => {
  const functionUrl = `${publicEnv.supabaseUrl}/functions/v1/update-order-services`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicEnv.supabaseAnonKey,
    },
    body: JSON.stringify(payload),
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

export const createOrder = async (customerInfo: CustomerInfo) => {
  const editToken = generateOrderEditToken();
  const { data, error } = await supabase
    .from(ordersTable)
    .insert([
      {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        status: "pending",
        services: {
          _meta: {
            editToken,
          },
        },
      },
    ])
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const createdOrderId = data?.id;
  if (createdOrderId === null || createdOrderId === undefined) {
    throw new Error("Order created but no order ID was returned.");
  }

  return {
    orderId: String(createdOrderId),
    editToken,
  } as CreateOrderResult;
};

export const updateOrderWithServices = async (
  orderId: string,
  services: any,
  editToken: string,
  status: string
) => {
  return invokeOrderServicesFunction({
    orderId,
    services,
    editToken,
    status,
    finalizeSubmission: true,
  });
};

export const updateOrderServices = async (
  orderId: string,
  services: any,
  editToken: string
) => {
  return invokeOrderServicesFunction({
    orderId,
    services,
    editToken,
  });
};

export const updateOrderServicesWithStatus = async (
  orderId: string,
  services: any,
  editToken: string,
  status: string
) => {
  return invokeOrderServicesFunction({
    orderId,
    services,
    editToken,
    status,
    finalizeSubmission: true,
  });
};

export const callPaymentIntent = async (
  orderId: string,
  amount: number,
  services: any
) => {
  const functionUrl = `${publicEnv.supabaseUrl}/functions/v1/create-payment-intent`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicEnv.supabaseAnonKey,
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
      `${publicEnv.supabaseUrl}/functions/v1/send-order-receipt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publicEnv.supabaseAnonKey,
        },
        body: JSON.stringify({ orderId }),
      }
    );

    if (!response.ok) {
      console.error(`Failed to send receipt email for order ${orderId}`);
    }
  } catch (error) {
    console.error(`Error calling send-order-receipt function:`, error);
  }
};

export const getOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from(ordersTable)
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const createOrderFromQuote = async (
  quote: Quote,
  paymentIntentId: string
) => {
  const nameParts = quote.name.trim().split(" ");
  const lastName = nameParts.length > 1 ? nameParts.pop() : "";
  const firstName = nameParts.join(" ");

  const { data, error } = await supabase
    .from(ordersTable)
    .insert([
      {
        first_name: firstName,
        last_name: lastName,
        email: quote.email,
        services: quote.services,
        status: "paid",
        total_amount: quote.price,
        quote_id: quote.id,
        stripe_payment_intent_id: paymentIntentId,
        document_paths: quote.document_paths,
      },
    ])
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const createdOrderId = data?.id;
  if (createdOrderId === null || createdOrderId === undefined) {
    throw new Error("Order created from quote but no order ID was returned.");
  }

  return String(createdOrderId);
};
