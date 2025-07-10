import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const QuotePaymentSuccessPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const quoteId = params.get("quoteId");

  useEffect(() => {
    // TODO: Add tracking for quote payment success
    if (quoteId) {
      console.log(`Quote payment successful for quoteId: ${quoteId}`);
    }
  }, [quoteId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your payment. Your quote has been successfully
          processed.
        </p>
        {quoteId && (
          <p className="text-sm text-gray-500 mb-6">Quote ID: {quoteId}</p>
        )}
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default QuotePaymentSuccessPage;
