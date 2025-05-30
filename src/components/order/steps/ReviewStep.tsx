import React from "react";
import { OrderData, DocumentState } from "../../../types/order";
import { calculatePrice } from "../../../utils/order/priceCalculation";

interface ReviewStepProps {
  orderData: OrderData;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ orderData }) => {
  const getServiceTypeText = () => {
    switch (orderData.services.type) {
      case "translation":
        return "Certified Translation";
      case "evaluation":
        return "Credential Evaluation";
      case "expert":
        return "Expert Opinion Letter";
      default:
        return "Not specified";
    }
  };

  const getUrgencyText = () => {
    switch (orderData.services.urgency) {
      case "standard":
        return "Standard (7-10 business days)";
      case "expedited":
        return "Expedited (3-5 business days)";
      case "rush":
        return "Rush (1-2 business days)";
      default:
        return "Not specified";
    }
  };

  const calculatedPrice = calculatePrice(orderData);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Order Summary</h3>
        <p className="text-sm text-muted-foreground">
          Please review your order details before proceeding to payment
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <h4 className="font-medium">Customer Information</h4>
            <p className="text-sm">
              {orderData.customerInfo.firstName}{" "}
              {orderData.customerInfo.lastName}
            </p>
            <p className="text-sm">{orderData.customerInfo.email}</p>
            {orderData.customerInfo.phone && (
              <p className="text-sm">{orderData.customerInfo.phone}</p>
            )}
          </div>

          <div>
            <h4 className="font-medium">Documents</h4>
            {orderData.documents.length > 0 ? (
              <ul className="text-sm space-y-1">
                {orderData.documents.map((doc: DocumentState) => (
                  <li key={doc.id}>{doc.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents uploaded
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium">Service Details</h4>
            <p className="text-sm">Service Type: {getServiceTypeText()}</p>

            {/* Service Benefit Text */}
            {orderData.services.type === "translation" && (
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive a certified translation suitable for official
                use.
              </p>
            )}
            {orderData.services.type === "evaluation" && (
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive a report detailing the U.S. equivalency of your
                credentials.
              </p>
            )}
            {orderData.services.type === "expert" && (
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive a letter analyzing your qualifications for your
                specific visa needs.
              </p>
            )}

            {/* Conditional details based on service type */}
            {orderData.services.type === "translation" && (
              <>
                <p className="text-sm">
                  Language From: {orderData.services.languageFrom}
                </p>
                <p className="text-sm">
                  Language To: {orderData.services.languageTo}
                </p>
                <p className="text-sm">
                  Pages for Translation: {orderData.services.pageCount || 1}
                </p>
              </>
            )}
            {orderData.services.type === "evaluation" && (
              <p className="text-sm">
                Evaluation Type:{" "}
                {orderData.services.evaluationType === "document"
                  ? "Document-by-Document"
                  : "Course-by-Course"}
              </p>
            )}
            {orderData.services.type === "expert" && (
              <p className="text-sm">
                Visa Type: {orderData.services.visaType || "Not specified"}
              </p>
            )}

            <p className="text-sm">
              Delivery Type: {orderData.services.deliveryType}
            </p>
            <p className="text-sm">Processing Time: {getUrgencyText()}</p>
            {orderData.services.specialInstructions && (
              <div>
                <p className="text-sm font-medium mt-2">
                  Special Instructions:
                </p>
                <p className="text-sm">
                  {orderData.services.specialInstructions}
                </p>
              </div>
            )}
          </div>

          {orderData.services.deliveryType !== "email" && (
            <div>
              <h4 className="font-medium">Shipping Information</h4>
              <p className="text-sm">
                Country: {orderData.services.shippingInfo.country}
              </p>
              <p className="text-sm">
                Address: {orderData.services.shippingInfo.address}
              </p>
              {orderData.services.shippingInfo.apartment && (
                <p className="text-sm">
                  Apartment: {orderData.services.shippingInfo.apartment}
                </p>
              )}
              <p className="text-sm">
                City: {orderData.services.shippingInfo.city}
              </p>
              <p className="text-sm">
                State: {orderData.services.shippingInfo.state}
              </p>
              <p className="text-sm">
                Zip: {orderData.services.shippingInfo.zip}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="font-medium">Estimated Total:</span>
            <span className="font-bold">${calculatedPrice.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Final price may vary based on document complexity and additional
            requirements
          </p>
        </div>
      </div>
    </div>
  );
};
