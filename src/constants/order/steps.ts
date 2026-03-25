const DEFAULT_STEP_TITLES = [
  "Your Info",
  "Service & Docs",
  "Delivery",
  "Review",
  "Payment",
] as const;

const TRANSLATION_STEP_TITLES = [
  "Your Info",
  "Service & Docs",
  "Delivery",
  "Review",
] as const;

export const getStepTitles = (serviceType?: string) =>
  serviceType === "translation" ? TRANSLATION_STEP_TITLES : DEFAULT_STEP_TITLES;

export const STEP_TITLES = DEFAULT_STEP_TITLES;
export const TOTAL_STEPS = DEFAULT_STEP_TITLES.length;

// Step configuration without JSX
export const STEP_CONFIG = {
  titles: STEP_TITLES,
  totalSteps: TOTAL_STEPS,
} as const;
