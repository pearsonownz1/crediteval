import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';

const ContactSuccessPage = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Thank you for contacting us. We have received your inquiry and will get back to you as soon as possible.
      </p>
      <Button asChild>
        <Link to="/">Return to Homepage</Link>
      </Button>
    </div>
  );
};

export default ContactSuccessPage;
