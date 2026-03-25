import React, { createContext, useContext, useState, useEffect } from "react";

type OrderContextType = {
  orderId: string | null;
  setOrderId: (id: string | null) => void;
  orderEditToken: string | null;
  setOrderEditToken: (token: string | null) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);
const ORDER_ID_STORAGE_KEY = "crediteval-order-id";
const getOrderTokenStorageKey = (orderId: string) =>
  `crediteval-order-token:${orderId}`;

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orderId, setOrderIdState] = useState<string | null>(null);
  const [orderEditToken, setOrderEditTokenState] = useState<string | null>(null);

  useEffect(() => {
    const storedOrderId = window.localStorage.getItem(ORDER_ID_STORAGE_KEY);
    if (storedOrderId) {
      setOrderIdState(storedOrderId);
      setOrderEditTokenState(
        window.localStorage.getItem(getOrderTokenStorageKey(storedOrderId))
      );
    }
  }, []);

  const setOrderId = (id: string | null) => {
    setOrderIdState(id);

    if (!id) {
      window.localStorage.removeItem(ORDER_ID_STORAGE_KEY);
      setOrderEditTokenState(null);
      return;
    }

    window.localStorage.setItem(ORDER_ID_STORAGE_KEY, id);
    setOrderEditTokenState(
      window.localStorage.getItem(getOrderTokenStorageKey(id))
    );
  };

  const setOrderEditToken = (token: string | null) => {
    setOrderEditTokenState(token);

    if (!orderId) {
      return;
    }

    if (token) {
      window.localStorage.setItem(getOrderTokenStorageKey(orderId), token);
    } else {
      window.localStorage.removeItem(getOrderTokenStorageKey(orderId));
    }
  };

  return (
    <OrderContext.Provider
      value={{ orderId, setOrderId, orderEditToken, setOrderEditToken }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderContext must be used within an OrderProvider");
  }
  return context;
};
