import React, { useRef } from "react";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Upload, FileText } from "lucide-react";
import { DocumentState } from "../../../types/order/index";
import { supabase } from "../../../lib/supabaseClient";

interface DocumentUploadStepProps {
  documents: DocumentState[];
  updateDocuments: (
    updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])
  ) => void;
  orderId: string | null;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  documents = [],
  updateDocuments,
  orderId,
}) => {
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
        console.error("[updateDocumentStatusById] Document ID not found:", id);
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

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const newPath = data.path;
      updateDocumentStatusById(id, {
        status: "success",
        path: newPath,
        progress: 100,
      });

      // Update order documents
      try {
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
          console.error("Backend function error:", errorBody);
          throw new Error(
            errorBody.error ||
              `Function call failed with status ${response.status}`
          );
        }

        console.log(`Document path updated successfully for order ${orderId}`);
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
      console.error("Error uploading file:", uploadError);
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
        console.error("[removeDocument] Document ID not found:", id);
        return prevDocs;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-muted/50 hover:border-primary transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">
          Drag and drop your documents here
        </h3>
        <p className="text-sm text-muted-foreground mt-1">or</p>
        <div className="mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
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
