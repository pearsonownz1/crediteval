import React from "react";
import { CardElement } from "@stripe/react-stripe-js";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { Lock as LockIcon } from "lucide-react";

interface PaymentStepProps {
  error: string | null;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({ error }) => {
  const cardElementOptions = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferred payment method
        </p>
      </div>

      <div className="space-y-4 mt-4">
        {/* Secure Payment Indicator */}
        <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
          <LockIcon className="h-4 w-4 mr-1" />
          <span>Secure Payment via Stripe</span>
        </div>

        <Label htmlFor="card-element">Credit or debit card</Label>
        <div className="p-3 border rounded-md bg-white">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>

      {/* Display Payment Error */}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex items-start space-x-2 mt-6">
        <Checkbox id="terms" />
        <div>
          <Label htmlFor="terms" className="font-medium cursor-pointer">
            I agree to the Terms and Conditions
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            By checking this box, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
