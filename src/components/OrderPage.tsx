import React from "react";
import OrderWizard from "./OrderWizard";

const OrderPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12 pt-6"> {/* Reduced top padding */}
      <div className="container mx-auto">
        {/* Removed the h1 element */}
        <OrderWizard />
      </div>
    </div>
  );
};

export default OrderPage;
