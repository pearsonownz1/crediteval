import React from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // Import Link
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

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
