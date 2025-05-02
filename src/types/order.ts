// Define the document type explicitly for clarity
export type DocumentState = {
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

// Define the main OrderData interface
export interface OrderData {
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string; // Added phone number
  };
  documents: DocumentState[];
  services: {
    type: string; // Consider using a specific type like ServiceType if defined elsewhere
    languageFrom: string;
    languageTo: string;
    pageCount: number;
    evaluationType: string; // Consider EvaluationType
    visaType: string;
    urgency: string; // Consider UrgencyType
    specialInstructions: string;
  };
  payment: {
    method: string;
  };
}
