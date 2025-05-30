export interface ServiceInfo {
  type?: string; // Made optional
  languageFrom?: string; // Made optional
  languageTo?: string; // Made optional
  pageCount?: number; // Made optional
  evaluationType?: string; // Made optional
  visaType?: string; // Made optional
  urgency?: "standard" | "expedited" | "rush"; // Made optional
  specialInstructions?: string; // Made optional
  deliveryType?: "email" | "express" | "international"; // Made optional
  shippingInfo?: ShippingInfo; // Made optional
}

export interface ShippingInfo {
  country: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
}
