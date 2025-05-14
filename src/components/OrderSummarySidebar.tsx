import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { OrderData } from "../types/order"; // Import from the new types file

interface OrderSummarySidebarProps {
  orderData: OrderData;
}

// Helper function to calculate price (copied from OrderWizard)
const calculatePrice = (currentOrderData: OrderData): number => {
  let totalPrice = 0;
  const { type, pageCount, evaluationType } = currentOrderData.services;

  // Service Costs
  if (type === "translation") {
    const pages = Math.max(1, pageCount || 1);
    totalPrice += pages * 25;
  } else if (type === "evaluation") {
    if (evaluationType === "document") {
      totalPrice += 85;
    } else if (evaluationType === "course") {
      totalPrice += 150;
    }
  } else if (type === "expert") {
    totalPrice += 599;
  }

  // Urgency Multiplier
  switch (currentOrderData.services.urgency) {
    case "expedited":
      totalPrice *= 1.5;
      break;
    case "rush":
      totalPrice *= 2;
      break;
    case "standard":
    default:
      break;
  }

  // Delivery Costs
  if (currentOrderData.services.deliveryType === "express") {
    totalPrice += 99;
  } else if (currentOrderData.services.deliveryType === "international") {
    totalPrice += 150;
  }

  return totalPrice;
};

// Helper function to get service text (copied from OrderWizard ReviewStep)
const getServiceTypeText = (orderData: OrderData) => {
  switch (orderData.services.type) {
    case "translation":
      return "Certified Translation";
    case "evaluation":
      return "Credential Evaluation";
    case "expert":
      return "Expert Opinion Letter";
    default:
      return "Not specified";
  }
};

// Helper function to get urgency text (copied from OrderWizard ReviewStep)
const getUrgencyText = (orderData: OrderData) => {
  switch (orderData.services.urgency) {
    case "standard":
      return "Standard (7-10 days)";
    case "expedited":
      return "Expedited (3-5 days)";
    case "rush":
      return "Rush (1-2 days)";
    default:
      return "Not specified";
  }
};

const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({
  orderData,
}) => {
  const calculatedPrice = calculatePrice(orderData);
  const serviceType = getServiceTypeText(orderData);
  const urgency = getUrgencyText(orderData);
  const { type, pageCount, evaluationType, languageFrom, languageTo } =
    orderData.services;

  // Determine line items based on service type
  const getLineItems = () => {
    let items = [];
    if (type === "translation") {
      items.push({
        name: "Certified Translation",
        quantity: `${pageCount || 1} page(s)`,
        price: (pageCount || 1) * 25,
      });
      items.push({
        name: `Languages`,
        quantity: `${languageFrom} to ${languageTo}`,
        price: null,
      });
    } else if (type === "evaluation") {
      const evalPrice = evaluationType === "document" ? 85 : 150;
      const evalName =
        evaluationType === "document"
          ? "Document-by-Document"
          : "Course-by-Course";
      items.push({
        name: `Credential Evaluation (${evalName})`,
        quantity: 1,
        price: evalPrice,
      });
    } else if (type === "expert") {
      items.push({ name: "Expert Opinion Letter", quantity: 1, price: 599 });
    }

    // Add urgency surcharge if applicable
    let basePrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
    let urgencyMultiplier = 1;
    if (orderData.services.urgency === "expedited") urgencyMultiplier = 1.5;
    if (orderData.services.urgency === "rush") urgencyMultiplier = 2;

    if (urgencyMultiplier > 1) {
      const surcharge = basePrice * urgencyMultiplier - basePrice;
      items.push({
        name: `Urgency (${urgency})`,
        quantity: null,
        price: surcharge,
      });
    } else {
      items.push({ name: `Processing Time`, quantity: urgency, price: null });
    }

    // Add Delivery Type as a line item
    if (
      orderData.services.deliveryType &&
      orderData.services.deliveryType !== "email"
    ) {
      const deliveryPrice =
        orderData.services.deliveryType === "express" ? 99 : 150;
      const deliveryName =
        orderData.services.deliveryType === "express"
          ? "Express Mail with Tracking"
          : "International Delivery";
      items.push({
        name: `Delivery (${deliveryName})`,
        quantity: null,
        price: deliveryPrice,
      });
    } else if (orderData.services.deliveryType === "email") {
      items.push({ name: `Delivery (Email Copy)`, quantity: null, price: 0 });
    }

    return items;
  };

  const lineItems = getLineItems();
  const subtotal = lineItems.reduce((sum, item) => sum + (item.price || 0), 0); // Subtotal is the sum of items before final multipliers if any were missed

  // Check if a service type has been selected
  if (!type) {
    return (
      <Card className="sticky top-20">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a service to see your order summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Original return statement if a service type IS selected
  return (
    <Card className="sticky top-20">
      {" "}
      {/* Make it sticky */}
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lineItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.name}
              {item.quantity &&
                typeof item.quantity === "string" &&
                !item.price && (
                  <span className="text-muted-foreground ml-1">
                    ({item.quantity})
                  </span>
                )}
              {item.quantity &&
                typeof item.quantity === "number" &&
                item.quantity > 1 && (
                  <span className="text-muted-foreground ml-1">
                    x{item.quantity}
                  </span>
                )}
            </span>
            <span>
              {item.price !== null ? `$${item.price.toFixed(2)}` : "-"}
            </span>
          </div>
        ))}

        <hr />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary">
            ${calculatedPrice.toFixed(2)}
          </span>{" "}
          {/* Added text-primary */}
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Final price may vary based on document review.
        </p>
      </CardContent>
    </Card>
  );
};

export default OrderSummarySidebar;
