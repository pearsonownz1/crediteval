export * from "./customer";
export * from "./services";
export * from "./documents";
export * from "./payment";

import { CustomerInfo } from "./customer"; // Explicitly import CustomerInfo
import { ServiceInfo } from "./services"; // Explicitly import ServiceInfo
import { PaymentInfo } from "./payment"; // Explicitly import PaymentInfo
import { DocumentState } from "./documents"; // Keep this explicit import

// Main order data interface
export interface OrderData {
  customerInfo: CustomerInfo;
  documents: DocumentState[];
  services: ServiceInfo;
  payment: PaymentInfo;
}

export interface OrderWizardProps {
  onComplete?: (orderData: any) => void;
  initialStep?: number;
}
// Temporary comment to trigger re-evaluation
