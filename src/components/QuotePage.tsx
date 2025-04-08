import React from "react";
import QuoteGenerator from "./QuoteGenerator";

const QuotePage = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary">
          Get Your Quote
        </h1>
        <QuoteGenerator onComplete={(quoteData) => console.log(quoteData)} />
      </div>
    </div>
  );
};

export default QuotePage;
