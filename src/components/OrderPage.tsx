import React from "react";
import OrderWizard from "./OrderWizard";

const OrderPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">
          Start Your Order
        </h1>
        <OrderWizard />
      </div>
    </div>
  );
};

export default OrderPage;
