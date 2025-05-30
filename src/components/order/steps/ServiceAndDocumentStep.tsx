import React from "react";
import { TooltipProvider } from "../../ui/tooltip";
import { ServiceSelectionStep } from "./ServiceSelectionStep";
import { DocumentUploadStep } from "./DocumentUploadStep";
import { ServiceInfo, DocumentState } from "../../../types/order/index"; // Corrected import path

interface ServiceAndDocumentStepProps {
  serviceData: ServiceInfo;
  updateServiceData: (data: Partial<ServiceInfo>) => void;
  documents: DocumentState[];
  updateDocuments: (
    updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])
  ) => void;
  orderId: string | null;
}

export const ServiceAndDocumentStep: React.FC<ServiceAndDocumentStepProps> = ({
  serviceData,
  updateServiceData,
  documents,
  updateDocuments,
  orderId,
}) => {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        <ServiceSelectionStep
          data={serviceData}
          updateData={updateServiceData}
        />

        <hr className="my-6" />

        <DocumentUploadStep
          documents={documents}
          updateDocuments={updateDocuments}
          orderId={orderId}
        />
      </div>
    </TooltipProvider>
  );
};
