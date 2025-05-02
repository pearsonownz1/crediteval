import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { usePostHog } from 'posthog-js/react'; // Import usePostHog
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';

// Log the key being used for initialization
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
console.log("Stripe Publishable Key used:", stripePublishableKey ? `${stripePublishableKey.substring(0, 6)}...` : 'MISSING!'); // Log prefix only

// Ensure your Stripe publishable key is in environment variables
const stripePromise = loadStripe(stripePublishableKey);

type Quote = Database['public']['Tables']['quotes']['Row'];

export function QuotePaymentPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const posthog = usePostHog(); // Get PostHog instance
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) {
        setError('Invalid quote link.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') { // PostgREST error code for "Not found"
             setError('Quote not found. Please check the link or request a new quote.');
          } else {
            throw fetchError;
          }
        } else if (!data) {
           setError('Quote not found. Please check the link or request a new quote.');
        } else {
          // Validate quote status
          if (data.status === 'Paid') {
            setError('This quote has already been paid.');
            // Optional: Redirect to a success/confirmation page?
            // navigate('/order-success'); // Example redirect
          } else if (data.status === 'Expired' || (data.expires_at && new Date(data.expires_at) < new Date())) {
             setError('This quote has expired. Please request a new quote.');
             // Optionally update status if expired but not marked yet
             if (data.status !== 'Expired') {
                await supabase.from('quotes').update({ status: 'Expired' }).eq('id', quoteId);
             }
          } else if (data.status !== 'Pending') {
             setError(`This quote cannot be paid (status: ${data.status}). Please contact support.`);
          } else {
            // Quote is valid and pending, capture checkout started event
            setQuote(data);
            if (posthog && data.id && data.price) {
              posthog.capture('checkout_started', {
                quote_id: data.id,
                amount: data.price,
                service_type: data.service_type, // Add service type for context
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching quote:', err);
        setError(err.message || 'Failed to load quote details.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId, navigate]);

  const handlePayment = async () => {
    if (!quote || !quote.price || !quote.email || !quote.id) { // Changed client_email to email
        setError('Cannot proceed with payment. Quote details are missing.');
        return;
    }

    setIsProcessingPayment(true);
    setError(null);

    try {
        // 1. Call your backend function to create a Stripe Checkout Session
        const { data: sessionData, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
            body: {
                amount: quote.price * 100, // Stripe expects amount in cents
                currency: 'usd',
                customerEmail: quote.email, // Changed client_email to email
                metadata: { // Pass quote ID to link payment back
                    quote_id: quote.id,
                    name: quote.name, // Changed from client_name
                    service_type: quote.service_type,
                },
                // Add success/cancel URLs relative to your frontend app
                successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&quote_id=${quote.id}`,
                cancelUrl: window.location.href, // Return to this page on cancel
            },
        });

        if (functionError) {
            console.error("Supabase function invocation error:", functionError);
            throw functionError;
        }

        // Log the raw response data from the function
        console.log("Received sessionData from function:", sessionData);

        const { sessionId } = sessionData;
        console.log("Extracted sessionId:", sessionId); // Log the extracted ID

        if (!sessionId || typeof sessionId !== 'string') { // Add type check
             console.error("Invalid or missing sessionId received:", sessionId);
             throw new Error('Failed to get valid Stripe Checkout session ID from function.');
        }

        // 2. Redirect to Stripe Checkout
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe.js failed to load.');

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

        if (stripeError) {
            console.error('Stripe redirect error:', stripeError);
            setError(`Payment failed: ${stripeError.message}`);
        }
        // If redirect is successful, the user won't see the code below this point

    } catch (paymentError: any) {
        console.error('Payment processing error:', paymentError);
        setError(`Failed to initiate payment: ${paymentError.message}`);
    } finally {
        setIsProcessingPayment(false);
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading quote details...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Pay Your Quote</CardTitle>
          <CardDescription>Review your quote details and proceed to payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
             <Alert variant="destructive">
               <Terminal className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}
          {quote && !error && (
            <div className="space-y-2">
              <p><strong>Quote ID:</strong> {quote.id.substring(0, 8)}...</p>
              <p><strong>Client:</strong> {quote.name}</p> {/* Changed from client_name */}
              <p><strong>Email:</strong> {quote.email}</p> {/* Changed client_email to email */}
              <p><strong>Service:</strong> {quote.service_type}</p>
              <p className="text-lg font-semibold"><strong>Total Price:</strong> ${Number(quote.price).toFixed(2)}</p>
              {quote.expires_at && <p className="text-sm text-muted-foreground">Expires on: {new Date(quote.expires_at).toLocaleDateString()}</p>}
            </div>
          )}
        </CardContent>
        {!error && quote && (
          <CardFooter>
            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={isProcessingPayment || loading}
            >
              {isProcessingPayment ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
