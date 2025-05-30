export const STEP_TITLES = [
  "Your Info",
  "Service & Docs",
  "Delivery",
  "Review",
  "Payment",
] as const;

export const TOTAL_STEPS = STEP_TITLES.length;

// Step configuration without JSX
export const STEP_CONFIG = {
  titles: STEP_TITLES,
  totalSteps: TOTAL_STEPS,
} as const;
