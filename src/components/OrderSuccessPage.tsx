import React, { useEffect } from 'react'; // Import useEffect
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

// Define gtag function type for TypeScript (if not already globally defined)
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  // --- GA4 Purchase Event Tracking ---
  useEffect(() => {
    if (orderId && typeof window.gtag === 'function') {
      console.log(`Order Success: Found orderId ${orderId}, attempting to fetch details for GA4.`);

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-details-for-ga?orderId=${orderId}`;

      fetch(functionUrl, {
        method: 'GET', // Use GET as we are retrieving data based on query param
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, // Use anon key for gateway
          // No Authorization needed if function is set to no-verify-jwt
        },
      })
      .then(async response => {
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error(`Error fetching order details for GA4 (Order ID: ${orderId}). Status: ${response.status}`, errorBody);
          throw new Error(errorBody.error || `Failed to fetch order details: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("GA4 Data Received:", data);

        // Validate required fields before sending
        if (!data.transaction_id || !data.value || !data.currency || !data.items) {
            console.error("GA4 data from function is incomplete:", data);
            return; // Don't fire incomplete event
        }

        // Fire the GA4 purchase event
        window.gtag('event', 'purchase', {
          transaction_id: data.transaction_id,
          affiliation: data.affiliation || 'crediteval.com', // Use fetched or default
          value: data.value, // Already formatted as dollars/euros
          currency: data.currency, // Already formatted as uppercase
          items: data.items // Use the simplified items array from function
        });

        console.log("GA4 purchase event fired for order:", data.transaction_id);
      })
      .catch(error => {
        console.error('Error in GA4 purchase tracking fetch/process:', error);
        // Decide if you want to notify the user or just log the error
      });

    } else if (!orderId) {
        console.warn("Order Success Page: No orderId found in URL for GA4 tracking.");
    } else if (typeof window.gtag !== 'function') {
        console.warn("Order Success Page: gtag function not found. GA4 event not fired.");
    }
  }, [orderId]); // Re-run effect if orderId changes (shouldn't normally happen here)
  // --- End GA4 Tracking ---

  return (
    <div className="container mx-auto flex justify-center items-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4 text-primary">Order Confirmed!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Thank you for your purchase. Your order has been successfully placed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <p className="text-lg">
              Your Order ID is: <span className="font-semibold text-primary">{orderId}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation shortly with your order details.
            If you have any questions, please contact our support team.
          </p>
          <Button asChild>
            <Link to="/">Return to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccessPage;
