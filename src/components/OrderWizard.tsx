import React, { useState, useRef, useEffect } from "react"; // Add useEffect
import { useNavigate } from "react-router-dom"; // Add useNavigate
import { motion, AnimatePresence } from "framer-motion";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"; // Import Stripe hooks and CardElement
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"; // Import Tooltip components
import { Lock as LockIcon } from "lucide-react"; // Import Lock icon
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
  ShieldCheck, // Added for social proof
  Lock, // Added for social proof
  Award, // Added for social proof
  Truck as TruckIcon, // Added for Delivery Details
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { DocumentState, OrderData } from "../types/order"; // Import types
import OrderSummarySidebar from "./OrderSummarySidebar"; // Import the new sidebar
import { useOrderContext } from "../contexts/OrderContext"; // Import the context hook
import EvalynAssistant from "./EvalynAssistant"; // Import the Evalyn component

interface OrderWizardProps {
  onComplete?: (orderData: any) => void;
  initialStep?: number;
}

// ==================================
// Step Component Definitions (Defined BEFORE OrderWizard)
// ==================================

// --- CustomerInfoStep Component ---
interface CustomerInfoStepProps {
  data: OrderData["customerInfo"]; // Use specific type from OrderData
  updateData: (data: Partial<OrderData["customerInfo"]>) => void; // Use specific type
  error: string | null;
}

const CustomerInfoStep = ({
  data,
  updateData,
  error,
}: CustomerInfoStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Information</h3>
      <p className="text-sm text-muted-foreground">
        Please provide your contact details.
      </p>
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
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(123) 456-7890"
          value={data.phone}
          onChange={(e) => updateData({ phone: e.target.value })}
          // Making phone optional for now, add 'required' if needed
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

// --- ServiceSelectionStep Component ---
interface ServiceSelectionStepProps {
  data: OrderData["services"];
  updateData: (data: Partial<OrderData["services"]>) => void;
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
          onValueChange={(value) => updateData({ type: value })}>
          <SelectTrigger id="service-type">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="translation">Certified Translation</SelectItem>
            <SelectItem value="evaluation">Credential Evaluation</SelectItem>
            <SelectItem value="expert">Expert Opinion Letter ($599)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional Fields */}
      {data.type === "translation" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="language-from">Language From</Label>
            <Select
              value={data.languageFrom}
              onValueChange={(value) => updateData({ languageFrom: value })}>
              <SelectTrigger id="language-from">
                <SelectValue placeholder="Select original language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
                <SelectItem value="russian">Russian</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language-to">Language To</Label>
            <Select
              value={data.languageTo}
              onValueChange={(value) => updateData({ languageTo: value })}>
              <SelectTrigger id="language-to">
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-count">Number of Pages for Translation</Label>
            <Input
              id="page-count"
              type="number"
              min="1"
              value={data.pageCount || 1}
              onChange={(e) =>
                updateData({ pageCount: parseInt(e.target.value, 10) || 1 })
              }
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">($25 per page)</p>
          </div>
        </>
      )}

      {data.type === "evaluation" && (
        <div className="space-y-2">
          <Label>Evaluation Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
                data.evaluationType === "course"
                  ? "border-primary ring-1 ring-primary"
                  : ""
              }`}
              onClick={() => updateData({ evaluationType: "course" })}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="course-by-course"
                  checked={data.evaluationType === "course"}
                  onCheckedChange={() =>
                    updateData({ evaluationType: "course" })
                  }
                />
                <div>
                  <Tooltip>
                    <TooltipTrigger>
                      {" "}
                      {/* Removed asChild */}
                      <Label
                        htmlFor="course-by-course"
                        className="font-medium cursor-pointer underline decoration-dashed decoration-muted-foreground">
                        Course-by-Course ($150)
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Lists all courses with U.S. semester credits and grade
                        equivalents. Recommended for further education or
                        professional licensing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-sm text-muted-foreground">
                    Detailed evaluation of all courses, grades, and degrees
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
                data.evaluationType === "document"
                  ? "border-primary ring-1 ring-primary"
                  : ""
              }`}
              onClick={() => updateData({ evaluationType: "document" })}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="document-by-document"
                  checked={data.evaluationType === "document"}
                  onCheckedChange={() =>
                    updateData({ evaluationType: "document" })
                  }
                />
                <div>
                  <Tooltip>
                    <TooltipTrigger>
                      {" "}
                      {/* Removed asChild */}
                      <Label
                        htmlFor="document-by-document"
                        className="font-medium cursor-pointer underline decoration-dashed decoration-muted-foreground">
                        Document-by-Document ($85)
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Identifies your credentials and provides their U.S.
                        equivalents. Suitable for employment or immigration
                        purposes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-sm text-muted-foreground">
                    Basic evaluation of degrees and diplomas only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.type === "expert" && (
        <div className="space-y-2">
          <Label htmlFor="visa-type">Visa Type</Label>
          <Select
            value={data.visaType}
            onValueChange={(value) => updateData({ visaType: value })}>
            <SelectTrigger id="visa-type">
              <SelectValue placeholder="Select Visa Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="H-1B">H-1B (Specialty Occupation)</SelectItem>
              <SelectItem value="O-1">O-1 (Extraordinary Ability)</SelectItem>
              <SelectItem value="L-1">L-1 (Intracompany Transferee)</SelectItem>
              <SelectItem value="E-2">E-2 (Treaty Investor)</SelectItem>
              <SelectItem value="EB-1">EB-1 (Priority Worker)</SelectItem>
              <SelectItem value="EB-2 NIW">
                EB-2 NIW (National Interest Waiver)
              </SelectItem>
              <SelectItem value="TN">TN (NAFTA Professionals)</SelectItem>
              <SelectItem value="F-1 OPT/STEM">
                F-1 OPT/STEM Extension
              </SelectItem>
              <SelectItem value="Other">
                Other (Specify in Instructions)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Urgency and Special Instructions */}
      <div className="space-y-2">
        <Label htmlFor="urgency">Processing Time</Label>
        <Select
          value={data.urgency}
          onValueChange={(value) => updateData({ urgency: value })}>
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

// --- DocumentUploadStep Component ---
interface DocumentUploadStepProps {
  documents: DocumentState[];
  updateDocuments: (
    updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])
  ) => void;
  orderId: string | null;
}

const DocumentUploadStep = ({
  documents = [],
  updateDocuments,
  orderId,
}: DocumentUploadStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateDocumentStatusById = (
    id: string,
    newStatus: Partial<DocumentState>
  ) => {
    updateDocuments((prevDocs) => {
      const docIndex = prevDocs.findIndex((doc) => doc.id === id);
      if (docIndex !== -1) {
        const updatedDocs = [...prevDocs];
        updatedDocs[docIndex] = { ...updatedDocs[docIndex], ...newStatus };
        return updatedDocs;
      } else {
        console.error(
          "[updateDocumentStatusById] Attempted to update status for a document ID not found in state:",
          id
        );
        return prevDocs;
      }
    });
  };

  const uploadFile = async (file: File, id: string) => {
    if (!orderId) {
      console.error("Order ID is missing, cannot upload file.");
      updateDocumentStatusById(id, {
        status: "error",
        error: "Order ID missing.",
      });
      return;
    }

    try {
      updateDocumentStatusById(id, { status: "uploading", progress: 0 });

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${orderId}/${Date.now()}_${sanitizedName}`;

      console.log(`Uploading sanitized file: ${filePath}`);

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      console.log("Upload successful:", data);
      const newPath = data.path;
      updateDocumentStatusById(id, {
        status: "success",
        path: newPath,
        progress: 100,
      });

      try {
        if (!orderId) {
          console.error(
            "Order ID is missing immediately before calling backend function."
          );
          throw new Error("Cannot link document: Order ID is missing.");
        }

        console.log(
          `[Debug] Calling backend function. Order ID Type: ${typeof orderId}, Value: ${orderId}`
        );
        console.log(
          `Calling backend function to add document path for order ${orderId}`
        );
        const functionUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/update-order-documents`;

        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            orderId: String(orderId),
            documentPath: newPath,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            error: "Failed to parse error response from function",
          }));
          console.error(
            `Backend function error updating document_paths for order ${orderId}:`,
            errorBody
          );
          throw new Error(
            errorBody.error ||
              `Function call failed with status ${response.status}`
          );
        }

        const result = await response.json();
        console.log(
          `Backend function successfully updated document_paths for order ${orderId}:`,
          result
        );
      } catch (functionError: any) {
        console.error(
          "Error calling update-order-documents function:",
          functionError
        );
        updateDocumentStatusById(id, {
          status: "error",
          error: `Upload OK, but failed to link to order: ${functionError.message}`,
        });
      }
    } catch (uploadError: any) {
      console.error("Error uploading file to storage:", file.name, uploadError);
      updateDocumentStatusById(id, {
        status: "error",
        error: uploadError.message || "Upload failed",
        progress: undefined,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesToAdd: DocumentState[] = Array.from(e.dataTransfer.files).map(
        (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          status: "pending" as const,
        })
      );
      const filesToUpload = filesToAdd.map((f) => ({ file: f.file, id: f.id }));
      updateDocuments((prevDocs) => [...prevDocs, ...filesToAdd]);
      setTimeout(() => {
        filesToUpload.forEach(({ file, id }) => {
          uploadFile(file, id);
        });
      }, 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered");
    if (e.target.files) {
      const filesToAdd: DocumentState[] = Array.from(e.target.files).map(
        (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          status: "pending" as const,
        })
      );
      const filesToUpload = filesToAdd.map((f) => ({ file: f.file, id: f.id }));
      updateDocuments((prevDocs) => [...prevDocs, ...filesToAdd]);
      setTimeout(() => {
        filesToUpload.forEach(({ file, id }) => {
          uploadFile(file, id);
        });
      }, 0);
    }
  };

  const removeDocument = (id: string) => {
    updateDocuments((prevDocs) => {
      const docIndex = prevDocs.findIndex((doc) => doc.id === id);
      if (docIndex !== -1) {
        const newDocs = [...prevDocs];
        newDocs.splice(docIndex, 1);
        return newDocs;
      } else {
        console.error(
          "[removeDocument] Attempted to remove document with ID not found:",
          id
        );
        return prevDocs;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 hover:border-primary transition-colors" // Added hover:border-primary
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
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
                console.log(
                  "Browse Files Button Clicked! Triggering input click..."
                );
                fileInputRef.current?.click();
              }}>
              Browse Files
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Supported formats: PDF, JPG, PNG, DOCX (Max 10MB per file)
        </p>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Uploaded Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center flex-grow mr-4 overflow-hidden">
                  <FileText className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                      {doc.status === "uploading" && (
                        <span className="ml-2 text-blue-500">
                          Uploading...{" "}
                          {doc.progress !== undefined ? `${doc.progress}%` : ""}
                        </span>
                      )}
                      {doc.status === "success" && (
                        <span className="ml-2 text-green-500">Uploaded</span>
                      )}
                      {doc.status === "error" && (
                        <span className="ml-2 text-red-500" title={doc.error}>
                          Error
                        </span>
                      )}
                    </p>
                    {doc.status === "uploading" &&
                      doc.progress !== undefined && (
                        <Progress value={doc.progress} className="h-1 mt-1" />
                      )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                  disabled={doc.status === "uploading"}>
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

// --- Combined ServiceAndDocumentStep Component ---
interface ServiceAndDocumentStepProps {
  serviceData: OrderData["services"];
  updateServiceData: (data: Partial<OrderData["services"]>) => void;
  documents: DocumentState[];
  updateDocuments: (
    updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])
  ) => void;
  orderId: string | null;
}

const ServiceAndDocumentStep = ({
  serviceData,
  updateServiceData,
  documents,
  updateDocuments,
  orderId,
}: ServiceAndDocumentStepProps) => {
  return (
    // Wrap with TooltipProvider here for ServiceSelectionStep's tooltips
    <TooltipProvider>
      <div className="space-y-8">
        {/* Render Service Selection Content */}
        <ServiceSelectionStep
          data={serviceData}
          updateData={updateServiceData}
        />

        {/* Divider */}
        <hr className="my-6" />

        {/* Render Document Upload Content */}
        <DocumentUploadStep
          documents={documents}
          updateDocuments={updateDocuments}
          orderId={orderId}
        />
      </div>
    </TooltipProvider>
  );
};

// --- DeliveryDetailsStep Component ---
interface DeliveryDetailsStepProps {
  data: OrderData["services"];
  updateData: (data: Partial<OrderData["services"]>) => void;
}

const DeliveryDetailsStep = ({
  data,
  updateData,
}: DeliveryDetailsStepProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Delivery Details</h3>
      <p className="text-sm text-muted-foreground">
        How would you like to receive your documents?
      </p>
      <div className="space-y-2">
        <Label htmlFor="delivery-type">Delivery Type</Label>
        <Select
          value={data.deliveryType}
          onValueChange={(value) => updateData({ deliveryType: value })}>
          <SelectTrigger id="delivery-type">
            <SelectValue placeholder="Select delivery type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">
              Email Copy (Accessible Online 24/7 Free Mailed Copy)
            </SelectItem>
            <SelectItem value="express">
              Express Mail with Tracking ($99.00 fee)
            </SelectItem>
            <SelectItem value="international">
              International Delivery Outside US ($150.00 fee)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipping Information Fields */}
      {data.deliveryType !== "email" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Shipping Information</h4>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={data.shippingInfo.country}
              onValueChange={(value) =>
                updateData({
                  shippingInfo: {
                    ...data.shippingInfo,
                    country: value,
                  },
                })
              }>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                <SelectItem value="Albania">Albania</SelectItem>
                <SelectItem value="Algeria">Algeria</SelectItem>
                <SelectItem value="American Samoa">American Samoa</SelectItem>
                <SelectItem value="Andorra">Andorra</SelectItem>
                <SelectItem value="Angola">Angola</SelectItem>
                <SelectItem value="Anguilla">Anguilla</SelectItem>
                <SelectItem value="Antarctica">Antarctica</SelectItem>
                <SelectItem value="Antigua and Barbuda">
                  Antigua and Barbuda
                </SelectItem>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Armenia">Armenia</SelectItem>
                <SelectItem value="Aruba">Aruba</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Austria">Austria</SelectItem>
                <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                <SelectItem value="Bahamas">Bahamas</SelectItem>
                <SelectItem value="Bahrain">Bahrain</SelectItem>
                <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                <SelectItem value="Barbados">Barbados</SelectItem>
                <SelectItem value="Belarus">Belarus</SelectItem>
                <SelectItem value="Belgium">Belgium</SelectItem>
                <SelectItem value="Belize">Belize</SelectItem>
                <SelectItem value="Benin">Benin</SelectItem>
                <SelectItem value="Bermuda">Bermuda</SelectItem>
                <SelectItem value="Bhutan">Bhutan</SelectItem>
                <SelectItem value="Bolivia">Bolivia</SelectItem>
                <SelectItem value="Bosnia and Herzegovina">
                  Bosnia and Herzegovina
                </SelectItem>
                <SelectItem value="Botswana">Botswana</SelectItem>
                <SelectItem value="Brazil">Brazil</SelectItem>
                <SelectItem value="British Indian Ocean Territory">
                  British Indian Ocean Territory
                </SelectItem>
                <SelectItem value="British Virgin Islands">
                  British Virgin Islands
                </SelectItem>
                <SelectItem value="Brunei Darussalam">
                  Brunei Darussalam
                </SelectItem>
                <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                <SelectItem value="Burundi">Burundi</SelectItem>
                <SelectItem value="Cambodia">Cambodia</SelectItem>
                <SelectItem value="Cameroon">Cameroon</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Cape Verde">Cape Verde</SelectItem>
                <SelectItem value="Cayman Islands">Cayman Islands</SelectItem>
                <SelectItem value="Central African Republic">
                  Central African Republic
                </SelectItem>
                <SelectItem value="Chad">Chad</SelectItem>
                <SelectItem value="Chile">Chile</SelectItem>
                <SelectItem value="China">China</SelectItem>
                <SelectItem value="Christmas Island">
                  Christmas Island
                </SelectItem>
                <SelectItem value="Cocos (Keeling) Islands">
                  Cocos (Keeling) Islands
                </SelectItem>
                <SelectItem value="Colombia">Colombia</SelectItem>
                <SelectItem value="Comoros">Comoros</SelectItem>
                <SelectItem value="Cook Islands">Cook Islands</SelectItem>
                <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                <SelectItem value="Croatia">Croatia</SelectItem>
                <SelectItem value="Cuba">Cuba</SelectItem>
                <SelectItem value="Curaçao">Curaçao</SelectItem>
                <SelectItem value="Cyprus">Cyprus</SelectItem>
                <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                <SelectItem value="Democratic Republic of the Congo">
                  Democratic Republic of the Congo
                </SelectItem>
                <SelectItem value="Denmark">Denmark</SelectItem>
                <SelectItem value="Djibouti">Djibouti</SelectItem>
                <SelectItem value="Dominica">Dominica</SelectItem>
                <SelectItem value="Dominican Republic">
                  Dominican Republic
                </SelectItem>
                <SelectItem value="East Timor">East Timor</SelectItem>
                <SelectItem value="Ecuador">Ecuador</SelectItem>
                <SelectItem value="Egypt">Egypt</SelectItem>
                <SelectItem value="El Salvador">El Salvador</SelectItem>
                <SelectItem value="Equatorial Guinea">
                  Equatorial Guinea
                </SelectItem>
                <SelectItem value="Eritrea">Eritrea</SelectItem>
                <SelectItem value="Estonia">Estonia</SelectItem>
                <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                <SelectItem value="Falkland Islands (Malvinas)">
                  Falkland Islands (Malvinas)
                </SelectItem>
                <SelectItem value="Faroe Islands">Faroe Islands</SelectItem>
                <SelectItem value="Fiji">Fiji</SelectItem>
                <SelectItem value="Finland">Finland</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="French Guiana">French Guiana</SelectItem>
                <SelectItem value="French Polynesia">
                  French Polynesia
                </SelectItem>
                <SelectItem value="French Southern Territories">
                  French Southern Territories
                </SelectItem>
                <SelectItem value="Gabon">Gabon</SelectItem>
                <SelectItem value="Gambia">Gambia</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Ghana">Ghana</SelectItem>
                <SelectItem value="Gibraltar">Gibraltar</SelectItem>
                <SelectItem value="Greece">Greece</SelectItem>
                <SelectItem value="Greenland">Greenland</SelectItem>
                <SelectItem value="Grenada">Grenada</SelectItem>
                <SelectItem value="Guadeloupe">Guadeloupe</SelectItem>
                <SelectItem value="Guam">Guam</SelectItem>
                <SelectItem value="Guatemala">Guatemala</SelectItem>
                <SelectItem value="Guernsey">Guernsey</SelectItem>
                <SelectItem value="Guinea">Guinea</SelectItem>
                <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                <SelectItem value="Guyana">Guyana</SelectItem>
                <SelectItem value="Haiti">Haiti</SelectItem>
                <SelectItem value="Heard Island and McDonald Islands">
                  Heard Island and McDonald Islands
                </SelectItem>
                <SelectItem value="Holy See (Vatican City State)">
                  Holy See (Vatican City State)
                </SelectItem>
                <SelectItem value="Honduras">Honduras</SelectItem>
                <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                <SelectItem value="Hungary">Hungary</SelectItem>
                <SelectItem value="Iceland">Iceland</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Indonesia">Indonesia</SelectItem>
                <SelectItem value="Iran">Iran</SelectItem>
                <SelectItem value="Iraq">Iraq</SelectItem>
                <SelectItem value="Ireland">Ireland</SelectItem>
                <SelectItem value="Isle of Man">Isle of Man</SelectItem>
                <SelectItem value="Israel">Israel</SelectItem>
                <SelectItem value="Italy">Italy</SelectItem>
                <SelectItem value="Ivory Coast">Ivory Coast</SelectItem>
                <SelectItem value="Jamaica">Jamaica</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
                <SelectItem value="Jersey">Jersey</SelectItem>
                <SelectItem value="Jordan">Jordan</SelectItem>
                <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                <SelectItem value="Kenya">Kenya</SelectItem>
                <SelectItem value="Kiribati">Kiribati</SelectItem>
                <SelectItem value="Kuwait">Kuwait</SelectItem>
                <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                <SelectItem value="Laos">Laos</SelectItem>
                <SelectItem value="Latvia">Latvia</SelectItem>
                <SelectItem value="Lebanon">Lebanon</SelectItem>
                <SelectItem value="Lesotho">Lesotho</SelectItem>
                <SelectItem value="Liberia">Liberia</SelectItem>
                <SelectItem value="Libya">Libya</SelectItem>
                <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                <SelectItem value="Lithuania">Lithuania</SelectItem>
                <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                <SelectItem value="Macao">Macao</SelectItem>
                <SelectItem value="Macedonia">Macedonia</SelectItem>
                <SelectItem value="Madagascar">Madagascar</SelectItem>
                <SelectItem value="Malawi">Malawi</SelectItem>
                <SelectItem value="Malaysia">Malaysia</SelectItem>
                <SelectItem value="Maldives">Maldives</SelectItem>
                <SelectItem value="Mali">Mali</SelectItem>
                <SelectItem value="Malta">Malta</SelectItem>
                <SelectItem value="Marshall Islands">
                  Marshall Islands
                </SelectItem>
                <SelectItem value="Martinique">Martinique</SelectItem>
                <SelectItem value="Mauritania">Mauritania</SelectItem>
                <SelectItem value="Mauritius">Mauritius</SelectItem>
                <SelectItem value="Mayotte">Mayotte</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="Micronesia">Micronesia</SelectItem>
                <SelectItem value="Moldova">Moldova</SelectItem>
                <SelectItem value="Monaco">Monaco</SelectItem>
                <SelectItem value="Mongolia">Mongolia</SelectItem>
                <SelectItem value="Montenegro">Montenegro</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
                <SelectItem value="Morocco">Morocco</SelectItem>
                <SelectItem value="Mozambique">Mozambique</SelectItem>
                <SelectItem value="Myanmar">Myanmar</SelectItem>
                <SelectItem value="Namibia">Namibia</SelectItem>
                <SelectItem value="Nauru">Nauru</SelectItem>
                <SelectItem value="Nepal">Nepal</SelectItem>
                <SelectItem value="Netherlands">Netherlands</SelectItem>
                <SelectItem value="New Caledonia">New Caledonia</SelectItem>
                <SelectItem value="New Zealand">New Zealand</SelectItem>
                <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                <SelectItem value="Niger">Niger</SelectItem>
                <SelectItem value="Nigeria">Nigeria</SelectItem>
                <SelectItem value="Niue">Niue</SelectItem>
                <SelectItem value="Norfolk Island">Norfolk Island</SelectItem>
                <SelectItem value="North Korea">North Korea</SelectItem>
                <SelectItem value="Northern Mariana Islands">
                  Northern Mariana Islands
                </SelectItem>
                <SelectItem value="Norway">Norway</SelectItem>
                <SelectItem value="Oman">Oman</SelectItem>
                <SelectItem value="Pakistan">Pakistan</SelectItem>
                <SelectItem value="PW">Palau</SelectItem>
                <SelectItem value="PS">Palestinian Territory</SelectItem>
                <SelectItem value="PA">Panama</SelectItem>
                <SelectItem value="PG">Papua New Guinea</SelectItem>
                <SelectItem value="PY">Paraguay</SelectItem>
                <SelectItem value="PE">Peru</SelectItem>
                <SelectItem value="PH">Philippines</SelectItem>
                <SelectItem value="PN">Pitcairn</SelectItem>
                <SelectItem value="PL">Poland</SelectItem>
                <SelectItem value="PT">Portugal</SelectItem>
                <SelectItem value="PR">Puerto Rico</SelectItem>
                <SelectItem value="QA">Qatar</SelectItem>
                <SelectItem value="CG">Republic of the Congo</SelectItem>
                <SelectItem value="RE">Réunion</SelectItem>
                <SelectItem value="RO">Romania</SelectItem>
                <SelectItem value="RU">Russian Federation</SelectItem>
                <SelectItem value="RW">Rwanda</SelectItem>
                <SelectItem value="BL">Saint Barthélemy</SelectItem>
                <SelectItem value="SH">Saint Helena</SelectItem>
                <SelectItem value="KN">Saint Kitts and Nevis</SelectItem>
                <SelectItem value="LC">Saint Lucia</SelectItem>
                <SelectItem value="MF">Saint Martin (French part)</SelectItem>
                <SelectItem value="PM">Saint Pierre and Miquelon</SelectItem>
                <SelectItem value="VC">
                  Saint Vincent and the Grenadines
                </SelectItem>
                <SelectItem value="WS">Samoa</SelectItem>
                <SelectItem value="SM">San Marino</SelectItem>
                <SelectItem value="ST">Sao Tome and Principe</SelectItem>
                <SelectItem value="SA">Saudi Arabia</SelectItem>
                <SelectItem value="SN">Senegal</SelectItem>
                <SelectItem value="RS">Serbia</SelectItem>
                <SelectItem value="SC">Seychelles</SelectItem>
                <SelectItem value="SL">Sierra Leone</SelectItem>
                <SelectItem value="SG">Singapore</SelectItem>
                <SelectItem value="SX">Sint Maarten (Dutch part)</SelectItem>
                <SelectItem value="SK">Slovakia</SelectItem>
                <SelectItem value="SI">Slovenia</SelectItem>
                <SelectItem value="SB">Solomon Islands</SelectItem>
                <SelectItem value="SO">Somalia</SelectItem>
                <SelectItem value="ZA">South Africa</SelectItem>
                <SelectItem value="GS">
                  South Georgia and the South Sandwich Islands
                </SelectItem>
                <SelectItem value="KR">South Korea</SelectItem>
                <SelectItem value="SS">South Sudan</SelectItem>
                <SelectItem value="ES">Spain</SelectItem>
                <SelectItem value="LK">Sri Lanka</SelectItem>
                <SelectItem value="SD">Sudan</SelectItem>
                <SelectItem value="SR">Suriname</SelectItem>
                <SelectItem value="SJ">Svalbard and Jan Mayen</SelectItem>
                <SelectItem value="SZ">Swaziland</SelectItem>
                <SelectItem value="SE">Sweden</SelectItem>
                <SelectItem value="CH">Switzerland</SelectItem>
                <SelectItem value="SY">Syrian Arab Republic</SelectItem>
                <SelectItem value="TW">Taiwan</SelectItem>
                <SelectItem value="TJ">Tajikistan</SelectItem>
                <SelectItem value="TZ">Tanzania</SelectItem>
                <SelectItem value="TH">Thailand</SelectItem>
                <SelectItem value="TG">Togo</SelectItem>
                <SelectItem value="TK">Tokelau</SelectItem>
                <SelectItem value="TO">Tonga</SelectItem>
                <SelectItem value="TT">Trinidad and Tobago</SelectItem>
                <SelectItem value="TN">Tunisia</SelectItem>
                <SelectItem value="TR">Turkey</SelectItem>
                <SelectItem value="TM">Turkmenistan</SelectItem>
                <SelectItem value="TC">Turks and Caicos Islands</SelectItem>
                <SelectItem value="TV">Tuvalu</SelectItem>
                <SelectItem value="UG">Uganda</SelectItem>
                <SelectItem value="UA">Ukraine</SelectItem>
                <SelectItem value="AE">United Arab Emirates</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="UM">
                  United States Minor Outlying Islands
                </SelectItem>
                <SelectItem value="VI">United States Virgin Islands</SelectItem>
                <SelectItem value="UY">Uruguay</SelectItem>
                <SelectItem value="UZ">Uzbekistan</SelectItem>
                <SelectItem value="VU">Vanuatu</SelectItem>
                <SelectItem value="VE">Venezuela</SelectItem>
                <SelectItem value="VN">Vietnam</SelectItem>
                <SelectItem value="WF">Wallis and Futuna</SelectItem>
                <SelectItem value="EH">Western Sahara</SelectItem>
                <SelectItem value="YE">Yemen</SelectItem>
                <SelectItem value="ZM">Zambia</SelectItem>
                <SelectItem value="ZW">Zimbabwe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="123 Main St"
              value={data.shippingInfo.address}
              onChange={(e) =>
                updateData({
                  shippingInfo: {
                    ...data.shippingInfo,
                    address: e.target.value,
                  },
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apartment">
              Apartment, suite, unit, etc. (Optional)
            </Label>
            <Input
              id="apartment"
              placeholder="Apt 4B"
              value={data.shippingInfo.apartment}
              onChange={(e) =>
                updateData({
                  shippingInfo: {
                    ...data.shippingInfo,
                    apartment: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Anytown"
                value={data.shippingInfo.city}
                onChange={(e) =>
                  updateData({
                    shippingInfo: {
                      ...data.shippingInfo,
                      city: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                placeholder="CA"
                value={data.shippingInfo.state}
                onChange={(e) =>
                  updateData({
                    shippingInfo: {
                      ...data.shippingInfo,
                      state: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip / Postal Code</Label>
              <Input
                id="zip"
                placeholder="90210"
                value={data.shippingInfo.zip}
                onChange={(e) =>
                  updateData({
                    shippingInfo: { ...data.shippingInfo, zip: e.target.value },
                  })
                }
                required
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ReviewStep Component ---
interface ReviewStepProps {
  orderData: OrderData; // Use specific type
}

const ReviewStep = ({ orderData }: ReviewStepProps) => {
  const getServiceTypeText = () => {
    switch (orderData.services.type) {
      case "translation":
        return "Certified Translation";
      case "evaluation":
        return "Credential Evaluation";
      case "expert":
        return "Expert Opinion Letter";
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

  // Re-define calculateReviewPrice locally within ReviewStep for display purposes
  const calculateReviewPrice = (reviewOrderData: OrderData) => {
    let totalPrice = 0;
    const { type, pageCount, evaluationType } = reviewOrderData.services;

    if (type === "translation") {
      const pages = Math.max(1, pageCount || 1);
      totalPrice += pages * 25;
    } else if (type === "evaluation") {
      if (evaluationType === "document") {
        totalPrice += 85;
      } else if (evaluationType === "course") {
        totalPrice += 150;
      }
    } else if (type === "expert") {
      totalPrice += 599;
    }

    switch (reviewOrderData.services.urgency) {
      case "expedited":
        totalPrice *= 1.5;
        break;
      case "rush":
        totalPrice *= 2;
        break;
      default:
        break;
    }
    return totalPrice;
  };

  const calculatedPrice = calculateReviewPrice(orderData);

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
            <h4 className="font-medium">Customer Information</h4>
            <p className="text-sm">
              {orderData.customerInfo.firstName}{" "}
              {orderData.customerInfo.lastName}
            </p>
            <p className="text-sm">{orderData.customerInfo.email}</p>
            {orderData.customerInfo.phone && (
              <p className="text-sm">{orderData.customerInfo.phone}</p>
            )}{" "}
            {/* Display phone if available */}
          </div>

          <div>
            <h4 className="font-medium">Documents</h4>
            {orderData.documents.length > 0 ? (
              <ul className="text-sm space-y-1">
                {/* Use DocumentState type here */}
                {orderData.documents.map((doc: DocumentState) => (
                  <li key={doc.id}>{doc.name}</li> // Use unique ID as key
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
            {/* Added Service Benefit Text */}
            {orderData.services.type === "translation" && (
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive a certified translation suitable for official
                use.
              </p>
            )}
            {orderData.services.type === "evaluation" && (
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive a report detailing the U.S. equivalency of your
                credentials.
              </p>
            )}
            {orderData.services.type === "expert" && (
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive a letter analyzing your qualifications for your
                specific visa needs.
              </p>
            )}
            {/* End Added Service Benefit Text */}

            {/* Conditional details based on service type */}
            {orderData.services.type === "translation" && (
              <>
                <p className="text-sm">
                  Language From: {orderData.services.languageFrom}
                </p>
                <p className="text-sm">
                  Language To: {orderData.services.languageTo}
                </p>
                <p className="text-sm">
                  Pages for Translation: {orderData.services.pageCount || 1}
                </p>
              </>
            )}
            {orderData.services.type === "evaluation" && (
              <p className="text-sm">
                Evaluation Type:{" "}
                {orderData.services.evaluationType === "document"
                  ? "Document-by-Document"
                  : "Course-by-Course"}
              </p>
            )}
            {orderData.services.type === "expert" && (
              <p className="text-sm">
                Visa Type: {orderData.services.visaType || "Not specified"}
              </p>
            )}
            {/* End conditional details */}
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

          {orderData.services.deliveryType !== "email" && (
            <div>
              <h4 className="font-medium">Shipping Information</h4>
              <p className="text-sm">
                Country: {orderData.services.shippingInfo.country}
              </p>
              <p className="text-sm">
                Address: {orderData.services.shippingInfo.address}
              </p>
              {orderData.services.shippingInfo.apartment && (
                <p className="text-sm">
                  Apartment: {orderData.services.shippingInfo.apartment}
                </p>
              )}
              <p className="text-sm">
                City: {orderData.services.shippingInfo.city}
              </p>
              <p className="text-sm">
                State: {orderData.services.shippingInfo.state}
              </p>
              <p className="text-sm">
                Zip: {orderData.services.shippingInfo.zip}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="font-medium">Estimated Total:</span>
            <span className="font-bold">${calculatedPrice.toFixed(2)}</span>
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

// --- PaymentStep Component ---
interface PaymentStepProps {
  error: string | null;
}

const PaymentStep = ({ error }: PaymentStepProps) => {
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

      {/* --- Stripe Card Element --- */}
      <div className="space-y-4 mt-4">
        {/* Added Secure Payment Indicator */}
        <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
          <LockIcon className="h-4 w-4 mr-1" />
          <span>Secure Payment via Stripe</span>
        </div>
        {/* End Secure Payment Indicator */}
        <Label htmlFor="card-element">Credit or debit card</Label>
        <div className="p-3 border rounded-md bg-white">
          {" "}
          {/* Style wrapper */}
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>
      {/* --- End Stripe Card Element --- */}

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

// ==================================
// Main OrderWizard Component (Export)
// ==================================
const OrderWizard = ({
  onComplete = () => {},
  initialStep = 0,
}: OrderWizardProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  // const [orderId, setOrderId] = useState<string | null>(null); // Remove local state
  const { orderId, setOrderId } = useOrderContext(); // Use context state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate(); // Add navigate hook

  // Explicitly type the state with OrderData
  const [orderData, setOrderData] = useState<OrderData>({
    customerInfo: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "", // Added phone to initial state
    },
    documents: [] as DocumentState[], // Use the defined type
    services: {
      type: "", // Initialize as empty string - NO DEFAULT SERVICE
      languageFrom: "", // Initialize empty
      languageTo: "", // Initialize empty
      pageCount: 1, // Keep default page count? Or set to 0/null? Let's keep 1 for now.
      evaluationType: "", // Initialize empty
      visaType: "", // Initialize empty
      urgency: "standard", // Keep standard urgency default
      specialInstructions: "",
      deliveryType: "email", // Default to email copy
      shippingInfo: {
        country: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        zip: "",
      },
    },
    payment: {
      method: "credit-card",
      // Removed specific card fields, handled by Stripe Element
    },
  });

  const totalSteps = 5; // Your Info, Service & Docs, Delivery, Review, Payment
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // --- Calculate Price Function ---
  const calculatePrice = (currentOrderData: typeof orderData): number => {
    let totalPrice = 0;
    const { type, pageCount, evaluationType, deliveryType } =
      currentOrderData.services;

    // Service Costs
    if (type === "translation") {
      const pages = Math.max(1, pageCount || 1);
      totalPrice += pages * 25;
    } else if (type === "evaluation") {
      if (evaluationType === "document") {
        totalPrice += 85;
      } else if (evaluationType === "course") {
        totalPrice += 150; // Placeholder price
      }
    } else if (type === "expert") {
      totalPrice += 599; // Expert Opinion Letter base price
    }
    // Note: 'both' type removed for simplicity with 'expert' addition.
    // If 'both' is needed, logic needs adjustment.

    // Urgency Multiplier
    switch (currentOrderData.services.urgency) {
      case "expedited":
        totalPrice *= 1.5;
        break;
      case "rush":
        totalPrice *= 2;
        break;
      case "standard": // No change for standard
      default:
        break; // No change
    }

    // Delivery Costs
    if (deliveryType === "express") {
      totalPrice += 99;
    } else if (deliveryType === "international") {
      totalPrice += 150;
    }

    return totalPrice;
  };
  // --- End Calculate Price Function ---

  const handleNext = async () => {
    setError(null); // Clear previous errors

    // Log state values at the beginning of handleNext
    console.log(
      `handleNext called: currentStep=${currentStep}, totalSteps=${totalSteps}, stripe=${!!stripe}, elements=${!!elements}`
    );
    console.log(
      `[DEBUG] handleNext start - Current orderId: ${orderId} (Type: ${typeof orderId})`
    ); // Log orderId at the start of each call

    // --- Save Customer Info on Step 0 ---
    if (currentStep === 0) {
      // Destructure phone number as well
      const { firstName, lastName, email, phone } = orderData.customerInfo;
      // Add validation for phone if it becomes required
      if (!firstName || !lastName || !email) {
        setError(
          "Please fill in all required fields (First Name, Last Name, Email)."
        );
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
              phone: phone, // Add phone number to the insert object
              // Add other initial order data if needed, e.g., status: 'pending'
            },
          ])
          .select("id") // Select the ID of the newly created order
          .single(); // Expect a single row back

        if (insertError) {
          throw insertError;
        }

        if (data && data.id) {
          const newOrderId = data.id; // This is likely a number
          const orderIdString = newOrderId.toString(); // Convert to string
          setOrderId(orderIdString); // Store the string ID in context
          console.log("Order created with ID:", newOrderId); // Log original number ID
          console.log(
            `[DEBUG] orderId state set in Step 0 to: ${orderIdString} (Type: ${typeof orderIdString})`
          ); // Log string ID and type

          // --- Klaviyo Web SDK Tracking ---
          try {
            // Ensure _learnq is available (loaded by the script in index.html)
            if (window._learnq) {
              console.log(
                "Klaviyo SDK (_learnq) found. Identifying user and tracking event."
              );

              // 1. Identify the user
              window._learnq.push([
                "identify",
                {
                  $email: orderData.customerInfo.email,
                  $first_name: orderData.customerInfo.firstName,
                  $last_name: orderData.customerInfo.lastName,
                  $phone_number: orderData.customerInfo.phone,
                  // Add any other profile properties you want to track
                },
              ]);

              // 2. Track the 'checkout_started' event using Server-Side API
              // IMPORTANT SECURITY WARNING: Exposing private API keys on the frontend is insecure.
              // It's strongly recommended to move this fetch call to a secure backend function
              // (e.g., a Supabase Edge Function) where the API key can be stored safely.
              const klaviyoApiKey = import.meta.env
                .VITE_KLAVIYO_PRIVATE_API_KEY; // Use environment variable

              if (klaviyoApiKey) {
                const estimatedPrice = calculatePrice(orderData);
                // Ensure newOrderId is treated as a string for consistency
                const quoteIdString = String(newOrderId);
                const resumeLink = `${window.location.origin}/checkout?resume_token=${quoteIdString}`;

                // Construct a FLAT payload to send to the Supabase function,
                // matching the structure expected by the example function provided.
                const eventPayload = {
                  email: orderData.customerInfo.email, // Required identifier
                  metric: "checkout_started", // The event name
                  // Properties to be nested under 'properties' by the function
                  quote_id: quoteIdString,
                  value: estimatedPrice,
                  resume_link: resumeLink,
                  service_type: orderData.services.type,
                  evaluation_type: orderData.services.evaluationType,
                  urgency: orderData.services.urgency,
                  // Add any other properties needed by the function here
                };

                // Call the Supabase Edge Function instead of Klaviyo API directly
                const functionUrl = `${
                  import.meta.env.VITE_SUPABASE_URL
                }/functions/v1/send-klaviyo-event`;
                console.log(
                  `Calling Supabase function for Klaviyo event: ${functionUrl}`
                );

                fetch(functionUrl, {
                  method: "POST",
                  headers: {
                    // No Authorization header needed here (API key is handled by the function)
                    "Content-Type": "application/json",
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, // Supabase function might still need anon key depending on config
                  },
                  body: JSON.stringify(eventPayload), // Send the constructed payload
                })
                  .then(async (res) => {
                    // Make async to parse JSON body on error
                    if (!res.ok) {
                      // Attempt to parse error details from the Supabase function response
                      const errorData = await res.json().catch(() => ({
                        error:
                          "Failed to parse error response from Supabase function.",
                      }));
                      console.error(
                        "Supabase function error sending Klaviyo event:",
                        res.status,
                        errorData
                      );
                      // Optionally, log this error, but don't block the user flow.
                      // Throwing an error here might be too disruptive if the event failing isn't critical.
                      // throw new Error(`Supabase function request failed with status ${res.status}`);
                    } else if (res.status === 204) {
                      console.log(
                        "Supabase function successfully processed Klaviyo event (Status 204 No Content)."
                      );
                      // No body expected on 204 success
                    } else {
                      // Handle unexpected success statuses if necessary
                      const responseData = await res.json().catch(() => null);
                      console.log(
                        "Supabase function response (checkout_started):",
                        responseData
                      );
                    }
                    // Don't return res.json() here as 204 has no body
                  })
                  // .then(data => console.log('Supabase function response (checkout_started):', data)) // Removed as 204 has no body
                  .catch((err) =>
                    console.error(
                      "Error calling Supabase function for Klaviyo event:",
                      err
                    )
                  );

                console.log(
                  "Klaviyo identify call pushed (Web SDK) and checkout_started event sent via Supabase function."
                );
              } else {
                console.warn(
                  "VITE_KLAVIYO_PRIVATE_API_KEY not found in environment variables. Klaviyo server-side event tracking skipped."
                );
              }
            } else {
              console.warn(
                "Klaviyo SDK (_learnq) not found on window. Identify call skipped."
              );
            }
          } catch (klaviyoError) {
            console.error(
              "Error during Klaviyo SDK interaction:",
              klaviyoError
            );
          }
          // --- End Klaviyo Tracking ---

          setCurrentStep(currentStep + 1); // Proceed to next step
        } else {
          throw new Error("Failed to create order or retrieve ID.");
        }
      } catch (err: any) {
        console.error("Error saving customer info:", err);
        setError(
          err.message || "Failed to save information. Please try again."
        );
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
      console.log(
        `Entering final step payment block. Stripe ready: ${!!stripe}, Elements ready: ${!!elements}`
      ); // ADDED LOG HERE
      console.log(
        `[DEBUG] At start of payment step (step 3) - orderId: ${orderId} (Type: ${typeof orderId})`
      ); // Log orderId at start of payment step

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card details not found. Please try again.");
        setPaymentProcessing(false);
        return;
      }

      try {
        // --- 0. Update Order with final details before payment ---
        const calculatedAmount = Math.round(calculatePrice(orderData) * 100); // Calculate amount in cents
        console.log(
          `Attempting to update order ${orderId} status and services (amount updated in function):`,
          orderData.services
        ); // Log data being sent
        // Remove total_amount update from client-side - let the function handle it
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            // total_amount: calculatedAmount, // REMOVED - Handled by create-payment-intent function
            services: orderData.services, // Assuming 'services' column is JSONB
            status: "pending_payment", // Update status before payment attempt
          })
          .eq("id", orderId);

        if (updateError) {
          console.error(
            "!!! Error updating order before payment:",
            updateError
          ); // Make error prominent
          throw new Error(
            `Failed to update order details: ${updateError.message}`
          );
        }
        console.log(
          `+++ Order ${orderId} updated successfully before payment.`
        ); // Make success prominent

        // --- 1. Create PaymentIntent on Backend ---
        const functionUrl =
          "https://lholxkbtosixszauuzmb.supabase.co/functions/v1/create-payment-intent";
        // const calculatedAmount = Math.round(calculatePrice(orderData) * 100); // Amount already calculated above

        // --- Add detailed logging and VALIDATION for orderId before fetch ---
        console.log(
          `[DEBUG] Preparing to call create-payment-intent. Order ID: ${orderId}, Type: ${typeof orderId}`
        );
        if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
          // Check type and for empty string
          console.error(
            "[CRITICAL] orderId is invalid before calling create-payment-intent function!",
            { orderId }
          );
          // Throw an error here to prevent the fetch call if orderId is invalid
          throw new Error(
            "Frontend Error: Invalid Order ID before calling payment function. Please go back and try again."
          );
        }
        // --- End detailed logging and VALIDATION ---

        console.log(
          `Calling Supabase function at ${functionUrl} for order ${orderId} with amount ${calculatedAmount}`
        );

        // No session check or Authorization header needed since verify_jwt = false for create-payment-intent
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, // Use anon key (still required by gateway)
            // Authorization header removed
          },
          body: JSON.stringify({
            amount: calculatedAmount,
            orderId: orderId,
          }),
        });

        if (!response.ok) {
          const errorBody = await response
            .json()
            .catch(() => ({ error: "Failed to parse error response" }));
          console.error("Backend error response:", errorBody);
          throw new Error(
            errorBody.error ||
              `Function invocation failed with status ${response.status}`
          );
        }

        const { clientSecret, error: backendError } = await response.json();

        if (backendError || !clientSecret) {
          console.error(
            "Backend returned error or no clientSecret:",
            backendError
          );
          throw new Error(
            backendError || "Failed to get payment secret from backend."
          );
        }

        console.log("Received clientSecret from backend.");

        // --- 2. Confirm Card Payment ---
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
                email: orderData.customerInfo.email,
                // Add address details if collected
              },
            },
          });

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

          // --- Trigger Receipt Email ---
          if (orderId) {
            console.log(
              `Attempting to send receipt email for order ${orderId}`
            );
            // Call the function asynchronously. Don't block navigation on email success/failure.
            // No session/Authorization needed since verify_jwt = false for this function.
            console.log(
              `[Debug] Preparing to call send-order-receipt. Order ID: ${orderId}, Type: ${typeof orderId}`
            ); // ADDED LOG
            fetch(
              `${
                import.meta.env.VITE_SUPABASE_URL
              }/functions/v1/send-order-receipt`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, // Still need anon key for gateway
                  // 'Authorization' header removed
                },
                body: JSON.stringify({ orderId: orderId }),
              }
            )
              .then(async (response) => {
                if (!response.ok) {
                  const errorBody = await response.json().catch(() => ({}));
                  console.error(
                    `Failed to send receipt email for order ${orderId}. Status: ${response.status}`,
                    errorBody
                  );
                } else {
                  console.log(
                    `Receipt email request successful for order ${orderId}.`
                  );
                }
              })
              .catch((emailError) => {
                console.error(
                  `Error calling send-order-receipt function for order ${orderId}:`,
                  emailError
                );
              });
          } else {
            console.warn("Order ID not available, cannot send receipt email.");
          }
          // --- End Trigger Receipt Email ---

          setPaymentProcessing(false); // Stop processing indicator

          // Call the completion callback
          onComplete({
            ...orderData,
            orderId,
            paymentIntentId: paymentIntent.id,
          });
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
      // Handle cases where stripe or elements aren't loaded yet, or not on the final step (now step 3)
      if (currentStep === totalSteps - 1) {
        // Check if on the *new* final step (index 3)
        setError("Stripe is not ready. Please wait a moment and try again.");
      } else if (currentStep < totalSteps - 1) {
        // If not on the final step, just move forward
        // This case should not be reachable if the main logic is correct,
        // as the only other path is currentStep === 0 or currentStep === totalSteps - 1
        // If we are here, it means currentStep is 1 or 2, and we should proceed.
        setCurrentStep(currentStep + 1);
      } else {
        // Should not happen if logic is correct, but good to have a fallback
        console.error("Unexpected state in handleNext:", {
          currentStep,
          stripe,
          elements,
        });
        setError("An unexpected error occurred.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Corrected updateOrderData to handle different section types properly
  const updateOrderData = (
    section: keyof OrderData,
    data: Partial<OrderData[keyof OrderData]>
  ) => {
    setOrderData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object), // Type assertion needed here
        ...data,
      },
    }));
  };

  const steps = [
    { title: "Your Info", icon: <UserIcon className="h-5 w-5" /> },
    { title: "Service & Docs", icon: <Globe className="h-5 w-5" /> },
    { title: "Delivery", icon: <TruckIcon className="h-5 w-5" /> }, // New Step
    { title: "Review", icon: <Check className="h-5 w-5" /> },
    { title: "Payment", icon: <DollarSign className="h-5 w-5" /> },
  ];

  // Social Proof Content
  const socialProofItems = [
    {
      icon: Award,
      title: "100% Acceptance",
      text: "Our translations & evaluations meet the requirements for certified translation acceptance — it's guaranteed.",
    },
    {
      icon: Lock,
      title: "Secure & Private",
      text: "Your documents are securely stored and only transmitted via encrypted means.",
    },
    {
      icon: ShieldCheck,
      title: "Professionally Translated & Evaluated",
      text: "Your certified translation and academic evaluations will be completed by a professional translator in combination with an expert evaluator.",
    },
  ];

  return (
    // Use a grid layout for larger screens
    <div className="container mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
      {/* Main Content Area (Wizard Steps) - takes 2 columns */}
      <div className="md:col-span-2">
        <Card>
          {" "}
          {/* Removed className="md:col-span-2" from Card */}
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
                    className={`flex flex-col items-center ${
                      index <= currentStep
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}>
                    <div
                      className={`rounded-full p-2 ${
                        index <= currentStep
                          ? "bg-primary text-white"
                          : "bg-muted"
                      }`}>
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
                transition={{ duration: 0.3 }}>
                {currentStep === 0 && (
                  <CustomerInfoStep
                    data={orderData.customerInfo}
                    // Pass the specific update function for this section
                    updateData={(data) => updateOrderData("customerInfo", data)}
                    error={error}
                  />
                )}
                {/* Combined Step 1: Services and Documents */}
                {currentStep === 1 && (
                  <ServiceAndDocumentStep
                    serviceData={orderData.services}
                    // Pass the specific update function for services
                    updateServiceData={(data) =>
                      updateOrderData("services", data)
                    }
                    documents={orderData.documents}
                    // Pass the state setter for documents directly or an updater function
                    updateDocuments={(updater) =>
                      setOrderData((prevData) => ({
                        ...prevData,
                        documents:
                          typeof updater === "function"
                            ? updater(prevData.documents)
                            : updater,
                      }))
                    }
                    orderId={orderId}
                  />
                )}
                {/* End Combined Step */}
                {currentStep === 2 && ( // Delivery Details is now step 2
                  <DeliveryDetailsStep
                    data={orderData.services}
                    updateData={(data) => updateOrderData("services", data)}
                  />
                )}
                {currentStep === 3 && <ReviewStep orderData={orderData} />}{" "}
                {/* Review is now step 3 */}
                {currentStep === 4 /* Payment is now step 4 */ && (
                  <PaymentStep error={error} />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {/* Disable button on last step if stripe or elements are not ready */}
            <Button
              onClick={handleNext}
              disabled={
                (isSubmitting && currentStep === 0) ||
                paymentProcessing ||
                (currentStep === totalSteps - 1 && (!stripe || !elements)) // Check against new totalSteps
              }>
              {isSubmitting && currentStep === 0
                ? "Saving..."
                : paymentProcessing
                ? "Processing Payment..."
                : currentStep === totalSteps - 1
                ? "Complete Order"
                : "Next"}{" "}
              {/* Check against new totalSteps */}
              {!(isSubmitting && currentStep === 0) &&
                !paymentProcessing &&
                currentStep !== totalSteps - 1 && ( // Check against new totalSteps
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
            </Button>
          </CardFooter>{" "}
          {/* Closing CardFooter */}
        </Card>{" "}
        {/* Closing Card */}
      </div>{" "}
      {/* Closing Main Content Area div */}
      {/* Sidebar Area - takes 1 column */}
      <div className="md:col-span-1 space-y-6">
        {" "}
        {/* Removed mt-8 md:mt-0 */}
        {/* Order Summary Sidebar */}
        <OrderSummarySidebar orderData={orderData} />
        {/* Social Proof Section (Below Sidebar) */}
        <div className="mt-8">
          {" "}
          {/* Add margin top to separate from sidebar */}
          <h3 className="text-xl font-semibold text-center md:text-left">
            Why Choose CreditEval?
          </h3>
          {socialProofItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg mt-4">
              {" "}
              {/* Added mt-4 */}
              <item.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>{" "}
        {/* Closing Social Proof Items container */}
        {/* Added Trust Logos */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-center text-sm font-medium text-muted-foreground mb-4">
            Trusted & Accredited
          </h4>
          <div className="flex justify-center items-center space-x-4">
            <img src="/ata-logo.png" alt="ATA Member" className="h-10" />
            <img
              src="/bbb-accredited.png"
              alt="BBB Accredited Business"
              className="h-10"
            />
            <img src="/trustpilot-logo.png" alt="Trustpilot" className="h-8" />
          </div>
        </div>
        {/* End Added Trust Logos */}
      </div>{" "}
      {/* Closing Sidebar Area div */}
      {/* Conditionally Render Evalyn Assistant (Step 2 onwards) */}
      {currentStep >= 2 && <EvalynAssistant />}
    </div> /* Closing main container div */
  );
};

export default OrderWizard; // Ensure default export is present
