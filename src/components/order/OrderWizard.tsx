import React, { useState, useEffect, useRef } from "react";
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
import { createOrder, getOrder } from "../../utils/order/orderAPI";
import {
  trackCheckoutStarted,
  trackServiceSelected,
  trackAddPaymentInfo,
  trackPurchase,
} from "../../utils/analytics";
import { calculatePrice } from "../../utils/order/priceCalculation";
import { TOTAL_STEPS } from "../../constants/order/steps";
import { OrderWizardProps, ServiceInfo } from "../../types/order/index";

const OrderWizard: React.FC<OrderWizardProps> = ({
  onComplete = () => {},
  initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { orderId, setOrderId } = useOrderContext();
  const { orderData, setOrderData, updateOrderData, updateDocuments } =
    useOrderData();
  const orderDataRef = useRef(orderData); // Create a ref for orderData
  useEffect(() => {
    orderDataRef.current = orderData; // Keep the ref updated
  }, [orderData]);
  const { paymentProcessing, error, setError, processPayment, isStripeReady } =
    usePaymentProcessing();
  const { validateCustomerInfo } = useOrderValidation();

  // Initialize abandoned cart tracking
  const { markAsActive, stopTracking } = useAbandonedCartTracking(
    {
      customerInfo: orderData.customerInfo,
      services: orderData.services,
      currentStep,
      orderId: orderId, // Pass orderId here
    },
    {
      delay: 3600000, // 1 hour (3,600,000 ms)
      enabled: true,
    }
  );

  // Check for pre-filled data from URL parameters (for resume functionality)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get("orderId");

    const loadOrderData = async () => {
      if (orderIdParam) {
        try {
          const fetchedOrder = await getOrder(orderIdParam);
          if (fetchedOrder) {
            // Map fetched data to OrderData structure
            const resumedOrderData = {
              customerInfo: {
                email: fetchedOrder.email || "",
                firstName: fetchedOrder.first_name || "",
                lastName: fetchedOrder.last_name || "",
                phone: fetchedOrder.phone || "",
                company: fetchedOrder.company || "",
              },
              documents:
                fetchedOrder.document_paths?.map((path: string) => ({
                  id: path,
                  name: path.split("/").pop() || path,
                  path,
                  size: 0, // Dummy value
                  type: "", // Dummy value
                  file: new File([], ""), // Dummy value
                  status: "success", // Assume success for fetched documents
                })) || [],
              services: {
                type: fetchedOrder.services?.type || undefined,
                languageFrom: fetchedOrder.services?.languageFrom || undefined, // Add languageFrom
                languageTo: fetchedOrder.services?.languageTo || undefined, // Add languageTo
                pageCount: fetchedOrder.services?.pageCount || 1,
                urgency: fetchedOrder.services?.urgency || "standard",
                deliveryType: fetchedOrder.services?.deliveryType || "email",
                evaluationType:
                  fetchedOrder.services?.evaluationType || undefined,
                visaType: fetchedOrder.services?.visaType || undefined,
                specialInstructions:
                  fetchedOrder.services?.specialInstructions || undefined, // Add this line
                shippingInfo: {
                  country: fetchedOrder.services?.shippingInfo?.country || "",
                  address: fetchedOrder.services?.shippingInfo?.address || "",
                  apartment:
                    fetchedOrder.services?.shippingInfo?.apartment || "",
                  city: fetchedOrder.services?.shippingInfo?.city || "",
                  state: fetchedOrder.services?.shippingInfo?.state || "",
                  zip: fetchedOrder.services?.shippingInfo?.zip || "",
                },
              },
              payment: {
                method: fetchedOrder.payment?.method || "credit-card",
              },
            };
            setOrderData(resumedOrderData); // Use setOrderData from useOrderData hook
            setOrderId(orderIdParam); // Set orderId in context

            // Set initial step from URL params or fetched order status
            const stepParam = urlParams.get("step");
            if (stepParam) {
              const step = parseInt(stepParam, 10);
              if (!isNaN(step) && step >= 0 && step < TOTAL_STEPS) {
                setCurrentStep(step);
              }
            } else if (fetchedOrder.status === "pending_payment") {
              setCurrentStep(TOTAL_STEPS - 1);
            } else if (fetchedOrder.status === "in_progress") {
              setCurrentStep(1); // Example: start from service selection if in progress
            }
          } else {
            setOrderId(null); // Explicitly clear orderId to force new order creation
            setOrderData(initialOrderData); // Reset order data to initial state for a new order
          }
        } catch (err) {
          console.error("OrderWizard: Error loading order data:", err);
          // Optionally, redirect to a new order page or show an error message
        }
      } else {
        // If no orderId in URL, proceed with existing pre-fill logic for new orders
        const firstName = urlParams.get("firstName");
        const lastName = urlParams.get("lastName");
        const email = urlParams.get("email");
        const phone = urlParams.get("phone");
        const company = urlParams.get("company");

        if (firstName || lastName || email || phone || company) {
          const prefilledCustomerInfo = {
            ...orderDataRef.current.customerInfo, // Use ref here
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(email && { email }),
            ...(phone && { phone }),
            ...(company && { company }),
          };
          updateOrderData("customerInfo", prefilledCustomerInfo);
        }

        const serviceParam = urlParams.get("service");
        const urgencyParam = urlParams.get("urgency");
        const deliveryParam = urlParams.get("delivery");
        const evaluationTypeParam = urlParams.get("evaluationType");
        const languageFromParam = urlParams.get("languageFrom");
        const languageToParam = urlParams.get("languageTo");
        const pageCountParam = urlParams.get("pageCount");
        const specialInstructionsParam = urlParams.get("specialInstructions"); // Add this line

        if (
          serviceParam ||
          urgencyParam ||
          deliveryParam ||
          evaluationTypeParam ||
          languageFromParam ||
          languageToParam ||
          pageCountParam ||
          specialInstructionsParam // Add this line
        ) {
          const prefilledServices: Partial<ServiceInfo> = {
            ...orderDataRef.current.services,
          };

          if (serviceParam) {
            prefilledServices.type = serviceParam;
          } else if (evaluationTypeParam) {
            // If evaluationType is present but service type isn't explicitly set, assume evaluation
            prefilledServices.type = "evaluation";
          } else if (languageFromParam || languageToParam || pageCountParam) {
            // If translation-related params are present, assume translation service
            prefilledServices.type = "translation";
          }

          if (urgencyParam) {
            prefilledServices.urgency = urgencyParam as ServiceInfo["urgency"];
          }
          if (deliveryParam) {
            prefilledServices.deliveryType =
              deliveryParam as ServiceInfo["deliveryType"];
          }
          if (evaluationTypeParam) {
            prefilledServices.evaluationType = evaluationTypeParam;
          }
          if (languageFromParam) {
            prefilledServices.languageFrom = languageFromParam;
          }
          if (languageToParam) {
            prefilledServices.languageTo = languageToParam;
          }
          if (pageCountParam) {
            prefilledServices.pageCount = parseInt(pageCountParam, 10);
          }
          if (specialInstructionsParam) {
            prefilledServices.specialInstructions = specialInstructionsParam; // Add this line
          }

          updateOrderData("services", prefilledServices);
        }

        const stepParam = urlParams.get("step");
        if (stepParam) {
          const step = parseInt(stepParam, 10);
          if (!isNaN(step) && step >= 0 && step < TOTAL_STEPS) {
            setCurrentStep(step);
          }
        }
      }
    };

    loadOrderData();
    markAsActive(orderDataRef.current); // Pass ref.current here
  }, [markAsActive, setOrderData, setOrderId]); // Removed orderData from dependencies

  // Stop tracking when component unmounts or order is completed
  useEffect(() => {
    return () => {
      stopTracking();
      console.log("OrderWizard: useEffect cleanup - stopTracking called.");
    };
  }, [stopTracking]);

  const handleNext = async () => {
    console.log(
      `OrderWizard: handleNext called. Current step: ${currentStep}, Order ID: ${orderId}`
    );
    setError(null);

    // Step 0: Save Customer Info or proceed if order already exists
    if (currentStep === 0) {
      if (!orderId) {
        console.log(
          "OrderWizard: handleNext - currentStep is 0 and no orderId. Attempting to create new order."
        );
        // Only create order if it doesn't already exist (i.e., not resumed)
        const validationError = validateCustomerInfo(orderData.customerInfo);
        if (validationError) {
          setError(validationError);
          console.log(
            "OrderWizard: handleNext - Validation error:",
            validationError
          );
          return;
        }

        setIsSubmitting(true);
        try {
          const newOrderId = await createOrder(orderData.customerInfo);
          if (newOrderId) {
            setOrderId(newOrderId);
            console.log(
              "OrderWizard: handleNext - New order created with ID:",
              newOrderId
            );

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
            console.log(
              `OrderWizard: handleNext - Moving to next step: ${
                currentStep + 1
              }`
            );

            // Mark as active since user is progressing through the form
            markAsActive(orderData);
          } else {
            throw new Error("Failed to create order or retrieve ID.");
          }
        } catch (err: any) {
          console.error("OrderWizard: Error saving customer info:", err);
          setError(
            err.message || "Failed to save information. Please try again."
          );
        } finally {
          setIsSubmitting(false);
        }
      } else {
        console.log(
          "OrderWizard: handleNext - currentStep is 0 and orderId exists. Skipping createOrder, moving to next step."
        );
        // If orderId exists, just move to the next step
        setCurrentStep(currentStep + 1);
        markAsActive(orderData);
      }
    }
    // Final Step: Payment Processing
    else if (currentStep === TOTAL_STEPS - 1) {
      console.log(
        "OrderWizard: handleNext - currentStep is final step. Processing payment."
      );
      const calculatedPrice = calculatePrice(orderData.services);
      trackAddPaymentInfo(orderData, orderId!, calculatedPrice);

      const success = await processPayment(orderData, orderId!, onComplete);
      if (success) {
        // Stop abandoned cart tracking on successful completion
        stopTracking();
        console.log(
          "OrderWizard: handleNext - Payment successful, tracking stopped."
        );
      }
      // Error handling is done within processPayment
    }
    // Other Steps: Just move forward
    else if (currentStep < TOTAL_STEPS - 1) {
      console.log(
        `OrderWizard: handleNext - Moving to next step: ${currentStep + 1}`
      );
      setCurrentStep(currentStep + 1);

      // Mark as active since user is progressing
      markAsActive(orderData);
    }
  };

  const handleBack = () => {
    console.log(`OrderWizard: handleBack called. Current step: ${currentStep}`);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      console.log(
        `OrderWizard: handleBack - Moving to previous step: ${currentStep - 1}`
      );

      // Mark as active since user is interacting
      markAsActive(orderData);
    } else {
      console.log(
        "OrderWizard: handleBack - Already at first step (0), cannot go back."
      );
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
              markAsActive(orderData);
            }}
            error={error}
            documents={orderData.documents} // Pass documents here
          />
        );
      case 1:
        return (
          <ServiceAndDocumentStep
            serviceData={orderData.services}
            updateServiceData={(data) => {
              updateOrderData("services", data);
              // Mark as active when user updates data
              markAsActive(orderData);
            }}
            documents={orderData.documents}
            updateDocuments={(docs) => {
              updateDocuments(docs);
              // Mark as active when user updates data
              markAsActive(orderData);
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
              markAsActive(orderData);
            }}
            orderId={orderId} // Pass orderId here
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
