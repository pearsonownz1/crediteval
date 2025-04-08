import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Globe,
  Clock,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";

interface QuoteGeneratorProps {
  onComplete?: (quoteData: QuoteData) => void;
}

interface QuoteData {
  documentType: string;
  serviceType: string;
  name: string;
  email: string;
  phone: string;
  estimatedPrice: number;
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({
  onComplete = () => {},
}) => {
  const [step, setStep] = useState<number>(1);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    documentType: "",
    serviceType: "",
    name: "",
    email: "",
    phone: "",
    estimatedPrice: 0,
  });

  const updateQuoteData = (field: keyof QuoteData, value: string | number) => {
    setQuoteData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculatePrice = () => {
    let basePrice = 0;

    // Simple price calculation logic
    if (quoteData.serviceType === "translation") {
      basePrice = 50;
      if (quoteData.documentType === "diploma") basePrice += 25;
      if (quoteData.documentType === "transcript") basePrice += 35;
      if (quoteData.documentType === "certificate") basePrice += 20;
    } else if (quoteData.serviceType === "evaluation") {
      basePrice = 100;
      if (quoteData.documentType === "diploma") basePrice += 50;
      if (quoteData.documentType === "transcript") basePrice += 75;
      if (quoteData.documentType === "certificate") basePrice += 40;
    }

    updateQuoteData("estimatedPrice", basePrice);
    return basePrice;
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      if (step === 3) {
        calculatePrice();
      }
    } else {
      onComplete(quoteData);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Select Document Type
              </CardTitle>
              <CardDescription className="text-center">
                What type of document do you need processed?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={quoteData.documentType}
                onValueChange={(value) =>
                  updateQuoteData("documentType", value)
                }
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <Label
                  htmlFor="diploma"
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${quoteData.documentType === "diploma" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <FileText className="h-10 w-10 mb-2 text-primary" />
                  <div className="text-center">
                    <RadioGroupItem
                      value="diploma"
                      id="diploma"
                      className="sr-only"
                    />
                    <span className="font-medium">Diploma</span>
                    <p className="text-sm text-muted-foreground">
                      Academic degrees and certificates
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="transcript"
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${quoteData.documentType === "transcript" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <FileText className="h-10 w-10 mb-2 text-primary" />
                  <div className="text-center">
                    <RadioGroupItem
                      value="transcript"
                      id="transcript"
                      className="sr-only"
                    />
                    <span className="font-medium">Transcript</span>
                    <p className="text-sm text-muted-foreground">
                      Academic records and course history
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="certificate"
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${quoteData.documentType === "certificate" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <FileText className="h-10 w-10 mb-2 text-primary" />
                  <div className="text-center">
                    <RadioGroupItem
                      value="certificate"
                      id="certificate"
                      className="sr-only"
                    />
                    <span className="font-medium">Certificate</span>
                    <p className="text-sm text-muted-foreground">
                      Professional certifications and licenses
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Select Service Type
              </CardTitle>
              <CardDescription className="text-center">
                What service do you need for your document?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={quoteData.serviceType}
                onValueChange={(value) => updateQuoteData("serviceType", value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Label
                  htmlFor="translation"
                  className={`flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all ${quoteData.serviceType === "translation" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <Globe className="h-12 w-12 mb-3 text-primary" />
                  <div className="text-center">
                    <RadioGroupItem
                      value="translation"
                      id="translation"
                      className="sr-only"
                    />
                    <span className="text-lg font-medium">Translation</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Certified translation services for all document types
                    </p>
                    <ul className="text-sm text-left mt-4 space-y-1">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary" /> USCIS
                        Accepted
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary" />{" "}
                        Certified & Notarized
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary" /> Fast
                        Turnaround
                      </li>
                    </ul>
                  </div>
                </Label>

                <Label
                  htmlFor="evaluation"
                  className={`flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all ${quoteData.serviceType === "evaluation" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <FileText className="h-12 w-12 mb-3 text-primary" />
                  <div className="text-center">
                    <RadioGroupItem
                      value="evaluation"
                      id="evaluation"
                      className="sr-only"
                    />
                    <span className="text-lg font-medium">Evaluation</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Professional credential evaluation services
                    </p>
                    <ul className="text-sm text-left mt-4 space-y-1">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary" />{" "}
                        Course-by-Course Analysis
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary" /> US
                        Equivalency Report
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-primary" /> Accepted
                        by Universities & Employers
                      </li>
                    </ul>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Your Information
              </CardTitle>
              <CardDescription className="text-center">
                Please provide your contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={quoteData.name}
                    onChange={(e) => updateQuoteData("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={quoteData.email}
                    onChange={(e) => updateQuoteData("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="(123) 456-7890"
                    value={quoteData.phone}
                    onChange={(e) => updateQuoteData("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnaround">Turnaround Time</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue placeholder="Select turnaround time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        Standard (5-7 business days)
                      </SelectItem>
                      <SelectItem value="expedited">
                        Expedited (2-3 business days)
                      </SelectItem>
                      <SelectItem value="rush">Rush (24 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Your Quote
              </CardTitle>
              <CardDescription className="text-center">
                Review your quote details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Quote Summary</h3>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Document Type:
                      </span>
                      <span className="font-medium capitalize">
                        {quoteData.documentType}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Service Type:
                      </span>
                      <span className="font-medium capitalize">
                        {quoteData.serviceType}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Turnaround Time:
                      </span>
                      <span className="font-medium">
                        Standard (5-7 business days)
                      </span>
                    </div>

                    <div className="border-t my-3"></div>

                    <div className="flex justify-between text-lg font-bold">
                      <span>Estimated Price:</span>
                      <span className="text-primary">
                        ${quoteData.estimatedPrice}.00
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">
                    Next Steps
                  </h3>
                  <p className="text-sm">
                    Click "Get My Quote" to receive a detailed quote via email.
                    Our team will review your requirements and contact you
                    shortly.
                  </p>
                </div>
              </div>
            </CardContent>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-background">
      <div className="px-6 pt-6">
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}% Complete</span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2" />
        </div>
      </div>

      {renderStep()}

      <CardFooter className="flex justify-between p-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Button onClick={nextStep} className="flex items-center">
          {step === 4 ? (
            "Get My Quote"
          ) : (
            <>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuoteGenerator;
