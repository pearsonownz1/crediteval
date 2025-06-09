import React, { createContext, useContext, useState, useEffect } from "react";

type OrderContextType = {
  orderId: string | null; // Type is already correct here, no change needed
  setOrderId: (id: string | null) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize state from localStorage if available, otherwise null
  // Ensure the state type is explicitly string | null
  const [orderId, setOrderId] = useState<string | null>(null);

  return (
    <OrderContext.Provider value={{ orderId, setOrderId }}>
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
