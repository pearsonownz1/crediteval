import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { ArrowDownToLine, CreditCard, FileLock2, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  callPaymentIntent,
  sendReceiptEmail,
  updateOrderServicesWithStatus,
} from "../utils/order/orderAPI";
import { Order } from "../types/order";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const NOTARIZATION_FEE = 2500;
const EXPRESS_MAIL_FEE = 1500;
const INTERNATIONAL_MAIL_FEE = 4500;

const formatMoney = (amountInCents: number) =>
  `$${(amountInCents / 100).toFixed(2)}`;

const buildWatermarkLabel = (order: Order) => {
  const customerName = `${order.first_name || ""} ${order.last_name || ""}`.trim();
  return customerName
    ? `CreditEval Preview • ${customerName} • Order #${order.id}`
    : `CreditEval Preview • Order #${order.id}`;
};

const normalizeAmount = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getMailingFee = (deliveryType: string, order: Order) => {
  if (deliveryType === "express") {
    return order.services?.expressMailFee ?? EXPRESS_MAIL_FEE;
  }

  if (deliveryType === "international") {
    return order.services?.internationalMailFee ?? INTERNATIONAL_MAIL_FEE;
  }

  return 0;
};

const OrderReviewCheckout = ({
  order,
  token,
  previewUrl,
  finalUrl,
  onOrderUpdated,
}: {
  order: Order;
  token: string;
  previewUrl: string;
  finalUrl: string;
  onOrderUpdated: (nextOrder: Order) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(
    order.services?.deliveryType || "email"
  );
  const [notarizationSelected, setNotarizationSelected] = useState(
    order.services?.notarizationRequested ?? false
  );
  const [isPaying, setIsPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const baseAmount = normalizeAmount(
    order.services?.quotedUnlockAmount ?? order.total_amount
  );
  const mailingFee = getMailingFee(selectedDeliveryType, order);
  const notarizationFee = notarizationSelected
    ? order.services?.notarizationFee ?? NOTARIZATION_FEE
    : 0;
  const totalAmount = baseAmount + mailingFee + notarizationFee;
  const hasQuote = baseAmount > 0;
  const isPaid =
    order.services?.unlockStatus === "paid" || order.status === "paid";

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setMessage("Stripe is still loading. Please try again in a moment.");
      return;
    }

    if (!token) {
      setMessage("This review link is missing its secure token.");
      return;
    }

    if (totalAmount < 50) {
      setMessage("This order does not have a valid unlock price yet.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setMessage("Card input is unavailable. Please refresh and try again.");
      return;
    }

    setIsPaying(true);
    setMessage(null);

    const updatedServices = {
      ...(order.services || {}),
      deliveryType: selectedDeliveryType,
      notarizationRequested: notarizationSelected,
      quotedUnlockAmount: baseAmount,
      unlockStatus: "checkout_started" as const,
    };

    try {
      const { clientSecret, error } = await callPaymentIntent(
        order.id,
        totalAmount,
        updatedServices
      );

      if (error || !clientSecret) {
        throw new Error(error || "Failed to start payment.");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${order.first_name} ${order.last_name}`.trim(),
              email: order.email,
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed.");
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error(
          "Payment is still processing. Please try again shortly."
        );
      }

      const paidServices = {
        ...updatedServices,
        unlockStatus: "paid" as const,
        paidAt: new Date().toISOString(),
      };

      await updateOrderServicesWithStatus(order.id, paidServices, token, "paid");
      await sendReceiptEmail(order.id);

      const nextOrder = {
        ...order,
        status: "paid",
        total_amount: totalAmount,
        services: paidServices,
      } as Order;

      onOrderUpdated(nextOrder);
      setMessage("Payment successful. Your final file is ready to download.");
      navigate(
        `/order-review/${order.id}?token=${encodeURIComponent(token)}&paid=1`,
        { replace: true }
      );
    } catch (error: any) {
      console.error("Order review payment failed:", error);
      setMessage(error.message || "Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,45,85,0.12)]">
      <div className="space-y-6 p-6">
        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-slate-950">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            Unlock Final Delivery
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                {hasQuote ? "Total due today" : "Quote pending"}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-[2rem]">
                {hasQuote ? formatMoney(totalAmount) : "Awaiting quote"}
              </h2>
            </div>
            <div className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Order
              </p>
              <p className="text-sm font-semibold text-slate-950">#{order.id}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-[24px] bg-white p-5 text-slate-900">
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Language pair</span>
              <span className="font-medium">
                {order.services?.languageFrom || "Source"} to{" "}
                {order.services?.languageTo || "Target"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Pages</span>
              <span className="font-medium">{order.services?.pageCount || 1}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Base translation</span>
              <span className="font-medium">
                {hasQuote ? formatMoney(baseAmount) : "To be quoted"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-900">
              Delivery preference
            </Label>
            <Select
              value={selectedDeliveryType}
              onValueChange={(value) =>
                setSelectedDeliveryType(
                  value as "email" | "express" | "international"
                )
              }>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Digital delivery</SelectItem>
                <SelectItem value="express">
                  Mailed copy (+{formatMoney(getMailingFee("express", order))})
                </SelectItem>
                <SelectItem value="international">
                  International mail (+
                  {formatMoney(getMailingFee("international", order))})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="review-notarization"
                checked={notarizationSelected}
                onCheckedChange={(checked) =>
                  setNotarizationSelected(checked === true)
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="review-notarization"
                  className="text-sm font-semibold text-slate-900">
                  Add notarization
                </Label>
                <p className="text-sm leading-6 text-slate-500">
                  Include a notarized certificate with the final delivery for{" "}
                  {formatMoney(order.services?.notarizationFee ?? NOTARIZATION_FEE)}.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-slate-500">Translation</span>
              <span className="font-medium">
                {hasQuote ? formatMoney(baseAmount) : "To be quoted"}
              </span>
            </div>
            {mailingFee > 0 && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Mailing</span>
                <span className="font-medium">{formatMoney(mailingFee)}</span>
              </div>
            )}
            {notarizationFee > 0 && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-500">Notarization</span>
                <span className="font-medium">{formatMoney(notarizationFee)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{hasQuote ? formatMoney(totalAmount) : "Awaiting quote"}</span>
            </div>
          </div>

          {isPaid ? (
            <div className="space-y-3">
              <Button
                asChild
                className="h-12 w-full rounded-2xl bg-emerald-600 text-base font-semibold hover:bg-emerald-700">
                <a
                  href={finalUrl || previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Download Final Translation
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-2xl border-slate-200 text-base font-semibold">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  View Preview Again
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#10233f",
                        "::placeholder": {
                          color: "#7b8aa0",
                        },
                      },
                    },
                  }}
                />
              </div>
              <Button
                className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700"
                onClick={handlePayment}
                disabled={isPaying || !hasQuote}>
                <CreditCard className="mr-2 h-4 w-4" />
                {isPaying
                  ? "Processing Payment..."
                  : hasQuote
                  ? `Purchase For ${formatMoney(totalAmount)}`
                  : "Purchase Available After Quote"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-2xl border-slate-200 bg-white text-base font-semibold text-slate-900 hover:bg-slate-50"
                disabled={!previewUrl}>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Review Preview In New Tab
                </a>
              </Button>
            </div>
          )}

          {message && (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {message}
            </p>
          )}

          {!hasQuote && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              This order doesn’t have a saved unlock quote yet. The preview can
              still be reviewed, but payment should stay disabled until the admin
              side saves the quoted amount.
            </p>
          )}

          <div className="grid gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Secure purchase and final delivery
            </div>
            <div className="flex items-start gap-2">
              <FileLock2 className="mt-0.5 h-4 w-4 text-sky-600" />
              <span>
                Your watermarked preview stays visible while the clean final file
                is released after payment.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderReviewPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watermarkLabel = order ? buildWatermarkLabel(order) : "";

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const functionUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/get-order-review-data?orderId=${encodeURIComponent(
          orderId
        )}&token=${encodeURIComponent(token)}`;
        const response = await fetch(functionUrl, {
          method: "GET",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load your review page.");
        }

        setOrder(payload.order as Order);
        setPreviewUrl(payload.previewUrl || "");
        setFinalUrl(payload.finalUrl || "");
      } catch (error: any) {
        console.error("Failed to load review order:", error);
        setError(error.message || "Failed to load your review page.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, token]);

  if (loading) {
    return <div className="container py-16">Loading your review page...</div>;
  }

  if (error || !order) {
    return (
      <div className="container py-16">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-medium text-slate-900">
            {error || "We couldn't load this review page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_52%,#ffffff_100%)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-5xl">
          <div className="mb-4 inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 backdrop-blur">
            Private Translation Review
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Review your preview on the left. Unlock the final version on the right.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Check the watermarked PDF, confirm delivery options, and complete
            payment whenever you’re ready. Once purchased, your clean final file
            becomes available for download.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-sm font-semibold">Watermarked Preview</p>
                <p className="text-xs text-slate-300">
                  Protected review copy for order #{order.id}
                </p>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
                Preview Only
              </div>
            </div>
            <div className="relative min-h-[68vh] bg-[linear-gradient(135deg,#0f172a_0%,#16263d_45%,#1e3a5f_100%)] p-3 sm:p-4 lg:min-h-[72vh]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.16),_transparent_35%)]" />
              <div className="relative h-full min-h-[62vh] overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl lg:min-h-[68vh]">
                {previewUrl ? (
                  <>
                    <iframe
                      title="Translation preview"
                      src={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`}
                      className="relative z-10 h-full w-full border-0 bg-white"
                    />
                    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white/24 to-transparent" />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center px-6">
                        <div className="max-w-[1000px] -rotate-[34deg] select-none text-center text-[34px] font-black uppercase tracking-[0.32em] text-slate-900/16 sm:text-[44px] lg:text-[56px]">
                          {watermarkLabel}
                        </div>
                      </div>
                      <div className="absolute bottom-6 right-6 rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-sm backdrop-blur-sm">
                        Preview Only
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
                    The preview file has not been uploaded yet. Please check your
                    email again later or contact support.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <OrderReviewCheckout
              order={order}
              token={token}
              previewUrl={previewUrl}
              finalUrl={finalUrl}
              onOrderUpdated={setOrder}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewPage;
