import React, { useState, useRef, useEffect } from "react"; // Add useEffect
import { useNavigate } from "react-router-dom"; // Add useNavigate
import { motion, AnimatePresence } from "framer-motion";
import {
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js"; // Import Stripe hooks and CardElement
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
  User as UserIcon,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// Define the document type explicitly for clarity
type DocumentState = {
  id: string; // Unique identifier for state management
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  path?: string;
  progress?: number;
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate(); // Add navigate hook

  const [orderData, setOrderData] = useState({
    customerInfo: { // Renamed from account
      email: "",
      // password: "", // Removed password
      firstName: "",
      lastName: "",
    },
    documents: [] as DocumentState[], // Use the defined type
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
      // Removed cardNumber, expiryDate, cvv, nameOnCard
    },
  });

  const totalSteps = 5; // Your Info, Documents, Services, Review, Payment
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // --- Calculate Price Function (moved here for use in handleNext) ---
  const calculatePrice = (currentOrderData: typeof orderData) => {
    let basePrice = 0;
    switch (currentOrderData.services.type) {
      case "translation": basePrice = 75; break;
      case "evaluation": basePrice = 150; break;
      case "both": basePrice = 200; break;
    }
    switch (currentOrderData.services.urgency) {
      case "standard": return basePrice;
      case "expedited": return basePrice * 1.5;
      case "rush": return basePrice * 2;
      default: return basePrice;
    }
  };
  // --- End Calculate Price Function ---

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
    } else if (currentStep === totalSteps - 1 && stripe && elements) {
      // --- Final Step: Payment Processing ---
      setPaymentProcessing(true);
      setError(null);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card details not found. Please try again.");
        setPaymentProcessing(false);
        return;
      }

      try {
        // --- 1. Create PaymentIntent on Backend ---
        // TODO: Replace with actual call to your backend endpoint
        // This endpoint should take the order amount (calculate it based on orderData)
        // and return the client_secret of the created PaymentIntent.
        const functionUrl = "https://lholxkbtosixszauuzmb.supabase.co/functions/v1/create-payment-intent";
        const calculatedAmount = Math.round(calculatePrice(orderData) * 100); // Calculate amount in cents

        console.log(`Calling Supabase function at ${functionUrl} for order ${orderId} with amount ${calculatedAmount}`);

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add Supabase Anon Key - required for invoking functions unless you change settings
            // Get this from your Supabase project settings (API > Project API keys > anon public)
            // Ideally, load this from environment variables (.env file)
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, // Assumes you have this in your .env
            // If user is logged in, you might want to pass the Authorization header
            // 'Authorization': `Bearer ${supabase.auth.session()?.access_token}`, // Uncomment if needed
          },
          body: JSON.stringify({
            amount: calculatedAmount,
            orderId: orderId
          }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error("Backend error response:", errorBody);
            throw new Error(errorBody.error || `Function invocation failed with status ${response.status}`);
        }

        const { clientSecret, error: backendError } = await response.json();

        if (backendError || !clientSecret) {
          console.error("Backend returned error or no clientSecret:", backendError);
          throw new Error(backendError || 'Failed to get payment secret from backend.');
        }

        console.log("Received clientSecret from backend.");


        // --- 2. Confirm Card Payment ---
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                email: orderData.customerInfo.email,
                // Add address details if collected
              },
            },
          }
        );

        if (stripeError) {
          // Show error to your customer (e.g., insufficient funds, card declined)
          console.error("Stripe confirmation error:", stripeError);
          setError(stripeError.message || "Payment failed. Please try again.");
          setPaymentProcessing(false);
          return;
        }

        // --- 3. Payment Successful ---
        if (paymentIntent?.status === "succeeded") {
          console.log("Payment Succeeded:", paymentIntent);

          // NOTE: Order status update (to 'paid') should ideally be handled
          // by a backend webhook listening to Stripe's 'payment_intent.succeeded' event.
          // The 'create-payment-intent' function now sets it to 'pending_payment'.
          // For now, we assume success and redirect.

          setPaymentProcessing(false); // Stop processing indicator

          // Call the completion callback
          onComplete({ ...orderData, orderId, paymentIntentId: paymentIntent.id });
          // Redirect to success page immediately after frontend confirmation
          navigate(`/order-success?orderId=${orderId}`);

        } else {
          // Handle other PaymentIntent statuses (e.g., requires_action)
          console.warn("PaymentIntent status:", paymentIntent?.status);
          setError("Payment processing. Please wait or contact support.");
          setPaymentProcessing(false); // Keep user on payment page for now
        }

      } catch (err: any) {
        console.error("Payment processing error:", err);
        setError(err.message || "An unexpected error occurred during payment.");
        setPaymentProcessing(false);
      }
    } else {
       // Handle cases where stripe or elements aren't loaded yet, or not on the final step
       if (currentStep === totalSteps - 1) {
           setError("Stripe is not ready. Please wait a moment and try again.");
       } else {
           // Should not happen if logic is correct, but good to have a fallback
           console.error("Unexpected state in handleNext:", { currentStep, stripe, elements });
           setError("An unexpected error occurred.");
       }
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
                  // Use functional update form for setOrderData
                  updateDocuments={(updater) =>
                    setOrderData(prevData => ({
                      ...prevData,
                      documents: typeof updater === 'function' ? updater(prevData.documents) : updater
                    }))
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
                <PaymentStep error={error} /> // Pass error state down
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
            {/* Update button text and disable state for payment step */}
            {paymentProcessing ? "Processing Payment..." : currentStep === totalSteps - 1 ? "Complete Order" : "Next"}
            {!(isSubmitting && currentStep === 0) && !paymentProcessing && currentStep !== totalSteps - 1 && (
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
  documents: DocumentState[]; // Use the defined type
  // Allow passing either the new array or an updater function
  updateDocuments: (updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])) => void;
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
  // Function to update a specific document's state using its unique ID (using functional update)
  const updateDocumentStatusById = (id: string, newStatus: Partial<DocumentState>) => {
    updateDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(doc => doc.id === id);
      if (docIndex !== -1) {
        const updatedDocs = [...prevDocs]; // Create a new array from the previous state
        updatedDocs[docIndex] = { ...updatedDocs[docIndex], ...newStatus };
        return updatedDocs; // Return the new array
      } else {
        console.error("[updateDocumentStatusById] Attempted to update status for a document ID not found in state:", id);
        return prevDocs; // Return the previous state if ID not found
      }
    });
  };

  // Function to upload a single file (now uses file reference and unique ID)
  const uploadFile = async (file: File, id: string) => { // Added id parameter
    if (!orderId) {
      console.error("Order ID is missing, cannot upload file.");
      updateDocumentStatusById(id, { status: 'error', error: 'Order ID missing.' }); // Use ID
      return;
    }

    try {
      updateDocumentStatusById(id, { status: 'uploading', progress: 0 }); // Use ID

      // Sanitize filename: replace spaces and special chars with underscores
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${orderId}/${Date.now()}_${sanitizedName}`; // Use sanitized name

      console.log(`Uploading sanitized file: ${filePath}`);

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
      const newPath = data.path; // data.path is the key/path within the bucket
      // File uploaded successfully to storage, update UI immediately
      updateDocumentStatusById(id, { status: 'success', path: newPath, progress: 100 }); // Use ID

      // --- Call backend function to update document_paths in the orders table ---
      try {
        // Add an explicit check for orderId right before the fetch call
        if (!orderId) {
            console.error("Order ID is missing immediately before calling backend function.");
            throw new Error("Cannot link document: Order ID is missing.");
        }

        // Add detailed logging for type and value
        console.log(`[Debug] Calling backend function. Order ID Type: ${typeof orderId}, Value: ${orderId}`);

        console.log(`Calling backend function to add document path for order ${orderId}`);
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-order-documents`; // Get Supabase URL from env

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, // Use anon key
                // Add Authorization header if users must be logged in to upload
                // 'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
            },
            body: JSON.stringify({
                orderId: String(orderId), // Convert orderId to string before sending
                documentPath: newPath // Send the path returned by storage upload
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response from function' }));
            console.error(`Backend function error updating document_paths for order ${orderId}:`, errorBody);
            throw new Error(errorBody.error || `Function call failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log(`Backend function successfully updated document_paths for order ${orderId}:`, result);

      } catch (functionError: any) {
          console.error('Error calling update-order-documents function:', functionError);
          // Update the specific document's status to show the function call error
          // Keep status 'success' for upload, but add a warning/error about the DB link
          updateDocumentStatusById(id, { // Use ID
              status: 'error', // Or keep 'success' but show a warning icon/message
              error: `Upload OK, but failed to link to order: ${functionError.message}`
          });
          // Decide if you want to stop or allow proceeding. For now, we let it proceed but show error.
      }
      // --- End call backend function ---

    } catch (uploadError: any) {
      console.error('Error uploading file to storage:', file.name, uploadError);
      updateDocumentStatusById(id, { status: 'error', error: uploadError.message || 'Upload failed', progress: undefined }); // Use ID
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesToAdd: DocumentState[] = Array.from(e.dataTransfer.files).map((file) => ({
        id: crypto.randomUUID(), // Generate unique ID
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending' as const,
      }));
      // Add new files to state using functional update
      const filesToUpload = filesToAdd.map(f => ({ file: f.file, id: f.id })); // Keep track of file and ID
      updateDocuments(prevDocs => [...prevDocs, ...filesToAdd]);

      // Trigger upload for each new file *after* state update likely processed
      // Use a minimal timeout to allow React to batch the state update
      setTimeout(() => {
          filesToUpload.forEach(({ file, id }) => { // Pass file and ID
              uploadFile(file, id);
          });
      }, 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered");
    if (e.target.files) {
       const filesToAdd: DocumentState[] = Array.from(e.target.files).map((file) => ({
        id: crypto.randomUUID(), // Generate unique ID
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending' as const,
      }));
      // Add new files to state using functional update
      const filesToUpload = filesToAdd.map(f => ({ file: f.file, id: f.id })); // Keep track of file and ID
      updateDocuments(prevDocs => [...prevDocs, ...filesToAdd]);

      // Trigger upload for each new file *after* state update likely processed
      // Use a minimal timeout to allow React to batch the state update
      setTimeout(() => {
          filesToUpload.forEach(({ file, id }) => { // Pass file and ID
              uploadFile(file, id);
          });
      }, 0);
    }
  };

  // Use functional update for removing documents
  const removeDocument = (id: string) => { // Accept ID instead of index
    updateDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(doc => doc.id === id);
      if (docIndex !== -1) {
        const newDocs = [...prevDocs];
        newDocs.splice(docIndex, 1);
        return newDocs; // Return the new array
      } else {
        console.error("[removeDocument] Attempted to remove document with ID not found:", id);
        return prevDocs; // Return previous state if not found
      }
    });
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
            {documents.map((doc) => ( // Removed index from map parameters
              <div
                key={doc.id} // Use unique ID as key
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
                  onClick={() => removeDocument(doc.id)} // Pass ID to removeDocument
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

  // Calculate estimated price based on service type and urgency - MOVED TO OrderWizard scope
  // const calculatePrice = () => { ... }; // Function logic is now outside this component

  // Need access to the calculatePrice function from the parent scope
  // This component should receive the calculated price as a prop, or the function itself.
  // For simplicity, let's assume the parent passes the calculated price.
  // We'll need to adjust the parent component (`OrderWizard`) to pass this.
  // OR, we can just call the function directly if it's in scope (which it isn't here).
  // Let's revert ReviewStep to calculate its own price for now, as it was originally.

  const calculateReviewPrice = () => {
      let basePrice = 0;
      switch (orderData.services.type) {
        case "translation": basePrice = 75; break;
        case "evaluation": basePrice = 150; break;
        case "both": basePrice = 200; break;
      }
      switch (orderData.services.urgency) {
        case "standard": return basePrice;
        case "expedited": return basePrice * 1.5;
        case "rush": return basePrice * 2;
        default: return basePrice;
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
            <span className="font-bold">${calculateReviewPrice().toFixed(2)}</span> {/* Use the local function */}
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
  error: string | null; // Add error prop to display payment errors
}

// --- Updated PaymentStep Component ---
const PaymentStep = ({ error }: PaymentStepProps) => { // Added error prop
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
    // Hiding postal code for simplicity, but recommended for production
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

      {/* Payment Method Selection (Optional - Keep if needed) */}
      {/* For this example, we'll assume Credit Card is the only method for Stripe */}
      {/*
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         ... payment method selection ...
      </div>
      */}

      {/* --- Stripe Card Element --- */}
      <div className="space-y-4 mt-4">
        <Label htmlFor="card-element">Credit or debit card</Label>
        <div className="p-3 border rounded-md bg-white"> {/* Style wrapper */}
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>
      {/* --- End Stripe Card Element --- */}

      {/* Display Payment Error */}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      {/* Placeholder for other payment methods if needed */}
      {/* e.g., PayPal button or Bank Transfer info */}

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
    </div> // Closing div for the main PaymentStep component
  );
};

export default OrderWizard;
