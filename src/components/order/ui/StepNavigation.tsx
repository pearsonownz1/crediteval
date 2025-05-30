import React from "react";
import { Button } from "../../ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TOTAL_STEPS } from "../../../constants/order/steps";

interface StepNavigationProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
  paymentProcessing?: boolean;
  isStripeReady?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onBack,
  onNext,
  isSubmitting = false,
  paymentProcessing = false,
  isStripeReady = true,
}) => {
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  const getNextButtonText = () => {
    if (isSubmitting && isFirstStep) return "Saving...";
    if (paymentProcessing) return "Processing Payment...";
    if (isLastStep) return "Complete Order";
    return "Next";
  };

  const isNextDisabled = () => {
    if (isSubmitting && isFirstStep) return true;
    if (paymentProcessing) return true;
    if (isLastStep && !isStripeReady) return true;
    return false;
  };

  return (
    <div className="flex w-full items-center">
      {/* Back Button on the Left */}
      <div>
        <Button variant="outline" onClick={onBack} disabled={isFirstStep}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Next Button pushed to the right */}
      <div className="ml-auto">
        <Button onClick={onNext} disabled={isNextDisabled()}>
          {getNextButtonText()}
          {!isSubmitting && !paymentProcessing && !isLastStep && (
            <ArrowRight className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
