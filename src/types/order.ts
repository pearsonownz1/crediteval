import { Status } from "./common";

export type ServiceType = "translation" | "evaluation" | "expert";

export interface OrderService {
  type: ServiceType;
  urgency?: string;
  specialInstructions?: string;
  // Translation specific fields
  languageFrom?: string;
  languageTo?: string;
  pageCount?: number;
  // Evaluation specific fields
  evaluationType?: string;
  // Expert specific fields
  visaType?: string;
}

export interface Order {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: Status;
  document_paths?: string[];
  total_amount: number;
  created_at: string;
  services?: OrderService;
}
