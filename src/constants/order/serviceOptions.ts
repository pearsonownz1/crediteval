export const SERVICE_TYPES = [
  { value: "translation", label: "Certified Translation" },
  { value: "evaluation", label: "Credential Evaluation" },
  { value: "expert", label: "Expert Opinion Letter ($599)" },
] as const;

export const LANGUAGES = [
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "chinese", label: "Chinese" },
  { value: "arabic", label: "Arabic" },
  { value: "portuguese", label: "Portuguese" },
  { value: "russian", label: "Russian" },
  { value: "japanese", label: "Japanese" },
  { value: "english", label: "English" },
] as const;

export const VISA_TYPES = [
  { value: "H-1B", label: "H-1B (Specialty Occupation)" },
  { value: "O-1", label: "O-1 (Extraordinary Ability)" },
  { value: "L-1", label: "L-1 (Intracompany Transferee)" },
  { value: "E-2", label: "E-2 (Treaty Investor)" },
  { value: "EB-1", label: "EB-1 (Priority Worker)" },
  { value: "EB-2 NIW", label: "EB-2 NIW (National Interest Waiver)" },
  { value: "TN", label: "TN (NAFTA Professionals)" },
  { value: "F-1 OPT/STEM", label: "F-1 OPT/STEM Extension" },
  { value: "Other", label: "Other (Specify in Instructions)" },
] as const;

export const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard (7-10 business days)" },
  { value: "expedited", label: "Expedited (3-5 business days)" },
  { value: "rush", label: "Rush (1-2 business days)" },
] as const;

export const DELIVERY_OPTIONS = [
  {
    value: "email",
    label: "Email Copy (Accessible Online 24/7 Free Mailed Copy)",
  },
  { value: "express", label: "Express Mail with Tracking ($99.00 fee)" },
  {
    value: "international",
    label: "International Delivery Outside US ($150.00 fee)",
  },
] as const;
