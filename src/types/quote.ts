import { Status } from "./common";

// Define the structure for the services JSON column
export interface ServicesJson {
  service_type: string | null;
  delivery?: string;
  urgency?: string;
  language_from?: string;
  language_to?: string;
  total_page?: string;
}

export interface Quote {
  id: string;
  name: string;
  email: string;
  service_type: string; // Keep this as per user feedback
  services: ServicesJson; // New field to store services as JSON
  price: number;
  status: Status;
  created_at: string;
  expires_at?: string;
  staff_id?: string;
  stripe_checkout_session_id?: string;
  document_paths?: string[] | null; // Add this line
}
