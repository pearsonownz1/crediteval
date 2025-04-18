import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Upload, FileText, ArrowLeft, Check } from "lucide-react"; // Added Check
import { supabase } from "../lib/supabaseClient"; // Assuming you might need Supabase later for uploads/submissions

// Define the document type explicitly for clarity (similar to OrderWizard)
type DocumentState = {
  id: string; // Unique identifier for state management
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  path?: string; // Path in storage after upload
  progress?: number;
};

type ServiceType = "Certified Translation" | "Credential Evaluation" | "Expert Opinion Letter";

const QuotePage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [documents, setDocuments] = useState<DocumentState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // --- File Handling Functions (Adapted from OrderWizard) ---

  const updateDocumentStatusById = (id: string, newStatus: Partial<DocumentState>) => {
    setDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(doc => doc.id === id);
      if (docIndex !== -1) {
        const updatedDocs = [...prevDocs];
        updatedDocs[docIndex] = { ...updatedDocs[docIndex], ...newStatus };
        return updatedDocs;
      }
      return prevDocs;
    });
  };

  // Actual Supabase Storage upload function
  const uploadFile = async (file: File, id: string) => {
    updateDocumentStatusById(id, { status: 'uploading', progress: 0 });

    // Sanitize the filename for the storage path
    const sanitizedFilename = file.name
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove disallowed characters (allow alphanumeric, dot, underscore, hyphen)

    const filePath = `quotes/${id}/${sanitizedFilename}`; // Use sanitized filename

    try {
      const { data, error } = await supabase.storage
        .from('documents') // Use the existing 'documents' bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite if file with same name exists for this quote ID
        });

      if (error) {
        console.error(`Upload error for ${file.name}:`, error);
        // Provide a more detailed error message, stringify if message is not available
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : JSON.stringify(error);
        updateDocumentStatusById(id, { status: 'error', error: errorMessage, progress: undefined });
        return; // Stop execution on error
      }

      if (data) {
        // Use the actual path returned by Supabase
        updateDocumentStatusById(id, { status: 'success', path: data.path, progress: 100 });
        console.log(`Upload success for ${file.name}, path: ${data.path}`);
      } else {
         // Handle unexpected case where data is null without error
         console.error(`Upload completed for ${file.name} but no data returned.`);
         updateDocumentStatusById(id, { status: 'error', error: 'Upload completed but no path returned.', progress: undefined });
      }

    } catch (err: any) {
      console.error(`Unexpected error during upload for ${file.name}:`, err);
       // Provide a more detailed error message, stringify if message is not available
      const errorMessage = typeof err === 'object' && err !== null && 'message' in err ? String(err.message) : JSON.stringify(err);
      updateDocumentStatusById(id, { status: 'error', error: errorMessage || 'An unknown error occurred during upload.', progress: undefined });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesToAdd: DocumentState[] = Array.from(e.target.files).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending' as const,
      }));
      const filesToUpload = filesToAdd.map(f => ({ file: f.file, id: f.id }));
      setDocuments(prevDocs => [...prevDocs, ...filesToAdd]);

      setTimeout(() => {
        filesToUpload.forEach(({ file, id }) => {
          uploadFile(file, id); // Trigger simulated upload
        });
      }, 0);
    }
     // Reset file input to allow uploading the same file again if removed
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
     }
  };

   const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
       const filesToAdd: DocumentState[] = Array.from(e.dataTransfer.files).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: 'pending' as const,
      }));
      const filesToUpload = filesToAdd.map(f => ({ file: f.file, id: f.id }));
      setDocuments(prevDocs => [...prevDocs, ...filesToAdd]);

      setTimeout(() => {
        filesToUpload.forEach(({ file, id }) => {
          uploadFile(file, id); // Trigger simulated upload
        });
      }, 0);
    }
  };

  const removeDocument = async (id: string) => {
    const docToRemove = documents.find(doc => doc.id === id);

    // Remove from state immediately for responsiveness
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));

    // If the file was successfully uploaded, attempt to delete from storage
    if (docToRemove && docToRemove.status === 'success' && docToRemove.path) {
      console.log(`Attempting to delete ${docToRemove.path} from storage...`);
      try {
        const { error } = await supabase.storage
          .from('documents') // Use the existing 'documents' bucket
          .remove([docToRemove.path]);

        if (error) {
          console.error(`Failed to delete ${docToRemove.path} from storage:`, error);
          // Optional: Add user feedback about failed deletion?
        } else {
          console.log(`Successfully deleted ${docToRemove.path} from storage.`);
        }
      } catch (err) {
         console.error(`Unexpected error deleting ${docToRemove.path} from storage:`, err);
      }
    }
  };

  // --- End File Handling ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError(null);

    // Basic validation
    if (!formData.name || !formData.email) {
        setSubmitError("Please fill in your name and email address.");
        setIsSubmitting(false);
        return;
    }

    // Filter out files that haven't successfully uploaded (or are still pending/uploading)
    const successfullyUploadedFiles = documents.filter(doc => doc.status === 'success');
    if (documents.some(doc => doc.status === 'uploading')) {
        setSubmitError("Please wait for all files to finish uploading.");
        setIsSubmitting(false);
        return;
    }
     if (documents.some(doc => doc.status === 'error')) {
        setSubmitError("Some files failed to upload. Please remove them or try again.");
        setIsSubmitting(false);
        return;
    }


    const quoteRequestData = {
      service: selectedService,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      // Include paths of successfully uploaded documents
      documentPaths: successfullyUploadedFiles.map(doc => doc.path),
      submittedAt: new Date().toISOString(),
    };

    console.log("Submitting Quote Request:", quoteRequestData);

    // --- TODO: Replace with actual submission logic ---
    // --- Invoke Supabase Function ---
    try {
      const { data, error } = await supabase.functions.invoke("send-quote-request", {
        body: quoteRequestData,
      });

      if (error) {
        // Handle specific function invocation errors
        console.error("Supabase function invocation error:", error);
        throw new Error(`Function error: ${error.message}`);
      }

      // Check for errors returned *within* the function's response body
      if (data?.error) {
         console.error("Error from send-quote-request function:", data.error);
         throw new Error(data.error);
      }

      console.log("Quote request submitted and function invoked successfully:", data);
      setSubmitStatus('success');

    } catch (error: any) {
      console.error("Error submitting quote request:", error);
        setSubmitError(error.message || "Failed to submit quote request.");
        setSubmitStatus('error');
    } finally {
        setIsSubmitting(false);
    }
    // --- End TODO ---
  };

  const handleBack = () => {
    setStep(1);
    setSelectedService(null);
    // Optionally clear form data and documents
    // setFormData({ name: "", email: "", phone: "" });
    // setDocuments([]);
    setSubmitStatus('idle');
    setSubmitError(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Get Your Quote
          </CardTitle>
          {step === 1 && (
             <CardDescription className="text-center">
                Select the service you need a quote for.
             </CardDescription>
          )}
           {step === 2 && selectedService && (
             <CardDescription className="text-center">
                Requesting a quote for: <span className="font-semibold">{selectedService}</span>. Please provide your details.
             </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {submitStatus === 'success' ? (
            <div className="text-center py-8">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quote Request Submitted!</h3>
                <p className="text-muted-foreground">Thank you for your request. We will get back to you shortly.</p>
                <Button onClick={() => { setStep(1); setSelectedService(null); setSubmitStatus('idle'); setFormData({ name: "", email: "", phone: "" }); setDocuments([]); }} className="mt-6">
                    Request Another Quote
                </Button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="grid grid-cols-1 gap-4">
                  {(["Certified Translation", "Credential Evaluation", "Expert Opinion Letter"] as ServiceType[]).map((service) => (
                    <Button
                      key={service}
                      variant="outline"
                      className="w-full h-16 text-lg justify-center"
                      onClick={() => handleServiceSelect(service)}
                    >
                      {service}
                    </Button>
                  ))}
                </div>
              )}

              {step === 2 && selectedService && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Back Button */}
                   <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4 -ml-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
                   </Button>

                  {/* Form Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                     <Label>Upload Documents (Optional)</Label>
                     <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop files here, or click to browse
                        </p>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          disabled={isSubmitting}
                        />
                         <p className="text-xs text-muted-foreground mt-2">
                            Max 10MB per file. PDF, JPG, PNG, DOCX accepted.
                         </p>
                      </div>
                  </div>

                   {/* Display Uploaded Files */}
                   {documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                          >
                            <div className="flex items-center flex-grow mr-2 overflow-hidden">
                              <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                              <span className="truncate flex-grow" title={doc.name}>{doc.name}</span>
                              {doc.status === 'uploading' && <span className="ml-2 text-blue-500 text-xs flex-shrink-0">Uploading...</span>}
                              {doc.status === 'success' && <span className="ml-2 text-green-500 text-xs flex-shrink-0">Uploaded</span>}
                              {doc.status === 'error' && <span className="ml-2 text-red-500 text-xs flex-shrink-0" title={doc.error}>Error</span>}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 flex-shrink-0"
                              onClick={() => removeDocument(doc.id)}
                              disabled={doc.status === 'uploading' || isSubmitting}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Error */}
                  {submitError && (
                    <p className="text-red-500 text-sm">{submitError}</p>
                  )}

                  {/* Submit Button */}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Quote Request"}
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
        {/* Optional Footer */}
        {/* <CardFooter>
            <p className="text-xs text-muted-foreground">We'll respond within 1 business day.</p>
        </CardFooter> */}
      </Card>
    </div>
  );
};

export default QuotePage;
