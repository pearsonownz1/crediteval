import React, { useState, useEffect } from 'react'; // Import useEffect
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext'; // Use the exported hook
import { usePostHog } from 'posthog-js/react'; // Import usePostHog
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast'; // Assuming you use Shadcn toast
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

// Ensure Database['public']['Tables']['quotes'] exists and is correct in supabase.ts
type QuoteInsert = Database['public']['Tables']['quotes']['Insert'];

// Define service types - adjust as needed
const serviceTypes = [
  'Certified Translation',
  'Credential Evaluation',
  'Expert Opinion Letter',
  // Add other services here
];
export function CreateQuoteForm() {
  const { user } = useAuth(); // Use the hook here
  const { toast } = useToast();
  const posthog = usePostHog(); // Get PostHog instance
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdQuoteLink, setCreatedQuoteLink] = useState<string | null>(null);

  const validateForm = () => {
    if (!clientName.trim()) return 'Client Full Name is required.';
    if (!clientEmail.trim()) return 'Client Email Address is required.';
    if (!/\S+@\S+\.\S+/.test(clientEmail)) return 'Please enter a valid email address.';
    if (!serviceType) return 'Service Type is required.';
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) return 'Price must be a positive number.';
    return null; // No errors
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setCreatedQuoteLink(null);

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!user) {
        toast({
            title: 'Error',
            description: 'You must be logged in to create a quote.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    const quoteData: QuoteInsert = {
      name: clientName.trim(), // Changed from client_name
      email: clientEmail.trim(), // <--- Changed to email
      service_type: serviceType,
      price: parseFloat(price),
      staff_id: user.id, // Assign the logged-in staff member's ID
      status: 'Pending',
      // expires_at: // Optional: Set expiration logic if needed
    };

    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single(); // Select the created quote to get its ID

      if (error) throw error;

      if (data) {
        const quoteId = data.id;
        const quotePrice = parseFloat(price); // Get price for event

        // Capture PostHog event for quote creation
        if (posthog) {
          posthog.capture('quote_created', {
            quote_id: quoteId,
            service_type: serviceType,
            price: quotePrice,
            client_email: clientEmail.trim(), // Add email for potential identification
          });
        }

        const quoteLink = `${window.location.origin}/quote/${quoteId}`; // Generate link
        setCreatedQuoteLink(quoteLink);

        // Trigger the email sending function
        try {
          console.log('Invoking send-quote-email function with data:', data);
          const { error: functionError } = await supabase.functions.invoke('send-quote-email', {
            body: data, // Pass the created quote data to the function
          });

          if (functionError) {
            throw new Error(`Failed to send quote email: ${functionError.message}`);
          }

          toast({
            title: 'Quote Created & Email Sent!',
            description: `An email has been sent to ${clientEmail}.`,
          });

        } catch (emailError: any) {
           console.error('Error sending quote email:', emailError);
           // Notify user that quote was created but email failed
           toast({
             title: 'Quote Created (Email Failed)',
             description: `Quote saved, but failed to send email: ${emailError.message}. Link: ${quoteLink}`,
             variant: 'destructive', // Changed from 'warning' as it might not be supported
             duration: 9000, // Keep message longer
           });
        }

        // Reset form? Consider if this is desired UX
        // setClientName('');
        // setClientEmail('');
        // setServiceType('');
        // setPrice('');
      } else {
         throw new Error('Quote created but no data returned.');
      }

    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({
        title: 'Error Creating Quote',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (createdQuoteLink) {
      navigator.clipboard.writeText(createdQuoteLink)
        .then(() => {
          toast({ title: 'Link Copied!', description: 'Quote link copied to clipboard.' });
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast({ title: 'Copy Failed', description: 'Could not copy link to clipboard.', variant: 'destructive' });
        });
    }
  };

  // Correctly structured return statement after removing duplicate function
  return (
    <Card className="w-full max-w-lg mx-auto my-8">
      <CardHeader>
        <CardTitle>Create Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client Full Name</Label>
            <Input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="clientEmail">Client Email Address</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="serviceType">Service Type</Label>
            <Select
              value={serviceType}
              onValueChange={setServiceType}
              required
              disabled={isLoading}
            >
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={isLoading}
              placeholder="e.g., 250.00"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Quote'}
          </Button>
        </form>
      </CardContent>
      {createdQuoteLink && (
        <CardFooter className="flex flex-col items-start space-y-2">
           <p className="text-sm text-green-600">Quote created successfully!</p>
           <div className="flex items-center space-x-2 w-full">
             <Input type="text" value={createdQuoteLink} readOnly className="flex-grow" />
             <Button onClick={handleCopyLink} variant="outline" size="sm">Copy Link</Button>
           </div>
           <p className="text-sm text-muted-foreground">An email has been sent to {clientEmail} with the quote details.</p>
        </CardFooter>
      )}
    </Card>
  );
}
