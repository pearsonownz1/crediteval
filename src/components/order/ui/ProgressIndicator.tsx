import React from "react";
import { Progress } from "../../ui/progress";
import { UserIcon, Globe, Truck, Check, DollarSign } from "lucide-react";
import { getStepTitles } from "../../../constants/order/steps";

interface ProgressIndicatorProps {
  currentStep: number;
  serviceType?: string;
}

// Define step configurations with icons in the component
const getStepConfig = (index: number, stepTitles: readonly string[]) => {
  const icons = [
    <UserIcon className="h-5 w-5" />,
    <Globe className="h-5 w-5" />,
    <Truck className="h-5 w-5" />,
    <Check className="h-5 w-5" />,
    <DollarSign className="h-5 w-5" />,
  ];

  return {
    title: stepTitles[index],
    icon: icons[index],
  };
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  serviceType,
}) => {
  const stepTitles = getStepTitles(serviceType);
  const totalSteps = stepTitles.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mt-4">
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between mt-2">
        {stepTitles.map((_, index) => {
          const stepConfig = getStepConfig(index, stepTitles);
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
