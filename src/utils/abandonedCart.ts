// utils/abandonedCart.ts

interface OrderData {
  customerInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  services?: {
    selectedService?: string;
    urgency?: string;
    deliveryMethod?: string;
  };
  currentStep?: number;
}

interface AbandonedCartEmailResponse {
  success: boolean;
  message: string;
  resumeUrl?: string;
  error?: string;
}

/**
 * Sends an abandoned cart email to the customer
 * @param orderData - Current order form data
 * @param sessionId - Unique session identifier
 * @returns Promise with response data
 */
export const sendAbandonedCartEmail = async (
  orderData: OrderData,
  sessionId: string
): Promise<AbandonedCartEmailResponse> => {
  try {
    const response = await fetch("/api/v1/send-abandoned-cart-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderData,
        sessionId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to send abandoned cart email");
    }

    return result;
  } catch (error) {
    console.error("Error sending abandoned cart email:", error);
    throw error;
  }
};

/**
 * Parses URL parameters to pre-fill order form data
 * @param searchParams - URLSearchParams object
 * @returns Parsed order data
 */
export const parseResumeUrlParams = (
  searchParams: URLSearchParams
): Partial<OrderData> => {
  const orderData: Partial<OrderData> = {
    customerInfo: {},
    services: {},
  };

  // Parse customer info
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");
  const company = searchParams.get("company");

  if (firstName || lastName || email || phone || company) {
    orderData.customerInfo = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(company && { company }),
    };
  }

  // Parse service info
  const service = searchParams.get("service");
  const urgency = searchParams.get("urgency");
  const delivery = searchParams.get("delivery");

  if (service || urgency || delivery) {
    orderData.services = {
      ...(service && { selectedService: service }),
      ...(urgency && { urgency }),
      ...(delivery && { deliveryMethod: delivery }),
    };
  }

  // Parse current step
  const stepParam = searchParams.get("step");
  if (stepParam) {
    const step = parseInt(stepParam, 10);
    if (!isNaN(step)) {
      orderData.currentStep = step;
    }
  }

  return orderData;
};

/**
 * Creates a resume URL with order data as query parameters
 * @param orderData - Order data to encode in URL
 * @param baseUrl - Base URL (defaults to current origin)
 * @returns Complete resume URL
 */
export const createResumeUrl = (
  orderData: OrderData,
  baseUrl?: string
): string => {
  const params = new URLSearchParams();

  // Add customer info
  if (orderData.customerInfo) {
    if (orderData.customerInfo.firstName)
      params.append("firstName", orderData.customerInfo.firstName);
    if (orderData.customerInfo.lastName)
      params.append("lastName", orderData.customerInfo.lastName);
    if (orderData.customerInfo.email)
      params.append("email", orderData.customerInfo.email);
    if (orderData.customerInfo.phone)
      params.append("phone", orderData.customerInfo.phone);
    if (orderData.customerInfo.company)
      params.append("company", orderData.customerInfo.company);
  }

  // Add service selection
  if (orderData.services) {
    if (orderData.services.selectedService)
      params.append("service", orderData.services.selectedService);
    if (orderData.services.urgency)
      params.append("urgency", orderData.services.urgency);
    if (orderData.services.deliveryMethod)
      params.append("delivery", orderData.services.deliveryMethod);
  }

  // Add current step
  if (orderData.currentStep !== undefined)
    params.append("step", orderData.currentStep.toString());

  const base =
    baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/order-wizard?${params.toString()}`;
};

/**
 * Validates if order data has sufficient information to send abandoned cart email
 * @param orderData - Order data to validate
 * @returns True if sufficient data exists
 */
export const hasMinimalDataForEmail = (orderData: OrderData): boolean => {
  // Must have email
  if (!orderData.customerInfo?.email) {
    return false;
  }

  // Must have at least one meaningful field filled
  const hasCustomerData =
    orderData.customerInfo.firstName ||
    orderData.customerInfo.lastName ||
    orderData.customerInfo.phone ||
    orderData.customerInfo.company;

  const hasServiceData =
    orderData.services?.selectedService ||
    orderData.services?.urgency ||
    orderData.services?.deliveryMethod;

  return hasCustomerData || hasServiceData;
};

/**
 * Generates a unique session ID
 * @returns Unique session identifier
 */
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function to prevent excessive API calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
