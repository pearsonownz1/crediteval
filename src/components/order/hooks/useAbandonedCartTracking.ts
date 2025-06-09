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
}

export const useAbandonedCartTracking = (
  orderData: OrderData,
  config: AbandonedCartConfig = { delay: 10000, enabled: true } // 10 seconds for testing
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(uuidv4());
  const emailSentRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(true);

  // Function to send abandoned cart email
  const sendAbandonedCartEmail = useCallback(async () => {
    // Don't send if email already sent for this session
    if (emailSentRef.current) {
      console.log("Abandoned cart email already sent for this session");
      return;
    }

    // Don't send if no email provided
    if (!orderData.customerInfo?.email) {
      console.log("No email provided, skipping abandoned cart email");
      return;
    }

    // Don't send if user hasn't filled any meaningful data
    const hasMinimalData =
      orderData.customerInfo.firstName ||
      orderData.customerInfo.lastName ||
      orderData.services?.selectedService;

    if (!hasMinimalData) {
      console.log("Insufficient data to send abandoned cart email");
      return;
    }

    try {
      console.log("Sending abandoned cart email...");

      // const response = await fetch("/api/send-abandoned-cart-email", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     orderData,
      //     sessionId: sessionIdRef.current,
      //   }),
      // });

      const response = await supabase.functions.invoke(
        "send-abandoned-cart-email",
        {
          body: {
            orderData,
            sessionId: sessionIdRef.current,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Abandoned cart email sent successfully:", result);
        emailSentRef.current = true;
      } else {
        console.error("Failed to send abandoned cart email:", result);
      }
    } catch (error) {
      console.error("Error sending abandoned cart email:", error);
    }
  }, [orderData]);

  // Reset timeout when user activity is detected
  const resetTimeout = useCallback(() => {
    if (!config.enabled || !isActiveRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      sendAbandonedCartEmail();
    }, config.delay);
  }, [config.delay, config.enabled, sendAbandonedCartEmail]);

  // Function to mark as active (user returned to page)
  const markAsActive = useCallback(() => {
    isActiveRef.current = true;
    emailSentRef.current = false; // Reset email sent flag when user returns
    sessionIdRef.current = uuidv4(); // Generate new session ID
    resetTimeout();
  }, [resetTimeout]);

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
      resetTimeout();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        console.log("Page hidden, starting abandoned cart timer");
        resetTimeout();
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
      resetTimeout();
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
    resetTimeout();

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
  }, [config.enabled, resetTimeout]);

  // Reset timeout when order data changes (user is actively filling form)
  useEffect(() => {
    resetTimeout();
  }, [orderData, resetTimeout]);

  return {
    markAsActive,
    stopTracking,
    sessionId: sessionIdRef.current,
    isEmailSent: emailSentRef.current,
  };
};
