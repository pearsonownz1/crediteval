import React from "react";
import { Progress } from "../../ui/progress";
import { UserIcon, Globe, Truck, Check, DollarSign } from "lucide-react";
import { STEP_TITLES, TOTAL_STEPS } from "../../../constants/order/steps";

interface ProgressIndicatorProps {
  currentStep: number;
}

// Define step configurations with icons in the component
const getStepConfig = (index: number) => {
  const icons = [
    <UserIcon className="h-5 w-5" />,
    <Globe className="h-5 w-5" />,
    <Truck className="h-5 w-5" />,
    <Check className="h-5 w-5" />,
    <DollarSign className="h-5 w-5" />,
  ];

  return {
    title: STEP_TITLES[index],
    icon: icons[index],
  };
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
}) => {
  const progressPercentage = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="mt-4">
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between mt-2">
        {STEP_TITLES.map((_, index) => {
          const stepConfig = getStepConfig(index);
          return (
            <div
              key={index}
              className={`flex flex-col items-center ${
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}>
              <div
                className={`rounded-full p-2 ${
                  index <= currentStep ? "bg-primary text-white" : "bg-muted"
                }`}>
                {stepConfig.icon}
              </div>
              <span className="text-xs mt-1">{stepConfig.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
