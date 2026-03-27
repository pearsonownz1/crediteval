import { Status } from "./common";
import { ServiceInfo } from "./order/services";

export type ServiceType = "translation" | "evaluation" | "expert";

export interface OrderService extends ServiceInfo {
  type: ServiceType;
}

export interface Order {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: Status;
  document_paths?: string[];
  total_amount: number | null;
  created_at: string;
  services?: OrderService;
  stripe_payment_intent_id?: string | null;
}
