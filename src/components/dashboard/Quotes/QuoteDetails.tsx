import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { formatStatus, formatServiceType } from "../../../utils/format";
import { Quote } from "../../../types/quote";
import { supabase } from "../../../lib/supabaseClient";

export const QuoteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError("Quote ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        setQuote(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch quote details.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Loading quote details...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  if (!quote) {
    return <div className="p-6 text-center">No quote found.</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6">
        Quote Request Details - ID: {quote.id?.substring(0, 8)}...
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Client:
          </span>
          <span className="text-base font-semibold">{quote.name}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Email:
          </span>
          <span className="text-base">{quote.email}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Service Type:
          </span>
          <span className="text-base">
            {formatServiceType(quote.service_type)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Price:
          </span>
          <span className="text-base">
            ${Number(quote.price || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Status:
          </span>
          <span className="text-base">{formatStatus(quote.status)}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Created Date:
          </span>
          <span className="text-base">
            {quote.created_at
              ? new Date(quote.created_at).toLocaleString()
              : "N/A"}
          </span>
        </div>

        {quote.expires_at && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Expires Date:
            </span>
            <span className="text-base">
              {new Date(quote.expires_at).toLocaleString()}
            </span>
          </div>
        )}

        {quote.staff_id && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Staff ID:
            </span>
            <span className="text-base">{quote.staff_id}</span>
          </div>
        )}

        {quote.stripe_checkout_session_id && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Stripe Session:
            </span>
            <span className="text-base">
              {quote.stripe_checkout_session_id}
            </span>
          </div>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Quote URL:
          </span>
          {quote.id ? (
            <a
              href={`${window.location.origin}/quote-payment/${quote.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-blue-600 hover:underline">
              {`${window.location.origin}/quote-payment/${quote.id}`}
            </a>
          ) : (
            <span className="text-base text-muted-foreground">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
};
