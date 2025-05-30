import { ServiceInfo } from "../../types/order/services"; // Import ServiceInfo

export const calculatePrice = (services: ServiceInfo): number => {
  let totalPrice = 0;
  const { type, pageCount, evaluationType, deliveryType, urgency } = services; // Destructure directly from services

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
  switch (urgency) {
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
  if (deliveryType === "express") {
    totalPrice += 99;
  } else if (deliveryType === "international") {
    totalPrice += 150;
  }

  return totalPrice;
};
