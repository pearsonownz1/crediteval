import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Globe2,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { useOrderContext } from "../../contexts/OrderContext";
import { useOrderData } from "./hooks/useOrderData";
import { useOrderValidation } from "./hooks/useOrderValidation";
import { useAbandonedCartTracking } from "./hooks/useAbandonedCartTracking";
import { getStepTitles } from "../../constants/order/steps";
import {
  DELIVERY_OPTIONS,
  LANGUAGES,
  URGENCY_OPTIONS,
  VISA_TYPES,
} from "../../constants/order/serviceOptions";
import { COUNTRIES } from "../../constants/order/countries";
import { OrderWizardProps } from "../../types/order/index";
import { ServiceInfo } from "../../types/order/services";
import {
  createOrder,
  getOrder,
  updateOrderServices,
  updateOrderWithServices,
} from "../../utils/order/orderAPI";
import { trackCheckoutStarted } from "../../utils/analytics";
import { calculatePrice } from "../../utils/order/priceCalculation";
import { supabase } from "../../lib/supabaseClient";
import { ordersTable } from "../../lib/ordersTable";
import { DocumentUploadStep } from "./steps/DocumentUploadStep";

const serviceCards = [
  {
    value: "evaluation" as const,
    title: "Credential evaluation",
    price: "from $85",
    description: "US equivalency reports for schools, employers, and immigration.",
    bullets: ["Document or course-by-course", "Fast turnaround options"],
    badge: "Most common",
  },
  {
    value: "translation" as const,
    title: "Certified translation",
    price: "from $25 / page",
    description: "Certified translations with optional notarization and mailed copies.",
    bullets: ["Preview-first workflow", "Built for USCIS and admissions"],
    badge: "Low-friction",
  },
  {
    value: "expert" as const,
    title: "Expert opinion letter",
    price: "$599 flat",
    description: "Support specialized visa or equivalency cases with a tailored expert letter.",
    bullets: ["Visa-specific framing", "Direct case support"],
    badge: "High value",
  },
];

const urgencyMeta: Record<NonNullable<ServiceInfo["urgency"]>, { label: string; chip: string }> = {
  standard: { label: "7–10 business days", chip: "Best value" },
  expedited: { label: "3–5 business days", chip: "Popular" },
  rush: { label: "1–2 business days", chip: "Fastest" },
};

const stepBlips = [
  "Lock in your request",
  "Configure service",
  "Set delivery",
  "Submit",
] as const;

const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

const getServiceLabel = (services: ServiceInfo) => {
  switch (services.type) {
    case "translation":
      return "Certified Translation";
    case "evaluation":
      return services.evaluationType === "course"
        ? "Course-by-Course Evaluation"
        : services.evaluationType === "document"
          ? "Document-by-Document Evaluation"
          : "Credential Evaluation";
    case "expert":
      return "Expert Opinion Letter";
    default:
      return "Choose a service";
  }
};

const getPriceAnchor = (services: ServiceInfo) => {
  if (services.type === "translation") return "$25/page starting rate";
  if (services.type === "expert") return "$599 flat fee";
  if (services.evaluationType === "course") return "$150 base fee";
  if (services.evaluationType === "document") return "$85 base fee";
  return "Transparent pricing";
};

const OrderWizardV2: React.FC<OrderWizardProps> = ({
  onComplete = () => {},
  initialStep = 0,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);

  const { orderId, setOrderId, orderEditToken, setOrderEditToken } =
    useOrderContext();
  const { orderData, setOrderData, updateOrderData, updateDocuments } =
    useOrderData();
  const orderDataRef = useRef(orderData);

  useEffect(() => {
    orderDataRef.current = orderData;
  }, [orderData]);

  const { validateCustomerInfo } = useOrderValidation();
  const stepTitles = getStepTitles(orderData.services.type);
  const totalSteps = stepTitles.length;
  const isTranslationFlow = orderData.services.type === "translation";
  const basePrice = calculatePrice(orderData.services);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const { markAsActive, stopTracking } = useAbandonedCartTracking(
    {
      customerInfo: orderData.customerInfo,
      services: orderData.services,
      currentStep,
      orderId,
    },
    { delay: 3600000, enabled: true }
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get("orderId");

    const loadOrderData = async () => {
      if (orderIdParam) {
        try {
          const fetchedOrder = await getOrder(orderIdParam);
          if (!fetchedOrder) return;

          const fetchedOrderEditToken =
            fetchedOrder.services?._meta?.editToken || null;

          setOrderData({
            customerInfo: {
              email: fetchedOrder.email || "",
              firstName: fetchedOrder.first_name || "",
              lastName: fetchedOrder.last_name || "",
              phone: fetchedOrder.phone || "",
            },
            documents:
              fetchedOrder.document_paths?.map((path: string) => ({
                id: path,
                name: path.split("/").pop() || path,
                path,
                size: 0,
                type: "",
                file: new File([], ""),
                status: "success",
              })) || [],
            services: {
              type: fetchedOrder.services?.type || undefined,
              languageFrom: fetchedOrder.services?.languageFrom || undefined,
              languageTo: fetchedOrder.services?.languageTo || undefined,
              pageCount: fetchedOrder.services?.pageCount || 1,
              urgency: fetchedOrder.services?.urgency || "standard",
              deliveryType: fetchedOrder.services?.deliveryType || "email",
              evaluationType: fetchedOrder.services?.evaluationType || undefined,
              visaType: fetchedOrder.services?.visaType || undefined,
              notarizationRequested:
                fetchedOrder.services?.notarizationRequested ?? false,
              specialInstructions:
                fetchedOrder.services?.specialInstructions || undefined,
              shippingInfo: {
                country: fetchedOrder.services?.shippingInfo?.country || "",
                address: fetchedOrder.services?.shippingInfo?.address || "",
                apartment:
                  fetchedOrder.services?.shippingInfo?.apartment || "",
                city: fetchedOrder.services?.shippingInfo?.city || "",
                state: fetchedOrder.services?.shippingInfo?.state || "",
                zip: fetchedOrder.services?.shippingInfo?.zip || "",
              },
              previewStatus:
                fetchedOrder.services?.previewStatus || "not_ready",
              unlockStatus:
                fetchedOrder.services?.unlockStatus || "not_available",
              translatorStatus:
                fetchedOrder.services?.translatorStatus || "unassigned",
              deliveryConfirmationStatus:
                fetchedOrder.services?.deliveryConfirmationStatus || "pending",
            },
            payment: {
              method: fetchedOrder.payment?.method || "credit-card",
            },
          });

          setOrderId(orderIdParam);
          if (fetchedOrderEditToken) setOrderEditToken(fetchedOrderEditToken);

          const stepParam = urlParams.get("step");
          const resumedStepTitles = getStepTitles(fetchedOrder.services?.type);
          if (stepParam) {
            const step = Number(stepParam);
            if (!Number.isNaN(step) && step >= 0 && step < resumedStepTitles.length) {
              setCurrentStep(step);
            }
          } else if (fetchedOrder.status === "pending_payment") {
            setCurrentStep(resumedStepTitles.length - 1);
          } else if (fetchedOrder.status === "in_progress") {
            setCurrentStep(1);
          }
        } catch (err) {
          console.error("OrderWizardV2: resume failed", err);
        }
        return;
      }

      const firstName = urlParams.get("firstName");
      const lastName = urlParams.get("lastName");
      const email = urlParams.get("email");
      const phone = urlParams.get("phone");
      const company = urlParams.get("company");
      const serviceParam = urlParams.get("service");
      const urgencyParam = urlParams.get("urgency");
      const deliveryParam = urlParams.get("delivery");
      const evaluationTypeParam = urlParams.get("evaluationType");
      const languageFromParam = urlParams.get("languageFrom");
      const languageToParam = urlParams.get("languageTo");
      const pageCountParam = urlParams.get("pageCount");
      const specialInstructionsParam = urlParams.get("specialInstructions");

      if (firstName || lastName || email || phone || company) {
        updateOrderData("customerInfo", {
          ...orderDataRef.current.customerInfo,
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(company && { company }),
        });
      }

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
        const nextServices: Partial<ServiceInfo> = {
          ...orderDataRef.current.services,
          ...(serviceParam && { type: serviceParam as ServiceInfo["type"] }),
          ...(urgencyParam && { urgency: urgencyParam as ServiceInfo["urgency"] }),
          ...(deliveryParam && {
            deliveryType: deliveryParam as ServiceInfo["deliveryType"],
          }),
          ...(evaluationTypeParam && { evaluationType: evaluationTypeParam }),
          ...(languageFromParam && { languageFrom: languageFromParam }),
          ...(languageToParam && { languageTo: languageToParam }),
          ...(pageCountParam && { pageCount: Number(pageCountParam) || 1 }),
          ...(specialInstructionsParam && {
            specialInstructions: specialInstructionsParam,
          }),
        };
        updateOrderData("services", nextServices);
      }
    };

    void loadOrderData();
    markAsActive(orderDataRef.current);
  }, [markAsActive, setOrderData, setOrderEditToken, setOrderId, updateOrderData]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  const persistServices = async (nextServices: ServiceInfo) => {
    if (!orderId || !orderEditToken) return;
    try {
      await updateOrderServices(orderId, nextServices, orderEditToken);
    } catch (err) {
      console.error("OrderWizardV2: service sync failed", err);
    }
  };

  const setServices = async (patch: Partial<ServiceInfo>) => {
    const nextServices = { ...orderDataRef.current.services, ...patch };
    updateOrderData("services", patch);
    markAsActive({ ...orderDataRef.current, services: nextServices });
    await persistServices(nextServices);
  };

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
          setOrderId(newOrderId);
          setOrderEditToken(editToken);
          trackCheckoutStarted(orderData, newOrderId, calculatePrice(orderData.services));
          setCurrentStep(1);
          markAsActive(orderData);
        } catch (err: any) {
          setError(err.message || "Could not save your details.");
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setCurrentStep(1);
      }
      return;
    }

    if (currentStep === 1) {
      if (!orderData.services.type) {
        setError("Choose a service to continue.");
        return;
      }
      if (orderData.services.type === "translation") {
        if (!orderData.services.languageFrom || !orderData.services.languageTo) {
          setError("Select both source and target languages.");
          return;
        }
      }
      if (orderData.services.type === "evaluation" && !orderData.services.evaluationType) {
        setError("Choose the evaluation type.");
        return;
      }
      if (orderData.services.type === "expert" && !orderData.services.visaType) {
        setError("Choose the visa type for the letter.");
        return;
      }
      if (!orderData.documents.length) {
        setUploadHint("You can submit without files, but upload speeds up review.");
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (
        orderData.services.deliveryType !== "email" &&
        (!orderData.services.shippingInfo.country ||
          !orderData.services.shippingInfo.address ||
          !orderData.services.shippingInfo.city ||
          !orderData.services.shippingInfo.state ||
          !orderData.services.shippingInfo.zip)
      ) {
        setError("Complete the shipping address for mailed delivery.");
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === totalSteps - 1) {
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

      setIsSubmitting(true);
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
            .update({ services: submittedServices, status: "submitted" })
            .eq("id", orderId);
          if (updateError) throw updateError;
        }

        stopTracking();
        onComplete({ ...orderData, orderId });
        navigate(`/order-success?orderId=${orderId}&mode=request-submitted`);
      } catch (err: any) {
        setError(err.message || "Failed to submit request.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) setCurrentStep((step) => step - 1);
  };

  const uploadedCount = orderData.documents.filter((doc) => doc.status === "success").length;
  const deliveryLabel = useMemo(() => {
    return DELIVERY_OPTIONS.find((item) => item.value === orderData.services.deliveryType)?.label ||
      "Email copy";
  }, [orderData.services.deliveryType]);

  const reviewHighlights = [
    getServiceLabel(orderData.services),
    orderData.services.urgency
      ? urgencyMeta[orderData.services.urgency].label
      : "Standard turnaround",
    deliveryLabel,
  ];

  const StepCard = ({ children }: { children: React.ReactNode }) => (
    <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_30%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px] lg:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                    <Sparkles className="h-4 w-4" /> Order flow v2
                  </div>
                  <div className="space-y-3">
                    <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                      Order in minutes. Know the price logic before you commit.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                      A sharper intake built for speed: choose the service, upload files,
                      set delivery, and submit with a clean commercial summary the whole way.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Fast intake", "4 short steps"],
                      ["Clear pricing", "Base rate + delivery + speed"],
                      ["Production ready", "Same backend, better UX"],
                    ].map(([title, text]) => (
                      <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold text-white">{title}</div>
                        <div className="mt-1 text-sm text-slate-300">{text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Completion momentum
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {Math.round(progress)}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
                      {stepBlips[currentStep]}
                    </div>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-4 gap-3 text-center">
                    {stepTitles.map((title, index) => (
                      <div key={title} className="space-y-2">
                        <div
                          className={cn(
                            "mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition-all",
                            index <= currentStep
                              ? "border-sky-300 bg-white text-slate-950"
                              : "border-white/10 bg-white/5 text-slate-400"
                          )}>
                          {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <p className="text-xs text-slate-300">{title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <StepCard>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}>
                  <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                          Step {currentStep + 1} of {totalSteps}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                          {stepTitles[currentStep]}
                        </h2>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {currentStep === 0 && "Secure your order record first."}
                        {currentStep === 1 && "Pick the exact service and attach documents."}
                        {currentStep === 2 && "Choose email or mailed delivery."}
                        {currentStep === 3 && "Final check before you submit."}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    {currentStep === 0 && (
                      <div className="space-y-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="v2-first-name">First name</Label>
                            <Input
                              id="v2-first-name"
                              placeholder="John"
                              value={orderData.customerInfo.firstName}
                              onChange={(e) =>
                                updateOrderData("customerInfo", { firstName: e.target.value })
                              }
                              className="h-12 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="v2-last-name">Last name</Label>
                            <Input
                              id="v2-last-name"
                              placeholder="Doe"
                              value={orderData.customerInfo.lastName}
                              onChange={(e) =>
                                updateOrderData("customerInfo", { lastName: e.target.value })
                              }
                              className="h-12 rounded-2xl border-slate-200"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
                          <div className="space-y-2">
                            <Label htmlFor="v2-email">Email</Label>
                            <Input
                              id="v2-email"
                              type="email"
                              placeholder="you@example.com"
                              value={orderData.customerInfo.email}
                              onChange={(e) =>
                                updateOrderData("customerInfo", { email: e.target.value })
                              }
                              className="h-12 rounded-2xl border-slate-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="v2-phone">Phone</Label>
                            <Input
                              id="v2-phone"
                              type="tel"
                              placeholder="Optional"
                              value={orderData.customerInfo.phone}
                              onChange={(e) =>
                                updateOrderData("customerInfo", { phone: e.target.value })
                              }
                              className="h-12 rounded-2xl border-slate-200"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                          {[
                            {
                              icon: ShieldCheck,
                              title: "Secure intake",
                              text: "We create your order record first so uploads and edits stay tied to your request.",
                            },
                            {
                              icon: Clock3,
                              title: "Faster completion",
                              text: "Only the fields that matter show up next. Less noise, faster decisions.",
                            },
                            {
                              icon: PackageCheck,
                              title: "Production-ready handoff",
                              text: "This variant uses the same backend order pipeline as the live flow.",
                            },
                          ].map((item) => (
                            <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                              <item.icon className="h-5 w-5 text-sky-700" />
                              <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="space-y-8">
                        <div>
                          <div className="grid gap-4 lg:grid-cols-3">
                            {serviceCards.map((card) => {
                              const isActive = orderData.services.type === card.value;
                              return (
                                <button
                                  key={card.value}
                                  type="button"
                                  onClick={() => {
                                    const patch: Partial<ServiceInfo> = {
                                      type: card.value,
                                      ...(card.value !== "translation" && {
                                        languageFrom: undefined,
                                        languageTo: undefined,
                                      }),
                                      ...(card.value !== "evaluation" && {
                                        evaluationType: undefined,
                                      }),
                                      ...(card.value !== "expert" && { visaType: undefined }),
                                    };
                                    void setServices(patch);
                                  }}
                                  className={cn(
                                    "rounded-[28px] border p-5 text-left transition-all",
                                    isActive
                                      ? "border-sky-500 bg-sky-50 shadow-[0_18px_40px_rgba(14,165,233,0.14)]"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                  )}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                        {card.badge}
                                      </div>
                                      <h3 className="mt-4 text-lg font-semibold text-slate-950">
                                        {card.title}
                                      </h3>
                                    </div>
                                    {isActive && (
                                      <div className="rounded-full bg-sky-600 p-2 text-white">
                                        <Check className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm font-semibold text-sky-700">{card.price}</p>
                                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                                  <div className="mt-4 space-y-2">
                                    {card.bullets.map((bullet) => (
                                      <div key={bullet} className="flex items-center gap-2 text-sm text-slate-700">
                                        <BadgeCheck className="h-4 w-4 text-emerald-600" /> {bullet}
                                      </div>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {orderData.services.type === "translation" && (
                          <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Language from</Label>
                              <Select
                                value={orderData.services.languageFrom}
                                onValueChange={(value) => void setServices({ languageFrom: value })}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                                  <SelectValue placeholder="Source language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                      {lang.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Language to</Label>
                              <Select
                                value={orderData.services.languageTo}
                                onValueChange={(value) => void setServices({ languageTo: value })}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                                  <SelectValue placeholder="Target language" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                      {lang.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="v2-page-count">Pages</Label>
                              <Input
                                id="v2-page-count"
                                type="number"
                                min={1}
                                value={orderData.services.pageCount || 1}
                                onChange={(e) =>
                                  void setServices({ pageCount: Math.max(1, Number(e.target.value) || 1) })
                                }
                                className="h-12 rounded-2xl border-slate-200 bg-white"
                              />
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                              <Checkbox
                                id="v2-notarization"
                                checked={orderData.services.notarizationRequested}
                                onCheckedChange={(checked) =>
                                  void setServices({ notarizationRequested: checked === true })
                                }
                              />
                              <div>
                                <Label htmlFor="v2-notarization" className="cursor-pointer font-medium">
                                  Add notarization
                                </Label>
                                <p className="mt-1 text-sm text-slate-600">
                                  Include this now so the final quote is framed correctly.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {orderData.services.type === "evaluation" && (
                          <div className="grid gap-4 lg:grid-cols-2">
                            {[
                              {
                                value: "document",
                                title: "Document-by-Document",
                                price: "$85",
                                description: "Best for employment, licensing, and many immigration use cases.",
                              },
                              {
                                value: "course",
                                title: "Course-by-Course",
                                price: "$150",
                                description: "Best for school admissions and detailed transfer-credit review.",
                              },
                            ].map((option) => {
                              const active = orderData.services.evaluationType === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => void setServices({ evaluationType: option.value })}
                                  className={cn(
                                    "rounded-[28px] border p-5 text-left transition-all",
                                    active
                                      ? "border-sky-500 bg-sky-50 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  )}>
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-950">{option.title}</h3>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                      {option.price}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {orderData.services.type === "expert" && (
                          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Visa type</Label>
                                <Select
                                  value={orderData.services.visaType}
                                  onValueChange={(value) => void setServices({ visaType: value })}>
                                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                                    <SelectValue placeholder="Select visa type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VISA_TYPES.map((visa) => (
                                      <SelectItem key={visa.value} value={visa.value}>
                                        {visa.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                                We keep this step direct: choose the visa frame now, then use the notes field below for case specifics.
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                          <div className="space-y-2 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                            <Label>Processing speed</Label>
                            <div className="mt-3 space-y-3">
                              {URGENCY_OPTIONS.map((option) => {
                                const active = orderData.services.urgency === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => void setServices({ urgency: option.value as ServiceInfo["urgency"] })}
                                    className={cn(
                                      "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all",
                                      active
                                        ? "border-sky-500 bg-white shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                    )}>
                                    <div>
                                      <div className="font-medium text-slate-950">{option.label}</div>
                                      <div className="mt-1 text-sm text-slate-500">
                                        {urgencyMeta[option.value].chip}
                                      </div>
                                    </div>
                                    {active ? <Check className="h-5 w-5 text-sky-600" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                            <Label htmlFor="v2-notes">Notes for our team</Label>
                            <Textarea
                              id="v2-notes"
                              placeholder="Purpose of the order, deadline, institution, country, or anything else that helps us route it correctly."
                              value={orderData.services.specialInstructions || ""}
                              onChange={(e) =>
                                updateOrderData("services", { specialInstructions: e.target.value })
                              }
                              onBlur={() => void persistServices(orderDataRef.current.services)}
                              className="mt-3 min-h-[180px] rounded-[24px] border-slate-200 bg-white"
                            />
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-950">Upload documents</h3>
                              <p className="text-sm text-slate-600">
                                File upload is optional for submission, but it speeds up review and quote accuracy.
                              </p>
                            </div>
                          </div>
                          <DocumentUploadStep
                            documents={orderData.documents}
                            updateDocuments={(docs) => {
                              updateDocuments(docs);
                              markAsActive(orderDataRef.current);
                            }}
                            orderId={orderId}
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-8">
                        <div className="grid gap-4 lg:grid-cols-3">
                          {DELIVERY_OPTIONS.map((option) => {
                            const active = orderData.services.deliveryType === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => void setServices({ deliveryType: option.value as ServiceInfo["deliveryType"] })}
                                className={cn(
                                  "rounded-[28px] border p-5 text-left transition-all",
                                  active
                                    ? "border-sky-500 bg-sky-50 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                )}>
                                <div className="flex items-center justify-between gap-3">
                                  <Globe2 className="h-5 w-5 text-sky-700" />
                                  {active && <Check className="h-5 w-5 text-sky-700" />}
                                </div>
                                <p className="mt-4 text-base font-semibold text-slate-950">{option.label}</p>
                              </button>
                            );
                          })}
                        </div>

                        {orderData.services.deliveryType !== "email" && (
                          <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                            <h3 className="text-lg font-semibold text-slate-950">Shipping address</h3>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2 sm:col-span-2">
                                <Label>Country</Label>
                                <Select
                                  value={orderData.services.shippingInfo.country}
                                  onValueChange={(value) =>
                                    void setServices({
                                      shippingInfo: {
                                        ...orderData.services.shippingInfo,
                                        country: value,
                                      },
                                    })
                                  }>
                                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COUNTRIES.map((country) => (
                                      <SelectItem key={country.value} value={country.value}>
                                        {country.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="v2-address">Street address</Label>
                                <Input
                                  id="v2-address"
                                  value={orderData.services.shippingInfo.address}
                                  onChange={(e) =>
                                    updateOrderData("services", {
                                      shippingInfo: {
                                        ...orderData.services.shippingInfo,
                                        address: e.target.value,
                                      },
                                    })
                                  }
                                  onBlur={() => void persistServices(orderDataRef.current.services)}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                />
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="v2-apartment">Apartment / suite</Label>
                                <Input
                                  id="v2-apartment"
                                  value={orderData.services.shippingInfo.apartment}
                                  onChange={(e) =>
                                    updateOrderData("services", {
                                      shippingInfo: {
                                        ...orderData.services.shippingInfo,
                                        apartment: e.target.value,
                                      },
                                    })
                                  }
                                  onBlur={() => void persistServices(orderDataRef.current.services)}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="v2-city">City</Label>
                                <Input
                                  id="v2-city"
                                  value={orderData.services.shippingInfo.city}
                                  onChange={(e) =>
                                    updateOrderData("services", {
                                      shippingInfo: {
                                        ...orderData.services.shippingInfo,
                                        city: e.target.value,
                                      },
                                    })
                                  }
                                  onBlur={() => void persistServices(orderDataRef.current.services)}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="v2-state">State / province</Label>
                                <Input
                                  id="v2-state"
                                  value={orderData.services.shippingInfo.state}
                                  onChange={(e) =>
                                    updateOrderData("services", {
                                      shippingInfo: {
                                        ...orderData.services.shippingInfo,
                                        state: e.target.value,
                                      },
                                    })
                                  }
                                  onBlur={() => void persistServices(orderDataRef.current.services)}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                />
                              </div>
                              <div className="space-y-2 sm:col-span-2 lg:max-w-xs">
                                <Label htmlFor="v2-zip">Zip / postal code</Label>
                                <Input
                                  id="v2-zip"
                                  value={orderData.services.shippingInfo.zip}
                                  onChange={(e) =>
                                    updateOrderData("services", {
                                      shippingInfo: {
                                        ...orderData.services.shippingInfo,
                                        zip: e.target.value,
                                      },
                                    })
                                  }
                                  onBlur={() => void persistServices(orderDataRef.current.services)}
                                  className="h-12 rounded-2xl border-slate-200 bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                              Contact
                            </p>
                            <div className="mt-4 space-y-2 text-sm text-slate-700">
                              <p className="font-medium text-slate-950">
                                {orderData.customerInfo.firstName} {orderData.customerInfo.lastName}
                              </p>
                              <p>{orderData.customerInfo.email}</p>
                              {orderData.customerInfo.phone && <p>{orderData.customerInfo.phone}</p>}
                            </div>
                          </div>

                          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                              Submission payload
                            </p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              {reviewHighlights.map((item) => (
                                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-sky-700" />
                            <h3 className="text-lg font-semibold text-slate-950">What you’re submitting</h3>
                          </div>
                          <div className="mt-5 space-y-4 text-sm text-slate-700">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <span>Service</span>
                              <span className="font-semibold text-slate-950">{getServiceLabel(orderData.services)}</span>
                            </div>
                            {orderData.services.type === "translation" && (
                              <>
                                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                  <span>Language pair</span>
                                  <span className="font-semibold text-slate-950">
                                    {orderData.services.languageFrom || "—"} → {orderData.services.languageTo || "—"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                  <span>Pages</span>
                                  <span className="font-semibold text-slate-950">{orderData.services.pageCount || 1}</span>
                                </div>
                              </>
                            )}
                            {orderData.services.type === "evaluation" && (
                              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <span>Evaluation type</span>
                                <span className="font-semibold text-slate-950">
                                  {orderData.services.evaluationType === "course"
                                    ? "Course-by-Course"
                                    : orderData.services.evaluationType === "document"
                                      ? "Document-by-Document"
                                      : "—"}
                                </span>
                              </div>
                            )}
                            {orderData.services.type === "expert" && (
                              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <span>Visa type</span>
                                <span className="font-semibold text-slate-950">{orderData.services.visaType || "—"}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <span>Turnaround</span>
                              <span className="font-semibold text-slate-950">
                                {orderData.services.urgency ? urgencyMeta[orderData.services.urgency].label : "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <span>Delivery</span>
                              <span className="font-semibold text-slate-950">{deliveryLabel}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <span>Uploaded documents</span>
                              <span className="font-semibold text-slate-950">{uploadedCount}</span>
                            </div>
                            {orderData.services.specialInstructions && (
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-6 text-slate-600">
                                {orderData.services.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>

                        {orderData.services.deliveryType !== "email" && (
                          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                            <span className="font-semibold text-slate-950">Shipping to:</span>{" "}
                            {orderData.services.shippingInfo.address}
                            {orderData.services.shippingInfo.apartment ? `, ${orderData.services.shippingInfo.apartment}` : ""}, {orderData.services.shippingInfo.city}, {orderData.services.shippingInfo.state} {orderData.services.shippingInfo.zip}, {orderData.services.shippingInfo.country}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </StepCard>

            <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
                className="h-12 rounded-2xl border-slate-200 px-5">
                Back
              </Button>
              <div className="flex-1 text-center text-sm text-slate-500">
                {error ? (
                  <span className="font-medium text-rose-600">{error}</span>
                ) : uploadHint ? (
                  <span>{uploadHint}</span>
                ) : currentStep === totalSteps - 1 ? (
                  <span>Submitting creates the request and routes it to the team immediately.</span>
                ) : (
                  <span>Fewer fields. Faster completion. No mystery pricing.</span>
                )}
              </div>
              <Button
                onClick={() => void handleNext()}
                disabled={isSubmitting}
                className="h-12 rounded-2xl bg-slate-950 px-6 text-base font-semibold hover:bg-slate-800">
                {currentStep === 0 && isSubmitting
                  ? "Saving..."
                  : currentStep === totalSteps - 1
                    ? "Submit request"
                    : "Continue"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
                  Commercial summary
                </p>
                <h3 className="mt-2 text-2xl font-semibold">Decision support</h3>
              </div>
              <div className="space-y-5 p-6">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Selected service
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{getServiceLabel(orderData.services)}</p>
                  <p className="mt-2 text-sm text-slate-600">{getPriceAnchor(orderData.services)}</p>
                </div>

                <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Base estimate</span>
                    <span className="font-semibold text-slate-950">
                      {orderData.services.type ? formatMoney(basePrice) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Speed</span>
                    <span className="font-semibold text-slate-950">
                      {orderData.services.urgency ? urgencyMeta[orderData.services.urgency].chip : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Delivery</span>
                    <span className="font-semibold text-slate-950">
                      {orderData.services.deliveryType === "email"
                        ? "Digital"
                        : orderData.services.deliveryType === "express"
                          ? "+$99"
                          : "+$150"}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                    Estimate updates live from your current selections. Final review may adjust for document complexity.
                  </div>
                </div>

                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="font-semibold text-emerald-950">Momentum checkpoint</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        {uploadedCount > 0
                          ? `${uploadedCount} file${uploadedCount > 1 ? "s" : ""} uploaded — review should move faster.`
                          : "No files yet — still fine to submit, but uploads improve routing and speed."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Why this flow converts
                  </p>
                  {[
                    "Shorter copy, stronger hierarchy",
                    "Service-first pricing clarity",
                    "Direct momentum through each step",
                    "Same backend, no broken core flow",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                      <Star className="h-4 w-4 text-sky-700" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Trust signals
              </p>
              <div className="mt-4 space-y-4">
                {[
                  ["Fast response", "Built to collect complete order context on the first pass."],
                  ["Clear framing", "Prices are anchored visibly instead of buried in prose."],
                  ["Safer handoff", "Uploads, service details, and delivery sync into one order record."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderWizardV2;
