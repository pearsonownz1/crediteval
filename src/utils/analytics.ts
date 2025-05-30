import { OrderData } from "../types/order/index"; // Import OrderData

export interface GAOrderData {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}

export const trackGA4Event = (eventName: string, parameters: any) => {
  if (typeof window !== "undefined" && window.gtag) {
    console.log(`Tracking GA4 event: ${eventName}`, parameters);
    window.gtag("event", eventName, parameters);
  } else {
    console.warn("GA4 gtag not available");
  }
};

export const formatOrderForGA4 = (
  orderData: OrderData, // Changed type to OrderData
  orderId: string,
  calculatedPrice: number
): GAOrderData => {
  const items = [];
  let mainServicePrice = calculatedPrice;

  // Calculate delivery fees and adjust main service price
  let deliveryPrice = 0;
  if (orderData.services?.deliveryType === "express") {
    deliveryPrice = 99;
    items.push({
      item_id: "express_delivery",
      item_name: "Express Mail with Tracking",
      category: "Delivery",
      quantity: 1,
      price: deliveryPrice,
    });
  } else if (orderData.services?.deliveryType === "international") {
    deliveryPrice = 150;
    items.push({
      item_id: "international_delivery",
      item_name: "International Delivery",
      category: "Delivery",
      quantity: 1,
      price: deliveryPrice,
    });
  }

  mainServicePrice -= deliveryPrice;

  // Create item based on service type
  if (orderData.services?.type === "translation") {
    items.push({
      item_id: "translation",
      item_name: `Certified Translation (${
        orderData.services?.languageFrom || "N/A"
      } to ${orderData.services?.languageTo || "N/A"})`,
      category: "Translation Services",
      quantity: orderData.services?.pageCount || 1,
      price: mainServicePrice,
    });
  } else if (orderData.services?.type === "evaluation") {
    const evaluationType =
      orderData.services?.evaluationType === "course"
        ? "Course-by-Course"
        : "Document-by-Document";
    items.push({
      item_id: `evaluation_${orderData.services?.evaluationType || "N/A"}`,
      item_name: `Credential Evaluation (${evaluationType})`,
      category: "Evaluation Services",
      quantity: 1,
      price: mainServicePrice,
    });
  } else if (orderData.services?.type === "expert") {
    items.push({
      item_id: "expert_opinion",
      item_name: `Expert Opinion Letter (${
        orderData.services?.visaType || "Various"
      })`,
      category: "Expert Services",
      quantity: 1,
      price: mainServicePrice,
    });
  }

  return {
    transaction_id: orderId,
    value: calculatedPrice,
    currency: "USD",
    items,
  };
};

// 2. Enhanced tracking events to add throughout your OrderWizard component

// Track when user starts checkout (in handleNext for step 0)
export const trackCheckoutStarted = (
  orderData: OrderData, // Changed type to OrderData
  orderId: string,
  calculatedPrice: number
) => {
  const gaData = formatOrderForGA4(orderData, orderId, calculatedPrice);

  trackGA4Event("begin_checkout", {
    currency: "USD",
    value: calculatedPrice,
    items: gaData.items,
  });
};

// Track when user adds service selection (step 1)
export const trackServiceSelected = (
  serviceType: string,
  serviceDetails: any // This type might need refinement based on actual usage
) => {
  trackGA4Event("add_to_cart", {
    currency: "USD",
    value: 0, // Will be calculated later
    items: [
      {
        item_id: serviceType,
        item_name: `${serviceType} service`,
        category: "Services",
        quantity: 1,
      },
    ],
  });
};

// Track payment info entry (step 4)
export const trackAddPaymentInfo = (
  orderData: OrderData, // Changed type to OrderData
  orderId: string,
  calculatedPrice: number
) => {
  const gaData = formatOrderForGA4(orderData, orderId, calculatedPrice);

  trackGA4Event("add_payment_info", {
    currency: "USD",
    value: calculatedPrice,
    payment_type: "credit_card",
    items: gaData.items,
  });
};

// Track successful purchase
export const trackPurchase = (
  orderData: OrderData, // Changed type to OrderData
  orderId: string,
  calculatedPrice: number,
  paymentIntentId: string
) => {
  const gaData = formatOrderForGA4(orderData, orderId, calculatedPrice);

  trackGA4Event("purchase", {
    transaction_id: orderId,
    value: calculatedPrice,
    currency: "USD",
    payment_type: "credit_card",
    shipping_tier: orderData.services?.deliveryType, // Added optional chaining
    items: gaData.items,
  });

  // Also track custom conversion event
  trackGA4Event("order_completed", {
    order_id: orderId,
    payment_intent_id: paymentIntentId,
    service_type: orderData.services?.type, // Added optional chaining
    urgency: orderData.services?.urgency, // Added optional chaining
    delivery_type: orderData.services?.deliveryType, // Added optional chaining
    value: calculatedPrice,
  });
};
