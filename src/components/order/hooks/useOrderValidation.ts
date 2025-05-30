import { OrderData } from "../../../types/order/index"; // Corrected import path

export const useOrderValidation = () => {
  const validateCustomerInfo = (
    customerInfo: OrderData["customerInfo"]
  ): string | null => {
    const { firstName, lastName, email } = customerInfo;

    if (!firstName || !lastName || !email) {
      return "Please fill in all required fields (First Name, Last Name, Email).";
    }

    return null;
  };

  const validateServiceSelection = (
    services: OrderData["services"]
  ): string | null => {
    if (!services.type) {
      return "Please select a service type.";
    }

    if (
      services.type === "translation" &&
      (!services.languageFrom || !services.languageTo)
    ) {
      return "Please select both source and target languages for translation.";
    }

    if (services.type === "evaluation" && !services.evaluationType) {
      return "Please select an evaluation type.";
    }

    return null;
  };

  return {
    validateCustomerInfo,
    validateServiceSelection,
  };
};
