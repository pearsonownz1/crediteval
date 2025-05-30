import React from "react";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import {
  Check,
  AlertCircle,
  Circle,
  UserIcon,
  Globe,
  Truck,
  DollarSign,
} from "lucide-react";
import { STEP_TITLES, TOTAL_STEPS } from "../../../constants/order/steps";
import { OrderData } from "../../../types/order";
import { getStepCompletionStatus } from "../../../utils/order/stepValidation";

interface EnhancedProgressIndicatorProps {
  currentStep: number;
  orderData?: OrderData;
  showLabels?: boolean;
}

// Define step configurations with icons in the component
const getStepConfig = (index: number) => {
  const icons = [
    <UserIcon className="h-4 w-4" />,
    <Globe className="h-4 w-4" />,
    <Truck className="h-4 w-4" />,
    <Check className="h-4 w-4" />,
    <DollarSign className="h-4 w-4" />,
  ];

  return {
    title: STEP_TITLES[index],
    icon: icons[index],
  };
};

export const EnhancedProgressIndicator: React.FC<
  EnhancedProgressIndicatorProps
> = ({ currentStep, orderData, showLabels = true }) => {
  const progressPercentage = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <Check className="h-4 w-4" />;
    }

    if (stepIndex === currentStep) {
      return <Circle className="h-4 w-4 fill-current" />;
    }

    if (orderData) {
      const status = getStepCompletionStatus(stepIndex, orderData);
      if (status === "partial") {
        return <AlertCircle className="h-4 w-4" />;
      }
    }

    return getStepConfig(stepIndex).icon;
  };

  const getStepColor = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return "bg-green-500 text-white border-green-500";
    }

    if (stepIndex === currentStep) {
      return "bg-primary text-white border-primary";
    }

    if (orderData) {
      const status = getStepCompletionStatus(stepIndex, orderData);
      if (status === "partial") {
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      }
      if (status === "complete") {
        return "bg-green-100 text-green-700 border-green-300";
      }
    }

    return "bg-muted text-muted-foreground border-muted";
  };

  const getConnectorColor = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return "bg-green-500";
    }
    if (stepIndex === currentStep) {
      return "bg-gradient-to-r from-green-500 to-primary";
    }
    return "bg-muted";
  };

  return (
    <div className="mt-4">
      <div className="mb-4">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>
            Step {currentStep + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-between items-center">
          {STEP_TITLES.map((_, index) => {
            const stepConfig = getStepConfig(index);
            return (
              <div
                key={index}
                className="flex flex-col items-center relative z-10">
                {/* Step Circle */}
                <div
                  className={`rounded-full p-2 border-2 transition-all duration-300 ${getStepColor(
                    index
                  )}`}>
                  {getStepIcon(index)}
                </div>

                {/* Step Label */}
                {showLabels && (
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-medium ${
                        index <= currentStep
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}>
                      {stepConfig.title}
                    </span>

                    {/* Completion Status Badge */}
                    {orderData && index !== currentStep && (
                      <div className="mt-1">
                        {(() => {
                          const status = getStepCompletionStatus(
                            index,
                            orderData
                          );
                          if (index < currentStep && status === "complete") {
                            return (
                              <Badge variant="secondary" className="text-xs">
                                Done
                              </Badge>
                            );
                          }
                          if (index < currentStep && status === "partial") {
                            return (
                              <Badge variant="outline" className="text-xs">
                                Partial
                              </Badge>
                            );
                          }
                          if (index > currentStep && status === "partial") {
                            return (
                              <Badge variant="outline" className="text-xs">
                                Started
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0">
          <div
            className={`h-full transition-all duration-500 ${getConnectorColor(
              currentStep
            )}`}
            style={{ width: `${(currentStep / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
