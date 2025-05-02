import React, { createContext, useContext, useState, useEffect } from "react";

type OrderContextType = {
  orderId: string | null; // Type is already correct here, no change needed
  setOrderId: (id: string | null) => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize state from localStorage if available, otherwise null
  // Ensure the state type is explicitly string | null
  const [orderId, setOrderIdInternal] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("orderId"); // getItem returns string or null
    }
    return null;
  });

  // Update localStorage whenever orderId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (orderId) {
        localStorage.setItem("orderId", orderId);
        console.log(`[OrderContext] Set localStorage orderId: ${orderId}`);
      } else {
        localStorage.removeItem("orderId");
        console.log(`[OrderContext] Removed localStorage orderId`);
      }
    }
  }, [orderId]);

  // Wrapper for setOrderId to ensure localStorage is updated
  const setOrderId = (id: string | null) => {
    setOrderIdInternal(id);
  };


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
