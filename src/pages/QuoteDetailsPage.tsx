import React from "react";
import { useParams } from "react-router-dom";
import { QuoteDetails } from "../components/dashboard/Quotes/QuoteDetails";

export const QuoteDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Error: Quote ID not provided.</div>;
  }

  return (
    <div className="p-6">
      <QuoteDetails />
    </div>
  );
};
