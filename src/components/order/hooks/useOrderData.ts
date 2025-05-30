import { useState } from "react";
import { OrderData } from "../../../types/order/index"; // Corrected import path
import { DocumentState } from "../../../types/order/documents";

export const initialOrderData: OrderData = {
  customerInfo: {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  },
  documents: [] as DocumentState[],
  services: {
    // type will be undefined initially, as it's optional in ServiceInfo
    pageCount: 1, // Keep pageCount as it has a default value
    urgency: "standard", // Keep urgency as it has a default value
    deliveryType: "email", // Keep deliveryType as it has a default value
    shippingInfo: {
      country: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      zip: "",
    },
  },
  payment: {
    method: "credit-card",
  },
};

export const useOrderData = () => {
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);

  const updateOrderData = (
    section: keyof OrderData,
    data: Partial<OrderData[keyof OrderData]>
  ) => {
    setOrderData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        ...data,
      },
    }));
  };

  const updateDocuments = (
    updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])
  ) => {
    setOrderData((prevData) => ({
      ...prevData,
      documents:
        typeof updater === "function" ? updater(prevData.documents) : updater,
    }));
  };

  return {
    orderData,
    setOrderData,
    updateOrderData,
    updateDocuments,
  };
};
