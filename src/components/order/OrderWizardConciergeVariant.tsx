import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";

import { useOrderContext } from "../../contexts/OrderContext";
import { useOrderData, initialOrderData } from "./hooks/useOrderData";
import { useOrderValidation } from "./hooks/useOrderValidation";
import { useAbandonedCartTracking } from "./hooks/useAbandonedCartTracking";
import { CustomerInfoStep } from "./steps/CustomerInfoStep";
import { ServiceAndDocumentStep } from "./steps/ServiceAndDocumentStep";
import { DeliveryDetailsStep } from "./steps/DeliveryDetailsStep";
import { ReviewStep } from "./steps/ReviewStep";
import {
  createOrder,
  getOrder,
  updateOrderWithServices,
} from "../../utils/order/orderAPI";
import { trackCheckoutStarted } from "../../utils/analytics";
import { calculatePrice } from "../../utils/order/priceCalculation";
import { getStepTitles } from "../../constants/order/steps";
import { OrderWizardProps, OrderData, ServiceInfo } from "../../types/order/index";
import { supabase } from "../../lib/supabaseClient";
import { ordersTable } from "../../lib/ordersTable";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const stepMeta = [
  {
    title: "Contact details",
    eyebrow: "Step 1",
    description: "Tell us who this order is for so we can save your progress and keep your case organized.",
    icon: UserRound,
    tip: "We save your progress after this step so you can resume later.",
  },
  {
    title: "Service and documents",
    eyebrow: "Step 2",
    description: "Choose the right service, then upload scans or photos of the documents you want us to review.",
    icon: Upload,
    tip: "PDFs or clear photos work fine. Our team reviews every file before processing.",
  },
  {
    title: "Delivery preferences",
    eyebrow: "Step 3",
    description: "Tell us how you want the final documents delivered so we can prepare the correct workflow.",
    icon: MapPin,
    tip: "Digital delivery is fastest. Mailed copies remain available when required.",
  },
  {
    title: "Final review",
    eyebrow: "Step 4",
    description: "Confirm the summary before submitting your request to our operations team.",
    icon: FileCheck2,
    tip: "Nothing here is theatrical. It’s just the last sanity check before handoff.",
  },
] as const;

const trustPills = [
  "Secure document handling",
  "Immigration-ready workflows",
  "Clear pricing and delivery options",
];

const serviceLabel = (type?: string) => {
  switch (type) {
    case "translation":
      return "Certified Translation";
    case "evaluation":
      return "Credential Evaluation";
    case "expert":
      return "Expert Opinion Letter";
    default:
      return "Select a service";
  }
};

const urgencyLabel = (urgency?: string) => {
  switch (urgency) {
    case "standard":
      return "Standard · 7–10 business days";
    case "expedited":
      return "Expedited · 3–5 business days";
    case "rush":
      return "Rush · 1–2 business days";
    default:
      return "Timeline not selected";
  }
};

const deliveryLabel = (deliveryType?: string) => {
  switch (deliveryType) {
    case "email":
      return "Digital copy by email";
    case "express":
      return "Express mail with tracking";
    case "international":
      return "International mail";
    default:
      return "Delivery not selected";
  }
};

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

const ConciergeSummary = ({
  orderData,
  currentStep,
}: {
  orderData: OrderData;
  currentStep: number;
}) => {
  const price = calculatePrice(orderData.services);
  const isTranslation = orderData.services.type === "translation";
  const hasName = Boolean(
    orderData.customerInfo.firstName || orderData.customerInfo.lastName
  );
  const hasDocs = orderData.documents.length > 0;

  const checkpoints = [
    {
      label: "Contact saved",
      done: Boolean(
        orderData.customerInfo.firstName &&
          orderData.customerInfo.lastName &&
          orderData.customerInfo.email
      ),
    },
    {
      label: "Service selected",
      done: Boolean(orderData.services.type),
    },
    {
      label: "Documents uploaded",
      done: hasDocs,
    },
    {
      label: "Delivery confirmed",
      done: Boolean(orderData.services.deliveryType),
    },
  ];

  return (
    <aside className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_45%,#2563eb_100%)] px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100">
            <Sparkles className="h-3.5 w-3.5" /> Concierge summary
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">
            {serviceLabel(orderData.services.type)}
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100">
            A calmer, cleaner handoff for immigration, evaluation, and translation requests.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Current step
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {currentStep + 1} / {stepMeta.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Estimated total
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {isTranslation ? "$0 now" : formatMoney(price)}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Case snapshot</p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {orderData.documents.length} file{orderData.documents.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">
                    {hasName
                      ? `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`.trim()
                      : "Customer details pending"}
                  </p>
                  <p className="text-slate-500">
                    {orderData.customerInfo.email || "Email not added yet"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{urgencyLabel(orderData.services.urgency)}</p>
                  <p className="text-slate-500">{deliveryLabel(orderData.services.deliveryType)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{serviceLabel(orderData.services.type)}</p>
                  <p className="text-slate-500">
                    {orderData.services.type === "translation"
                      ? `${orderData.services.languageFrom || "Source"} → ${orderData.services.languageTo || "Target"}`
                      : orderData.services.type === "evaluation"
                        ? orderData.services.evaluationType === "document"
                          ? "Document-by-document"
                          : orderData.services.evaluationType === "course"
                            ? "Course-by-course"
                            : "Evaluation type pending"
                        : orderData.services.visaType || "Case type pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Completion checklist</p>
            <div className="space-y-2">
              {checkpoints.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      item.done
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {item.done ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {item.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-900">
            {isTranslation
              ? "Translation requests submit with no upfront payment. We prepare a watermarked preview first, then send a secure unlock option for the final clean version."
              : "Your request is routed to our team with the details shown here so review and fulfillment start without back-and-forth."}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Why this flow feels safer</p>
        <div className="mt-4 space-y-3">
          {[
            {
              icon: ShieldCheck,
              title: "Professional handling",
              copy: "Every order is reviewed by our team before fulfillment, not dumped into a black box.",
            },
            {
              icon: LockKeyhole,
              title: "Saved progress",
              copy: "Once your contact details are added, we can keep your case moving even if life interrupts.",
            },
            {
              icon: BadgeCheck,
              title: "Clear expectations",
              copy: "Delivery method, turnaround, and document status stay visible the whole way through.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <item.icon className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

const ConciergeStepCard = ({
  title,
  eyebrow,
  description,
  tip,
  icon: Icon,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800">
              {eyebrow}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {tip}
        </div>
      </div>
      <div
        className={cn(
          "px-6 py-6 sm:px-8 sm:py-8",
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-950",
          "[&_h4]:font-semibold [&_h4]:text-slate-900",
          "[&_label]:text-sm [&_label]:font-medium [&_label]:text-slate-700",
          "[&_input]:h-12 [&_input]:rounded-2xl [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-4",
          "[&_textarea]:min-h-[130px] [&_textarea]:rounded-2xl [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3",
          "[&_[data-radix-select-trigger]]:h-12 [&_[data-radix-select-trigger]]:rounded-2xl [&_[data-radix-select-trigger]]:border-slate-200 [&_[data-radix-select-trigger]]:bg-white",
          "[&_.border-dashed]:rounded-[24px] [&_.border-dashed]:border-slate-300 [&_.border-dashed]:bg-slate-50/70",
          "[&_.bg-muted]:bg-slate-50",
          "[&_.text-muted-foreground]:text-slate-500"
        )}
      >
        {children}
      </div>
    </div>
  );
};

const ConciergeStepNavigation = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting,
}: {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}) => {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {isLast ? "Ready to submit" : "Continue when this step looks right"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isLast
            ? "We’ll send your request to the operations team with the information shown in your summary."
            : "You can go back anytime before submitting. No brittle wizard nonsense."}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isFirst}
          className="h-12 rounded-2xl border-slate-200 px-5 text-sm font-semibold"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {isSubmitting ? "Saving…" : isLast ? "Submit request" : "Continue"}
          {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

const OrderWizardConciergeVariant: React.FC<OrderWizardProps> = ({
  onComplete = () => {},
  initialStep = 0,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { orderId, setOrderId, orderEditToken, setOrderEditToken } =
    useOrderContext();
  const { orderData, setOrderData, updateOrderData, updateDocuments } =
    useOrderData();
  const orderDataRef = useRef(orderData);

  useEffect(() => {
    orderDataRef.current = orderData;
  }, [orderData]);

  const isTranslationFlow = orderData.services.type === "translation";
  const stepTitles = getStepTitles(orderData.services.type);
  const totalSteps = stepTitles.length;
  const { validateCustomerInfo } = useOrderValidation();

  const { markAsActive, stopTracking } = useAbandonedCartTracking(
    {
      customerInfo: orderData.customerInfo,
      services: orderData.services,
      currentStep,
      orderId,
    },
    {
      delay: 3600000,
      enabled: true,
    }
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get("orderId");

    const loadOrderData = async () => {
      if (orderIdParam) {
        try {
          const fetchedOrder = await getOrder(orderIdParam);
          if (fetchedOrder) {
            const fetchedOrderEditToken =
              fetchedOrder.services?._meta?.editToken || null;
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
                  size: 0,
                  type: "",
                  file: new File([], ""),
                  status: "success" as const,
                })) || [],
              services: {
                type: fetchedOrder.services?.type || undefined,
                languageFrom: fetchedOrder.services?.languageFrom || undefined,
                languageTo: fetchedOrder.services?.languageTo || undefined,
                pageCount: fetchedOrder.services?.pageCount || 1,
                urgency: fetchedOrder.services?.urgency || "standard",
                deliveryType: fetchedOrder.services?.deliveryType || "email",
                evaluationType:
                  fetchedOrder.services?.evaluationType || undefined,
                visaType: fetchedOrder.services?.visaType || undefined,
                notarizationRequested:
                  fetchedOrder.services?.notarizationRequested ?? false,
                specialInstructions:
                  fetchedOrder.services?.specialInstructions || undefined,
                previewStatus:
                  fetchedOrder.services?.previewStatus || "not_ready",
                unlockStatus:
                  fetchedOrder.services?.unlockStatus || "not_available",
                translatorStatus:
                  fetchedOrder.services?.translatorStatus || "unassigned",
                deliveryConfirmationStatus:
                  fetchedOrder.services?.deliveryConfirmationStatus || "pending",
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
            setOrderData(resumedOrderData);
            setOrderId(orderIdParam);
            if (fetchedOrderEditToken) {
              setOrderEditToken(fetchedOrderEditToken);
            }

            const resumedStepTitles = getStepTitles(resumedOrderData.services.type);
            const stepParam = urlParams.get("step");
            if (stepParam) {
              const step = parseInt(stepParam, 10);
              if (!isNaN(step) && step >= 0 && step < resumedStepTitles.length) {
                setCurrentStep(step);
              }
            } else if (fetchedOrder.status === "pending_payment") {
              setCurrentStep(resumedStepTitles.length - 1);
            } else if (fetchedOrder.status === "in_progress") {
              setCurrentStep(1);
            }
          } else {
            setOrderId(null);
            setOrderData(initialOrderData);
          }
        } catch (err) {
          console.error("OrderWizardConciergeVariant: Error loading order data:", err);
        }
      } else {
        const firstName = urlParams.get("firstName");
        const lastName = urlParams.get("lastName");
        const email = urlParams.get("email");
        const phone = urlParams.get("phone");
        const company = urlParams.get("company");

        if (firstName || lastName || email || phone || company) {
          const prefilledCustomerInfo = {
            ...orderDataRef.current.customerInfo,
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
        const specialInstructionsParam = urlParams.get("specialInstructions");

        let resolvedServiceType = orderDataRef.current.services.type;

        if (
          serviceParam ||
          urgencyParam ||
          deliveryParam ||
          evaluationTypeParam ||
          languageFromParam ||
          languageToParam ||
          pageCountParam ||
          specialInstructionsParam
        ) {
          const prefilledServices: Partial<ServiceInfo> = {
            ...orderDataRef.current.services,
          };

          if (serviceParam) {
            prefilledServices.type = serviceParam as ServiceInfo["type"];
          } else if (evaluationTypeParam) {
            prefilledServices.type = "evaluation";
          } else if (languageFromParam || languageToParam || pageCountParam) {
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
            prefilledServices.specialInstructions = specialInstructionsParam;
          }

          resolvedServiceType = prefilledServices.type;
          updateOrderData("services", prefilledServices);
        }

        const stepParam = urlParams.get("step");
        if (stepParam) {
          const step = parseInt(stepParam, 10);
          const maxSteps = getStepTitles(resolvedServiceType).length;
          if (!isNaN(step) && step >= 0) {
            setCurrentStep(Math.min(step, maxSteps - 1));
          }
        }
      }
    };

    void loadOrderData();
    markAsActive(orderDataRef.current);
  }, [markAsActive, setOrderData, setOrderEditToken, setOrderId, updateOrderData]);

  useEffect(() => {
    if (currentStep > totalSteps - 1) {
      setCurrentStep(totalSteps - 1);
    }
  }, [currentStep, totalSteps]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const completionPercent = useMemo(
    () => Math.round(((currentStep + 1) / totalSteps) * 100),
    [currentStep, totalSteps]
  );

  const handleNext = async () => {
    setError(null);

    if (currentStep === 0) {
      if (!orderId) {
        const validationError = validateCustomerInfo(orderData.customerInfo);
        if (validationError) {
          setError(validationError);
          return;
        }

        setIsSubmitting(true);
        try {
          const { orderId: newOrderId, editToken } = await createOrder(
            orderData.customerInfo
          );
          if (newOrderId) {
            setOrderId(newOrderId);
            setOrderEditToken(editToken);

            const servicesToCalculate =
              orderData.services || initialOrderData.services;
            const calculatedPrice = calculatePrice(servicesToCalculate);
            trackCheckoutStarted(orderData, newOrderId, calculatedPrice);

            setCurrentStep(currentStep + 1);
            markAsActive(orderData);
          } else {
            throw new Error("Failed to create order or retrieve ID.");
          }
        } catch (err: any) {
          console.error("OrderWizardConciergeVariant: Error saving customer info:", err);
          setError(err.message || "Failed to save information. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setCurrentStep(currentStep + 1);
        markAsActive(orderData);
      }
    } else if (currentStep === totalSteps - 1) {
      if (!orderId) {
        setError("Missing order ID. Please restart your request.");
        return;
      }
      const submittedServices = isTranslationFlow
        ? {
            ...orderData.services,
            previewStatus: "not_ready",
            unlockStatus: "not_available",
            translatorStatus: "unassigned",
          }
        : orderData.services;

      try {
        if (orderEditToken) {
          await updateOrderWithServices(
            orderId,
            submittedServices,
            orderEditToken,
            "submitted"
          );
        } else {
          const { error: updateError } = await supabase
            .from(ordersTable)
            .update({
              services: submittedServices,
              status: "submitted",
            })
            .eq("id", orderId);

          if (updateError) {
            throw updateError;
          }
        }
        stopTracking();
        onComplete({ ...orderData, orderId });
        navigate(`/order-success?orderId=${orderId}&mode=request-submitted`);
        return;
      } catch (err: any) {
        console.error("OrderWizardConciergeVariant: Error submitting order request:", err);
        setError(err.message || "Failed to submit request. Please try again.");
        return;
      }
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      markAsActive(orderData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      markAsActive(orderData);
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
              markAsActive(orderData);
            }}
            error={error}
            documents={orderData.documents}
          />
        );
      case 1:
        return (
          <ServiceAndDocumentStep
            serviceData={orderData.services}
            updateServiceData={(data) => {
              updateOrderData("services", data);
              markAsActive(orderData);
            }}
            documents={orderData.documents}
            updateDocuments={(docs) => {
              updateDocuments(docs);
              markAsActive(orderData);
            }}
            orderId={orderId}
            orderEditToken={orderEditToken}
          />
        );
      case 2:
        return (
          <DeliveryDetailsStep
            data={orderData.services}
            updateData={(data) => {
              updateOrderData("services", data);
              markAsActive(orderData);
            }}
            orderId={orderId}
            orderEditToken={orderEditToken}
          />
        );
      case 3:
        return <ReviewStep orderData={orderData} />;
      default:
        return null;
    }
  };

  const activeStep = stepMeta[currentStep] || stepMeta[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eaf2ff_0%,#f7faff_32%,#f8fafc_65%,#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_380px] lg:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] px-6 py-7 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-800">
                        <Sparkles className="h-3.5 w-3.5" /> Guided order intake
                      </span>
                      {trustPills.map((pill) => (
                        <span
                          key={pill}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                      A more elegant way to place your order.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                      We organize the process into a clean, four-step intake so customers know exactly what’s needed, what happens next, and why the request feels legitimate.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[280px] lg:max-w-[320px] lg:grid-cols-1">
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Progress
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_100%)] transition-all duration-500"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {completionPercent}% complete
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Support posture
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        Human-reviewed intake
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Designed for evaluation, immigration, and translation cases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8">
                <div className="grid gap-4 md:grid-cols-4">
                  {stepMeta.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isDone = index < currentStep;
                    return (
                      <div
                        key={step.title}
                        className={cn(
                          "rounded-[24px] border px-4 py-4 transition-all",
                          isActive
                            ? "border-slate-900 bg-slate-950 text-white shadow-xl"
                            : isDone
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-2xl",
                              isActive
                                ? "bg-white/10"
                                : isDone
                                  ? "bg-white text-emerald-700"
                                  : "bg-white text-slate-500"
                            )}
                          >
                            {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-semibold">{step.title}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <ConciergeStepCard {...activeStep}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                >
                  {renderCurrentStep()}
                </motion.div>
              </AnimatePresence>
            </ConciergeStepCard>

            {(error || currentStep === totalSteps - 1) && (
              <div className="space-y-4">
                {error && (
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-900">
                    {error}
                  </div>
                )}
              </div>
            )}

            <ConciergeStepNavigation
              currentStep={currentStep}
              totalSteps={totalSteps}
              onBack={handleBack}
              onNext={handleNext}
              isSubmitting={isSubmitting}
            />
          </div>

          <ConciergeSummary orderData={orderData} currentStep={currentStep} />
        </div>

        <div className="mt-8 grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
          {[
            {
              icon: Mail,
              title: "Email updates",
              copy: "You receive a clean paper trail for previews, receipt, and next steps.",
            },
            {
              icon: Phone,
              title: "Legitimate contact path",
              copy: "Customers entering immigration-sensitive documents need obvious ways to verify who they’re dealing with.",
            },
            {
              icon: ShieldCheck,
              title: "Trust cues without clutter",
              copy: "Less noise, stronger hierarchy, and no carnival-barker UI pretending to be reassurance.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <item.icon className="h-5 w-5 text-blue-700" />
              <p className="mt-4 text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderWizardConciergeVariant;
