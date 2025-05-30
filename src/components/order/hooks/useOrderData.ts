import { useState } from "react";
import { OrderData, DocumentState } from "../../../types/order";

const initialOrderData: OrderData = {
  customerInfo: {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  },
  documents: [] as DocumentState[],
  services: {
    type: "",
    languageFrom: "",
    languageTo: "",
    pageCount: 1,
    evaluationType: "",
    visaType: "",
    urgency: "standard",
    specialInstructions: "",
    deliveryType: "email",
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
