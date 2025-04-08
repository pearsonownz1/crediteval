import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  expandedContent?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

const ServiceCard = ({
  icon = <ExternalLink className="h-8 w-8 text-primary" />,
  title = "Service Title",
  description = "This is a description of the service we provide. It includes key benefits and features.",
  expandedContent = "This is additional information about the service that appears when the card is expanded. It can include more details about the process, requirements, or benefits.",
  ctaText = "Get Started",
  onCtaClick = () => console.log("CTA clicked"),
}: ServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="w-full max-w-[350px] h-auto min-h-[400px] flex flex-col bg-white border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-center mb-4">{icon}</div>
        <CardTitle className="text-xl font-bold text-center text-navy-700">
          {title}
        </CardTitle>
        <CardDescription className="text-center mt-2 text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isExpanded && (
          <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
            {expandedContent}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleExpand}
          className="w-full flex items-center justify-center text-primary border-primary hover:bg-primary/10"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              <span>Learn More</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          onClick={onCtaClick}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
