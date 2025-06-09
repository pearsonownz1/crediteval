import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useOrderContext } from "../../contexts/OrderContext";
import EvalynAssistant from "../EvalynAssistant";
import OrderSummarySidebar from "../OrderSummarySidebar";

// Hooks
import { useOrderData, initialOrderData } from "./hooks/useOrderData";
import { usePaymentProcessing } from "./hooks/usePaymentProcessing";
import { useOrderValidation } from "./hooks/useOrderValidation";
import { useAbandonedCartTracking } from "./hooks/useAbandonedCartTracking";

// UI Components
import { ProgressIndicator } from "./ui/ProgressIndicator";
import { StepNavigation } from "./ui/StepNavigation";
import { SocialProofSection } from "./ui/SocialProofSection";

// Step Components
import { CustomerInfoStep } from "./steps/CustomerInfoStep";
import { ServiceAndDocumentStep } from "./steps/ServiceAndDocumentStep";
import { DeliveryDetailsStep } from "./steps/DeliveryDetailsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { PaymentStep } from "./steps/PaymentStep";

// Utils and Constants
import { createOrder } from "../../utils/order/orderAPI";
import {
  trackCheckoutStarted,
  trackServiceSelected,
  trackAddPaymentInfo,
  trackPurchase,
} from "../../utils/analytics";
import { calculatePrice } from "../../utils/order/priceCalculation";
import { TOTAL_STEPS } from "../../constants/order/steps";
import { OrderWizardProps } from "../../types/order/index";

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

  // Initialize abandoned cart tracking
  const { markAsActive, stopTracking } = useAbandonedCartTracking(
    {
      customerInfo: orderData.customerInfo,
      services: orderData.services,
      currentStep,
    },
    {
      delay: 10000, // 10 seconds for testing purposes
      enabled: true,
    }
  );

  // Check for pre-filled data from URL parameters (for resume functionality)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Pre-fill customer info from URL params
    const firstName = urlParams.get("firstName");
    const lastName = urlParams.get("lastName");
    const email = urlParams.get("email");
    const phone = urlParams.get("phone");
    const company = urlParams.get("company");

    if (firstName || lastName || email || phone || company) {
      const prefilledCustomerInfo = {
        ...orderData.customerInfo,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(company && { company }),
      };
      updateOrderData("customerInfo", prefilledCustomerInfo);
    }

    // Pre-fill service info from URL params
    const service = urlParams.get("service");
    const urgency = urlParams.get("urgency");
    const delivery = urlParams.get("delivery");

    if (service || urgency || delivery) {
      const prefilledServices = {
        ...orderData.services,
        ...(service && { selectedService: service }),
        ...(urgency && { urgency }),
        ...(delivery && { deliveryMethod: delivery }),
      };
      updateOrderData("services", prefilledServices);
    }

    // Set initial step from URL params
    const stepParam = urlParams.get("step");
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (!isNaN(step) && step >= 0 && step < TOTAL_STEPS) {
        setCurrentStep(step);
      }
    }

    // Mark as active since user has returned/loaded the page
    markAsActive();
  }, [markAsActive, updateOrderData]);

  // Stop tracking when component unmounts or order is completed
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

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

          // Track checkout started with GA4
          console.log(
            "OrderWizard: orderData before calculatePrice:",
            orderData
          );
          console.log(
            "OrderWizard: orderData.services before calculatePrice:",
            orderData.services
          );

          // Ensure orderData.services is not undefined before passing to calculatePrice
          const servicesToCalculate =
            orderData.services || initialOrderData.services;
          const calculatedPrice = calculatePrice(servicesToCalculate);
          trackCheckoutStarted(orderData, newOrderId, calculatedPrice);

          setCurrentStep(currentStep + 1);

          // Mark as active since user is progressing through the form
          markAsActive();
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
      const calculatedPrice = calculatePrice(orderData.services);
      trackAddPaymentInfo(orderData, orderId!, calculatedPrice);

      const success = await processPayment(orderData, orderId!, onComplete);
      if (success) {
        // Stop abandoned cart tracking on successful completion
        stopTracking();
      }
      // Error handling is done within processPayment
    }
    // Other Steps: Just move forward
    else if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);

      // Mark as active since user is progressing
      markAsActive();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);

      // Mark as active since user is interacting
      markAsActive();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CustomerInfoStep
            data={orderData.customerInfo}
            updateData={(data) => {
              updateOrderData("customerInfo", data);
              // Mark as active when user updates data
              markAsActive();
            }}
            error={error}
          />
        );
      case 1:
        return (
          <ServiceAndDocumentStep
            serviceData={orderData.services}
            updateServiceData={(data) => {
              updateOrderData("services", data);
              // Mark as active when user updates data
              markAsActive();
            }}
            documents={orderData.documents}
            updateDocuments={(docs) => {
              updateDocuments(docs);
              // Mark as active when user updates data
              markAsActive();
            }}
            orderId={orderId}
          />
        );
      case 2:
        return (
          <DeliveryDetailsStep
            data={orderData.services}
            updateData={(data) => {
              updateOrderData("services", data);
              // Mark as active when user updates data
              markAsActive();
            }}
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
