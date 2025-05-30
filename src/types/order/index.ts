export * from "./customer";
export * from "./services";
export * from "./documents";
export * from "./payment";

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
