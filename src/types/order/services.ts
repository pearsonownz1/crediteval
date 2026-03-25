export type ServiceType = "translation" | "evaluation" | "expert";
export type TranslationPreviewStatus = "not_ready" | "ready" | "viewed";
export type TranslationUnlockStatus =
  | "not_available"
  | "available"
  | "checkout_started"
  | "paid";
export type TranslationTranslatorStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "completed";
export type DeliveryConfirmationStatus = "pending" | "confirmed";

export interface ServiceInfo {
  type?: ServiceType; // Made optional
  languageFrom?: string; // Made optional
  languageTo?: string; // Made optional
  pageCount?: number; // Made optional
  evaluationType?: string; // Made optional
  visaType?: string; // Made optional
  urgency?: "standard" | "expedited" | "rush"; // Made optional
  notarizationRequested?: boolean;
  specialInstructions?: string; // Made optional
  deliveryType?: "email" | "express" | "international"; // Made optional
  shippingInfo?: ShippingInfo; // Made optional
  previewStatus?: TranslationPreviewStatus;
  unlockStatus?: TranslationUnlockStatus;
  translatorStatus?: TranslationTranslatorStatus;
  deliveryConfirmationStatus?: DeliveryConfirmationStatus;
  quotedUnlockAmount?: number;
  previewFilePath?: string;
  finalFilePath?: string;
  translatorName?: string;
  internalNotes?: string;
  previewReadyAt?: string;
  finalReadyAt?: string;
  previewSentAt?: string;
  deliveredAt?: string;
  deliveryConfirmedAt?: string;
  paidAt?: string;
}

export interface ShippingInfo {
  country: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
}
