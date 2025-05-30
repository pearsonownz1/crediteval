import { OrderData } from "../../types/order/index";

export const getStepCompletionStatus = (
  stepIndex: number,
  orderData: OrderData
): "complete" | "partial" | "incomplete" => {
  switch (stepIndex) {
    case 0: // Customer Info Step
      const { firstName, lastName, email } = orderData.customerInfo;
      if (firstName && lastName && email) {
        return "complete";
      } else if (firstName || lastName || email) {
        return "partial";
      }
      return "incomplete";
    case 1: // Service and Document Step
      const { type, languageFrom, languageTo, evaluationType } =
        orderData.services;
      const hasServiceType = !!type;
      const hasDocuments = orderData.documents.length > 0;

      if (hasServiceType && hasDocuments) {
        if (type === "translation" && languageFrom && languageTo) {
          return "complete";
        }
        if (type === "evaluation" && evaluationType) {
          return "complete";
        }
        if (type === "expert") {
          return "complete";
        }
        return "partial"; // Service type selected but specific details missing
      } else if (hasServiceType || hasDocuments) {
        return "partial";
      }
      return "incomplete";
    case 2: // Delivery Details Step
      const { deliveryType, shippingInfo } = orderData.services;
      if (deliveryType === "email") {
        return "complete";
      }
      if (
        deliveryType &&
        shippingInfo &&
        shippingInfo.address &&
        shippingInfo.city &&
        shippingInfo.country &&
        shippingInfo.state &&
        shippingInfo.zip
      ) {
        return "complete";
      } else if (deliveryType) {
        return "partial";
      }
      return "incomplete";
    case 3: // Review Step (considered complete if previous steps are complete)
      // This step itself doesn't have data to fill, it's a review.
      // Its completion depends on the completeness of previous steps.
      // For simplicity, we'll mark it complete if the previous step is complete.
      // A more robust solution might check if all previous steps are 'complete'.
      return "complete";
    case 4: // Payment Step (considered complete if payment is processed)
      // This step's completion is handled by the payment processing logic.
      // For the purpose of progress indicator, we can assume it's complete
      // once the user reaches this step and payment is initiated/successful.
      return "incomplete"; // Payment is the final action, not a data entry step for validation here.
    default:
      return "incomplete";
  }
};
