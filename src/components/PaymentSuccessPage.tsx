import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const quoteId = searchParams.get('quote_id');
  const [message, setMessage] = useState('Processing your payment confirmation...');

  useEffect(() => {
    if (sessionId && quoteId) {
      setMessage(`Your payment for Quote ${quoteId.substring(0, 8)}... was successful! Thank you.`);
    } else {
      setMessage('Payment successful! Thank you.');
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
        </CardContent>
      </Card>
    </div>
  );
}
