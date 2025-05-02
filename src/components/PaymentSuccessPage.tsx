import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Optional: if you need to fetch quote/order details

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const quoteId = searchParams.get('quote_id');
  const [message, setMessage] = useState('Processing your payment confirmation...');

  // Optional: Fetch details or confirm status based on session_id/quote_id
  useEffect(() => {
    // Example: You might want to verify the session status with your backend/webhook
    // or fetch the quote details to display confirmation.
    // For now, just display a generic success message.
    if (sessionId && quoteId) {
      setMessage(`Your payment for Quote ${quoteId.substring(0, 8)}... was successful! Thank you.`);
      // TODO: Consider verifying payment status with backend/webhook before confirming to user.
      // Example: Mark quote as paid (though webhook is preferred)
      // supabase.from('quotes').update({ status: 'Paid' }).eq('id', quoteId).then(...)
    } else {
      setMessage('Payment successful! Thank you.'); // Fallback message
    }
  }, [sessionId, quoteId]);

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 flex justify-center items-center min-h-screen">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>Your quote payment has been processed.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">{message}</p>
          <Link to="/" className="text-primary hover:underline">
            Return to Homepage
          </Link>
          {/* Optionally link to a user dashboard if applicable */}
          {/* <Link to="/dashboard" className="ml-4 text-primary hover:underline">Go to Dashboard</Link> */}
        </CardContent>
      </Card>
    </div>
  );
}
