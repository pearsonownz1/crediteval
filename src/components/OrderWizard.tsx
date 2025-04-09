import React, { useState, useRef } from "react"; // Import useRef
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
  User as UserIcon, // Add UserIcon
} from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // Add supabase import

interface OrderWizardProps {
  onComplete?: (orderData: any) => void;
  initialStep?: number;
}

const OrderWizard = ({
  onComplete = () => {},
  initialStep = 0,
}: OrderWizardProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [orderId, setOrderId] = useState<string | null>(null); // Add state for order ID
  const [isSubmitting, setIsSubmitting] = useState(false); // Add state for submission status
  const [error, setError] = useState<string | null>(null); // Add state for errors

  const [orderData, setOrderData] = useState({
    customerInfo: { // Renamed from account
      email: "",
      // password: "", // Removed password
      firstName: "",
      lastName: "",
    },
    documents: [] as { // Define a more detailed document state
      name: string;
      size: number;
      type: string;
      file: File;
      status: 'pending' | 'uploading' | 'success' | 'error';
      error?: string;
      path?: string; // Store the path after successful upload
      progress?: number; // Optional: for upload progress
    }[],
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

  const handleNext = async () => { // Make async
    setError(null); // Clear previous errors

    // --- Save Customer Info on Step 0 ---
    if (currentStep === 0) {
      const { firstName, lastName, email } = orderData.customerInfo;
      if (!firstName || !lastName || !email) {
        setError("Please fill in all required fields.");
        return;
      }

      setIsSubmitting(true);
      try {
        const { data, error: insertError } = await supabase
          .from("orders")
          .insert([
            {
              first_name: firstName,
              last_name: lastName,
              email: email,
              // Add other initial order data if needed, e.g., status: 'pending'
            },
          ])
          .select('id') // Select the ID of the newly created order
          .single(); // Expect a single row back

        if (insertError) {
          throw insertError;
        }

        if (data && data.id) {
           setOrderId(data.id); // Store the new order ID
           console.log("Order created with ID:", data.id);
           setCurrentStep(currentStep + 1); // Proceed to next step
        } else {
             throw new Error("Failed to create order or retrieve ID.");
        }

      } catch (err: any) {
        console.error("Error saving customer info:", err);
        setError(err.message || "Failed to save information. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    // --- End Save Customer Info ---
    } else if (currentStep < totalSteps - 1) {
      // Logic for other steps (just move forward)
      setCurrentStep(currentStep + 1);
    } else {
      // Final step completion (potentially update the order with remaining data)
      // For now, just call onComplete
      // TODO: Add logic here to update the existing order record using orderId
      console.log("Completing order with ID:", orderId);
      onComplete({ ...orderData, orderId });
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
    { title: "Your Info", icon: <UserIcon className="h-5 w-5" /> }, // Changed first step
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
                <CustomerInfoStep // Changed component
                  data={orderData.customerInfo} // Changed data source
                  updateData={(data) => updateOrderData("customerInfo", data)} // Changed section name
                  error={error} // Pass error state
                />
              )}

              {currentStep === 1 && (
                <DocumentUploadStep
                  documents={orderData.documents}
                  updateDocuments={(docs) =>
                    setOrderData({ ...orderData, documents: docs })
                   }
                   orderId={orderId} // Pass orderId down
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

          <Button onClick={handleNext} disabled={isSubmitting && currentStep === 0}>
            {isSubmitting && currentStep === 0 ? "Saving..." : currentStep === totalSteps - 1 ? "Complete Order" : "Next"}
            {!(isSubmitting && currentStep === 0) && currentStep !== totalSteps - 1 && (
              <ArrowRight className="ml-2 h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// --- New CustomerInfoStep Component ---
interface CustomerInfoStepProps {
  data: {
    firstName: string;
    lastName: string;
    email: string;
  };
  updateData: (data: any) => void;
  error: string | null; // Add error prop
}

const CustomerInfoStep = ({ data, updateData, error }: CustomerInfoStepProps) => {
  return (
    <div className="space-y-4">
       <h3 className="text-lg font-medium">Your Information</h3>
       <p className="text-sm text-muted-foreground">Please provide your contact details.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          required
        />
      </div>
       {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};
// --- End CustomerInfoStep Component ---


// --- Update DocumentUploadStep ---
interface DocumentUploadStepProps {
  documents: { // Use the detailed document type
    name: string;
    size: number;
    type: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    path?: string;
    progress?: number;
  }[];
  updateDocuments: (documents: DocumentUploadStepProps['documents']) => void;
  orderId: string | null; // Add orderId prop
}

const DocumentUploadStep = ({
  documents = [],
  updateDocuments,
  orderId, // Receive orderId
}: DocumentUploadStepProps) => {
  // Ensure fileInputRef is declared ONLY ONCE
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to update a specific document's state
  const updateDocumentStatus = (index: number, newStatus: Partial<DocumentUploadStepProps['documents'][0]>) => {
    const updatedDocs = [...documents];
    // Ensure the index is valid before attempting to update
    if (updatedDocs[index]) {
        updatedDocs[index] = { ...updatedDocs[index], ...newStatus };
        updateDocuments(updatedDocs);
    } else {
        console.error("Attempted to update status for invalid index:", index);
    }
  };

  // Function to upload a single file
  const uploadFile = async (file: File, index: number) => {
    if (!orderId) {
      console.error("Order ID is missing, cannot upload file.");
      updateDocumentStatus(index, { status: 'error', error: 'Order ID missing.' });
      return;
    }

    try {
      updateDocumentStatus(index, { status: 'uploading', progress: 0 });
      const filePath = `public/${orderId}/${Date.now()}_${file.name}`; // Unique path within order folder

      const { data, error } = await supabase.storage
        .from('documents') // Use the bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // contentType: file.type // Optional: Supabase usually infers this
        });

      if (error) {
        throw error;
      }

      console.log('Upload successful:', data);
      const newPath = data.path;
      updateDocumentStatus(index, { status: 'success', path: newPath, progress: 100 });

      // --- Update document_paths in the orders table ---
      try {
        // 1. Fetch current paths
        const { data: orderData, error: fetchError } = await supabase
          .from('orders')
          .select('document_paths')
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;

        // 2. Append new path (handle null or existing array)
        const currentPaths = orderData?.document_paths || [];
        const updatedPaths = [...currentPaths, newPath];

        // 3. Update the order record
        const { error: updateError } = await supabase
          .from('orders')
          .update({ document_paths: updatedPaths })
          .eq('id', orderId);

        if (updateError) throw updateError;

        console.log('Order document_paths updated successfully.');

      } catch (dbError: any) {
          console.error('Error updating order document_paths:', dbError);
          // Optionally revert status or show specific DB error to user
          // For now, the file is uploaded, but the DB link failed.
          updateDocumentStatus(index, { status: 'error', error: `Upload succeeded, but DB update failed: ${dbError.message}` });
      }
      // --- End update document_paths ---

    } catch (error: any) {
      console.error('Error uploading file:', file.name, error);
      updateDocumentStatus(index, { status: 'error', error: error.message || 'Upload failed', progress: undefined });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const mappedFiles = Array.from(e.dataTransfer.files).map((file) => ({ // Rename newFiles to mappedFiles
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending' as const, // Add initial status
      }));
      const currentDocCount = documents.length;
      updateDocuments([...documents, ...mappedFiles]);
      // Trigger upload for each new file
      mappedFiles.forEach((_, i) => {
        uploadFile(mappedFiles[i].file, currentDocCount + i);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered"); // Add log here
    if (e.target.files) {
      const mappedFiles = Array.from(e.target.files).map((file) => ({ // Rename newFiles to mappedFiles
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending' as const, // Add initial status
      }));
      const currentDocCount = documents.length;
      updateDocuments([...documents, ...mappedFiles]);
      // Trigger upload for each new file
      mappedFiles.forEach((_, i) => {
        uploadFile(mappedFiles[i].file, currentDocCount + i);
      });
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
      // Remove the onClick from the main div
    >
      {/* Revert to using label and Button */}
      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium">
        Drag and drop your documents here
      </h3>
      <p className="text-sm text-muted-foreground mt-1">or</p>
      <div className="mt-4">
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              console.log("Browse Files Button Clicked! Triggering input click...");
              fileInputRef.current?.click(); // Programmatically click the hidden input
            }}
          >
            Browse Files
          </Button>
        </label>
        <input
          id="file-upload" // ID is needed for the label's htmlFor
          type="file"
          multiple
          className="hidden" // Hide the input again
          onChange={handleFileChange}
          ref={fileInputRef} // Add the ref back
        />
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Supported formats: PDF, JPG, PNG, DOCX (Max 10MB per file)
      </p>
    </div> {/* This closes the main dropzone div correctly */}

    {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Uploaded Documents</h3>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div className="flex items-center flex-grow mr-4 overflow-hidden"> {/* Added flex-grow and overflow */}
                  <FileText className="h-5 w-5 mr-2 text-primary flex-shrink-0" /> {/* Added flex-shrink-0 */}
                  <div className="flex-grow overflow-hidden"> {/* Added flex-grow and overflow */}
                    <p className="text-sm font-medium truncate">{doc.name}</p> {/* Added truncate */}
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                      {/* Display Upload Status */}
                      {doc.status === 'uploading' && (
                        <span className="ml-2 text-blue-500">Uploading... {doc.progress !== undefined ? `${doc.progress}%` : ''}</span>
                      )}
                      {doc.status === 'success' && (
                        <span className="ml-2 text-green-500">Uploaded</span>
                      )}
                      {doc.status === 'error' && (
                        <span className="ml-2 text-red-500" title={doc.error}>Error</span>
                      )}
                    </p>
                     {/* Optional: Show progress bar */}
                     {doc.status === 'uploading' && doc.progress !== undefined && (
                        <Progress value={doc.progress} className="h-1 mt-1" />
                     )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(index)}
                  disabled={doc.status === 'uploading'} // Disable remove during upload
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
            <h4 className="font-medium">Customer Information</h4> {/* Changed title */}
            <p className="text-sm">
              {orderData.customerInfo.firstName} {orderData.customerInfo.lastName} {/* Changed source */}
            </p>
            <p className="text-sm">{orderData.customerInfo.email}</p> {/* Changed source */}
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
