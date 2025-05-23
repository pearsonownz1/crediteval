import { Status } from "./common";

export interface Quote {
  id: string;
  name: string;
  email: string;
  service_type: string;
  price: number;
  status: Status;
  created_at: string;
  expires_at?: string;
  staff_id?: string;
  stripe_checkout_session_id?: string;
}
