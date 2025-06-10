import { useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabaseClient";

interface AbandonedCartConfig {
  delay: number; // in milliseconds
  enabled: boolean;
}

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
  orderId?: string; // Add orderId to OrderData type
}

export const useAbandonedCartTracking = (
  orderData: OrderData,
  config: AbandonedCartConfig = { delay: 3600000, enabled: true } // 1 hour (3,600,000 ms)
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(uuidv4());
  const emailSentRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(true);

  // Function to send abandoned cart email
  const sendAbandonedCartEmail = useCallback(
    async (currentOrderData: OrderData) => {
      // Don't send if email already sent for this session
      if (emailSentRef.current) {
        console.log("Abandoned cart email already sent for this session");
        return;
      }

      // Don't send if no email provided
      if (!currentOrderData.customerInfo?.email) {
        console.log("No email provided, skipping abandoned cart email");
        return;
      }

      // Don't send if user hasn't filled any meaningful data
      const hasMinimalData =
        currentOrderData.customerInfo.firstName ||
        currentOrderData.customerInfo.lastName ||
        currentOrderData.services?.selectedService;

      if (!hasMinimalData) {
        console.log("Insufficient data to send abandoned cart email");
        return;
      }

      try {
        console.log("Sending abandoned cart email...");

        const { data, error } = await supabase.functions.invoke(
          "send-abandoned-cart-email",
          {
            body: {
              orderData: currentOrderData, // Use the passed argument
              sessionId: sessionIdRef.current,
            },
          }
        );

        if (!error) {
          console.log("Abandoned cart email sent successfully:", data);
          emailSentRef.current = true;
        } else {
          console.error("Failed to send abandoned cart email:", error);
        }
      } catch (error) {
        console.error("Error sending abandoned cart email:", error);
      }
    },
    []
  ); // Removed orderData from dependencies

  // Reset timeout when user activity is detected
  const resetTimeout = useCallback(
    (currentOrderData: OrderData) => {
      if (!config.enabled || !isActiveRef.current) return;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        sendAbandonedCartEmail(currentOrderData); // Pass orderData here
      }, config.delay);
    },
    [config.delay, config.enabled]
  ); // Removed sendAbandonedCartEmail from dependencies

  // Function to mark as active (user returned to page)
  const markAsActive = useCallback((currentOrderData: OrderData) => {
    isActiveRef.current = true;
    emailSentRef.current = false; // Reset email sent flag when user returns
    sessionIdRef.current = uuidv4(); // Generate new session ID
    resetTimeout(currentOrderData); // Pass orderData here
  }, []); // Removed resetTimeout from dependencies

  // Function to stop tracking (user completed order or left permanently)
  const stopTracking = useCallback(() => {
    isActiveRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set up event listeners for user activity
  useEffect(() => {
    if (!config.enabled) return;

    const handleActivity = () => {
      resetTimeout(orderData); // Pass orderData
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        console.log("Page hidden, starting abandoned cart timer");
        resetTimeout(orderData); // Pass orderData
      } else {
        // User returned to tab
        console.log("Page visible, resetting abandoned cart timer");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    const handleBeforeUnload = () => {
      // User is leaving the page
      resetTimeout(orderData); // Pass orderData
    };

    // Activity events
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Page visibility
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Page unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Initial timeout setup
    resetTimeout(orderData); // Pass orderData

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config.enabled, resetTimeout, orderData]); // Add orderData to dependencies for handleActivity, etc.

  return {
    markAsActive,
    stopTracking,
    sessionId: sessionIdRef.current,
    isEmailSent: emailSentRef.current,
  };
};
