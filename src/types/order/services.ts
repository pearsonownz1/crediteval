export interface ServiceInfo {
  type: string;
  languageFrom: string;
  languageTo: string;
  pageCount: number;
  evaluationType: string;
  visaType: string;
  urgency: "standard" | "expedited" | "rush";
  specialInstructions: string;
  deliveryType: "email" | "express" | "international";
  shippingInfo: ShippingInfo;
}

export interface ShippingInfo {
  country: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
}
