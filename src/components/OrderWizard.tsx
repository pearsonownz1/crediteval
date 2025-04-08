import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import {
  Upload,
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  FileText,
  Globe,
  DollarSign,
} from "lucide-react";

interface OrderWizardProps {
  onComplete?: (orderData: any) => void;
  initialStep?: number;
}

const OrderWizard = ({
  onComplete = () => {},
  initialStep = 0,
}: OrderWizardProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [orderData, setOrderData] = useState({
    account: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
    documents: [] as any[],
    services: {
      type: "translation",
      language: "spanish",
      urgency: "standard",
      specialInstructions: "",
    },
    payment: {
      method: "credit-card",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      nameOnCard: "",
    },
  });

  const totalSteps = 5;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(orderData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateOrderData = (section: string, data: any) => {
    setOrderData({
      ...orderData,
      [section]: { ...orderData[section as keyof typeof orderData], ...data },
    });
  };

  const steps = [
    { title: "Account", icon: <FileText className="h-5 w-5" /> },
    { title: "Documents", icon: <Upload className="h-5 w-5" /> },
    { title: "Services", icon: <Globe className="h-5 w-5" /> },
    { title: "Review", icon: <Check className="h-5 w-5" /> },
    { title: "Payment", icon: <DollarSign className="h-5 w-5" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Order Your Service
          </CardTitle>
          <CardDescription className="text-center">
            Complete the steps below to submit your order
          </CardDescription>

          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />

            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`rounded-full p-2 ${index <= currentStep ? "bg-primary text-white" : "bg-muted"}`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs mt-1">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <AccountStep
                  data={orderData.account}
                  updateData={(data) => updateOrderData("account", data)}
                />
              )}

              {currentStep === 1 && (
                <DocumentUploadStep
                  documents={orderData.documents}
                  updateDocuments={(docs) =>
                    setOrderData({ ...orderData, documents: docs })
                  }
                />
              )}

              {currentStep === 2 && (
                <ServiceSelectionStep
                  data={orderData.services}
                  updateData={(data) => updateOrderData("services", data)}
                />
              )}

              {currentStep === 3 && <ReviewStep orderData={orderData} />}

              {currentStep === 4 && (
                <PaymentStep
                  data={orderData.payment}
                  updateData={(data) => updateOrderData("payment", data)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button onClick={handleNext}>
            {currentStep === totalSteps - 1 ? "Complete Order" : "Next"}
            {currentStep !== totalSteps - 1 && (
              <ArrowRight className="ml-2 h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

interface AccountStepProps {
  data: any;
  updateData: (data: any) => void;
}

const AccountStep = ({ data, updateData }: AccountStepProps) => {
  const [mode, setMode] = useState<"login" | "create">("create");

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue={mode}
        onValueChange={(value) => setMode(value as "login" | "create")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="create">Create Account</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => updateData({ password: e.target.value })}
            />
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={data.lastName}
                onChange={(e) => updateData({ lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">Email</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="your@email.com"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => updateData({ password: e.target.value })}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface DocumentUploadStepProps {
  documents: any[];
  updateDocuments: (documents: any[]) => void;
}

const DocumentUploadStep = ({
  documents = [],
  updateDocuments,
}: DocumentUploadStepProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));
      updateDocuments([...documents, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));
      updateDocuments([...documents, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    updateDocuments(newDocs);
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">
          Drag and drop your documents here
        </h3>
        <p className="text-sm text-muted-foreground mt-1">or</p>
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <Button variant="outline" type="button">
              Browse Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Supported formats: PDF, JPG, PNG, DOCX (Max 10MB per file)
        </p>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Uploaded Documents</h3>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ServiceSelectionStepProps {
  data: any;
  updateData: (data: any) => void;
}

const ServiceSelectionStep = ({
  data,
  updateData,
}: ServiceSelectionStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="service-type">Service Type</Label>
        <Select
          value={data.type}
          onValueChange={(value) => updateData({ type: value })}
        >
          <SelectTrigger id="service-type">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="translation">Document Translation</SelectItem>
            <SelectItem value="evaluation">Credential Evaluation</SelectItem>
            <SelectItem value="both">Translation & Evaluation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data.type === "translation" || data.type === "both") && (
        <div className="space-y-2">
          <Label htmlFor="language">Target Language</Label>
          <Select
            value={data.language}
            onValueChange={(value) => updateData({ language: value })}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {(data.type === "evaluation" || data.type === "both") && (
        <div className="space-y-2">
          <Label>Evaluation Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-start space-x-2">
                <Checkbox id="course-by-course" />
                <div>
                  <Label
                    htmlFor="course-by-course"
                    className="font-medium cursor-pointer"
                  >
                    Course-by-Course
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Detailed evaluation of all courses, grades, and degrees
                  </p>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-start space-x-2">
                <Checkbox id="document-by-document" />
                <div>
                  <Label
                    htmlFor="document-by-document"
                    className="font-medium cursor-pointer"
                  >
                    Document-by-Document
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Basic evaluation of degrees and diplomas only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="urgency">Processing Time</Label>
        <Select
          value={data.urgency}
          onValueChange={(value) => updateData({ urgency: value })}
        >
          <SelectTrigger id="urgency">
            <SelectValue placeholder="Select processing time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">
              Standard (7-10 business days)
            </SelectItem>
            <SelectItem value="expedited">
              Expedited (3-5 business days)
            </SelectItem>
            <SelectItem value="rush">Rush (1-2 business days)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="special-instructions">
          Special Instructions (Optional)
        </Label>
        <Textarea
          id="special-instructions"
          placeholder="Any specific requirements or notes for your order"
          value={data.specialInstructions || ""}
          onChange={(e) => updateData({ specialInstructions: e.target.value })}
        />
      </div>
    </div>
  );
};

interface ReviewStepProps {
  orderData: any;
}

const ReviewStep = ({ orderData }: ReviewStepProps) => {
  const getServiceTypeText = () => {
    switch (orderData.services.type) {
      case "translation":
        return "Document Translation";
      case "evaluation":
        return "Credential Evaluation";
      case "both":
        return "Translation & Evaluation";
      default:
        return "Not specified";
    }
  };

  const getUrgencyText = () => {
    switch (orderData.services.urgency) {
      case "standard":
        return "Standard (7-10 business days)";
      case "expedited":
        return "Expedited (3-5 business days)";
      case "rush":
        return "Rush (1-2 business days)";
      default:
        return "Not specified";
    }
  };

  // Calculate estimated price based on service type and urgency
  const calculatePrice = () => {
    let basePrice = 0;

    switch (orderData.services.type) {
      case "translation":
        basePrice = 75;
        break;
      case "evaluation":
        basePrice = 150;
        break;
      case "both":
        basePrice = 200;
        break;
    }

    switch (orderData.services.urgency) {
      case "standard":
        return basePrice;
      case "expedited":
        return basePrice * 1.5;
      case "rush":
        return basePrice * 2;
      default:
        return basePrice;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Order Summary</h3>
        <p className="text-sm text-muted-foreground">
          Please review your order details before proceeding to payment
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <h4 className="font-medium">Account Information</h4>
            <p className="text-sm">
              {orderData.account.firstName} {orderData.account.lastName}
            </p>
            <p className="text-sm">{orderData.account.email}</p>
          </div>

          <div>
            <h4 className="font-medium">Documents</h4>
            {orderData.documents.length > 0 ? (
              <ul className="text-sm space-y-1">
                {orderData.documents.map((doc: any, index: number) => (
                  <li key={index}>{doc.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents uploaded
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium">Service Details</h4>
            <p className="text-sm">Service Type: {getServiceTypeText()}</p>
            {(orderData.services.type === "translation" ||
              orderData.services.type === "both") && (
              <p className="text-sm">
                Target Language: {orderData.services.language}
              </p>
            )}
            <p className="text-sm">Processing Time: {getUrgencyText()}</p>
            {orderData.services.specialInstructions && (
              <div>
                <p className="text-sm font-medium mt-2">
                  Special Instructions:
                </p>
                <p className="text-sm">
                  {orderData.services.specialInstructions}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="font-medium">Estimated Total:</span>
            <span className="font-bold">${calculatePrice().toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Final price may vary based on document complexity and additional
            requirements
          </p>
        </div>
      </div>
    </div>
  );
};

interface PaymentStepProps {
  data: any;
  updateData: (data: any) => void;
}

const PaymentStep = ({ data, updateData }: PaymentStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferred payment method
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${data.method === "credit-card" ? "border-primary bg-primary/5" : ""}`}
          onClick={() => updateData({ method: "credit-card" })}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <CreditCard className="h-8 w-8 mb-2" />
            <span className="font-medium">Credit Card</span>
          </div>
        </div>
        <div
          className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${data.method === "paypal" ? "border-primary bg-primary/5" : ""}`}
          onClick={() => updateData({ method: "paypal" })}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              className="h-8 w-8 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.5 8.25H4.5C3.67157 8.25 3 8.92157 3 9.75V18.75C3 19.5784 3.67157 20.25 4.5 20.25H19.5C20.3284 20.25 21 19.5784 21 18.75V9.75C21 8.92157 20.3284 8.25 19.5 8.25Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 15.75C7.5 15.75 8.25 15 9.75 15C11.25 15 12.75 16.5 14.25 16.5C15.75 16.5 16.5 15.75 16.5 15.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 8.25V6C16.5 4.34315 15.1569 3 13.5 3H6C4.34315 3 3 4.34315 3 6V8.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium">PayPal</span>
          </div>
        </div>
        <div
          className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${data.method === "bank-transfer" ? "border-primary bg-primary/5" : ""}`}
          onClick={() => updateData({ method: "bank-transfer" })}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              className="h-8 w-8 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 21H21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 18H21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 18V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 18V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 18V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 18V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 3L21 10H3L12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium">Bank Transfer</span>
          </div>
        </div>
      </div>

      {data.method === "credit-card" && (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              placeholder="1234 5678 9012 3456"
              value={data.cardNumber}
              onChange={(e) => updateData({ cardNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry-date">Expiry Date</Label>
              <Input
                id="expiry-date"
                placeholder="MM/YY"
                value={data.expiryDate}
                onChange={(e) => updateData({ expiryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={data.cvv}
                onChange={(e) => updateData({ cvv: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name-on-card">Name on Card</Label>
            <Input
              id="name-on-card"
              placeholder="John Doe"
              value={data.nameOnCard}
              onChange={(e) => updateData({ nameOnCard: e.target.value })}
            />
          </div>
        </div>
      )}

      {data.method === "paypal" && (
        <div className="bg-muted p-4 rounded-lg mt-4 text-center">
          <p className="text-sm">
            You will be redirected to PayPal to complete your payment after
            submitting your order.
          </p>
        </div>
      )}

      {data.method === "bank-transfer" && (
        <div className="bg-muted p-4 rounded-lg mt-4 space-y-2">
          <p className="text-sm">
            Please use the following details to make your bank transfer:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Bank Name:</span>
            <span>CreditEval Bank</span>
            <span className="font-medium">Account Name:</span>
            <span>CreditEval Services Inc.</span>
            <span className="font-medium">Account Number:</span>
            <span>1234567890</span>
            <span className="font-medium">Routing Number:</span>
            <span>987654321</span>
            <span className="font-medium">Reference:</span>
            <span>Your order number will be provided after submission</span>
          </div>
        </div>
      )}

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

export default OrderWizard;
