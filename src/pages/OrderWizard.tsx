import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useOrderContext } from "../contexts/OrderContext";
import EvalynAssistant from "../components/EvalynAssistant";
import OrderSummarySidebar from "../components/OrderSummarySidebar";

// Hooks
import { useOrderData } from "../components/order/hooks/useOrderData";
import { usePaymentProcessing } from "../components/order/hooks/usePaymentProcessing";
import { useOrderValidation } from "../components/order/hooks/useOrderValidation";

// UI Components
import { ProgressIndicator } from "../components/order/ui/ProgressIndicator";
import { StepNavigation } from "../components/order/ui/StepNavigation";
import { SocialProofSection } from "../components/order/ui/SocialProofSection";

// Step Components
import { CustomerInfoStep } from "../components/order/steps/CustomerInfoStep";
import { ServiceAndDocumentStep } from "../components/order/steps/ServiceAndDocumentStep";
import { DeliveryDetailsStep } from "../components/order/steps/DeliveryDetailsStep";
import { ReviewStep } from "../components/order/steps/ReviewStep";
import { PaymentStep } from "../components/order/steps/PaymentStep";

// Utils and Constants
import { createOrder } from "../utils/order/orderAPI";
import { trackCheckoutStarted } from "../utils/analytics"; // Changed import to analytics.ts
import { calculatePrice } from "../utils/order/priceCalculation"; // Import calculatePrice
import { TOTAL_STEPS } from "../constants/order/steps";
import { OrderWizardProps } from "../types/order/index";

const OrderWizard: React.FC<OrderWizardProps> = ({
  onComplete = () => {},
  initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { orderId, setOrderId } = useOrderContext();
  const { orderData, updateOrderData, updateDocuments } = useOrderData();
  const { paymentProcessing, error, setError, processPayment, isStripeReady } =
    usePaymentProcessing();
  const { validateCustomerInfo } = useOrderValidation();

  const handleNext = async () => {
    setError(null);

    // Step 0: Save Customer Info
    if (currentStep === 0) {
      const validationError = validateCustomerInfo(orderData.customerInfo);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsSubmitting(true);
      try {
        const newOrderId = await createOrder(orderData.customerInfo);
        if (newOrderId) {
          setOrderId(newOrderId);

          // Track checkout started with Klaviyo
          const calculatedPrice = calculatePrice(orderData.services); // Calculate price
          await trackCheckoutStarted(orderData, newOrderId, calculatedPrice); // Pass calculatedPrice

          setCurrentStep(currentStep + 1);
        } else {
          throw new Error("Failed to create order or retrieve ID.");
        }
      } catch (err: any) {
        console.error("Error saving customer info:", err);
        setError(
          err.message || "Failed to save information. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
    // Final Step: Payment Processing
    else if (currentStep === TOTAL_STEPS - 1) {
      const success = await processPayment(orderData, orderId!, onComplete);
      if (!success) {
        // Error handling is done within processPayment
        return;
      }
    }
    // Other Steps: Just move forward
    else if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CustomerInfoStep
            data={orderData.customerInfo}
            updateData={(data) => updateOrderData("customerInfo", data)}
            error={error}
          />
        );
      case 1:
        return (
          <ServiceAndDocumentStep
            serviceData={orderData.services}
            updateServiceData={(data) => updateOrderData("services", data)}
            documents={orderData.documents}
            updateDocuments={updateDocuments}
            orderId={orderId}
          />
        );
      case 2:
        return (
          <DeliveryDetailsStep
            data={orderData.services}
            updateData={(data) => updateOrderData("services", data)}
          />
        );
      case 3:
        return <ReviewStep orderData={orderData} />;
      case 4:
        return <PaymentStep error={error} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
      {/* Main Content Area (Wizard Steps) - takes 2 columns */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">
              Order Your Service
            </CardTitle>
            <CardDescription className="text-center">
              Complete the steps below to submit your order
            </CardDescription>

            <ProgressIndicator currentStep={currentStep} />
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <CardFooter>
            <StepNavigation
              currentStep={currentStep}
              onBack={handleBack}
              onNext={handleNext}
              isSubmitting={isSubmitting}
              paymentProcessing={paymentProcessing}
              isStripeReady={isStripeReady}
            />
          </CardFooter>
        </Card>
      </div>

      {/* Sidebar Area - takes 1 column */}
      <div className="md:col-span-1 space-y-6">
        {/* Order Summary Sidebar */}
        <OrderSummarySidebar orderData={orderData} />

        {/* Social Proof Section */}
        <SocialProofSection />
      </div>

      {/* Conditionally Render Evalyn Assistant (Step 2 onwards) */}
      {currentStep >= 2 && <EvalynAssistant />}
    </div>
  );
};

export default OrderWizard;
