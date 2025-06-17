import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { formatStatus, formatServiceType } from "../../../utils/format";
import { Quote } from "../../../types/quote";
import { supabase } from "../../../lib/supabaseClient";
import { Button } from "@/components/ui/button"; // Import Button
import { Input } from "@/components/ui/input"; // Import Input
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import { DocumentLinks } from "@/components/common/DocumentLinks"; // Import DocumentLinks

export const QuoteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState<boolean>(false);
  const [editablePrice, setEditablePrice] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false); // New state for email sending
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError("Quote ID is missing.");
        setLoading(false);
        return;
      }
      console.log("Fetching quote with ID:", id); // Add log here
      try {
        const { data, error } = await supabase
          .from("quotes")
          .select("*, document_paths") // Select document_paths
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

  const handleEditPrice = () => {
    setIsEditingPrice(true);
    setEditablePrice(quote.price?.toString() || "0.00");
  };

  const handleSavePrice = async () => {
    if (!id) {
      alert("Quote ID is missing. Cannot save price.");
      return;
    }

    let priceToSave: number | null = null;
    if (editablePrice !== "") {
      const parsedPrice = parseFloat(editablePrice);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        priceToSave = parsedPrice;
      } else {
        alert(
          "Please enter a valid non-negative number for the price, or leave it empty."
        );
        return;
      }
    }

    setLoading(true);
    console.log(
      "Attempting to save price for ID:",
      id,
      "Price to save:",
      priceToSave
    );
    try {
      const { data, error } = await supabase
        .from("quotes")
        .update({ price: priceToSave }) // Use priceToSave
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setQuote(data[0]);
        setIsEditingPrice(false);
        alert("Price updated successfully!");
      } else {
        setError(
          "No quote found with the provided ID to update. (This might happen if the ID is invalid or the row was deleted)"
        );
        alert(
          "Error: No quote found with the provided ID to update. Please check the console for more details."
        );
        console.error("Supabase update returned no data for ID:", id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update price.");
      alert(`Error updating price: ${err.message}`);
      console.error("Error during Supabase update:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClient = async () => {
    if (!quote?.id || !quote?.email || !quote?.name) {
      toast({
        title: "Error",
        description: "Missing quote details to send email.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const quotePaymentUrl = `${window.location.origin}/quote-payment/${quote.id}`;

      const { data, error } = await supabase.functions.invoke(
        "send-quote-payment-link-email",
        {
          body: JSON.stringify({
            quoteId: quote.id,
            clientEmail: quote.email,
            clientName: quote.name,
            quotePaymentUrl: quotePaymentUrl,
          }),
        }
      );

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Quote payment link email sent successfully!",
        });
      } else {
        throw new Error(data.message || "Failed to send email.");
      }
    } catch (err: any) {
      console.error("Error sending quote payment link email:", err);
      toast({
        title: "Error",
        description: `Failed to send email: ${err.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

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
            Price:
          </span>
          {isEditingPrice ? (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={editablePrice}
                onChange={(e) => setEditablePrice(e.target.value)}
                className="w-32"
                step="0.01"
              />
              <Button onClick={handleSavePrice} size="sm">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingPrice(false)}
                size="sm">
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-base">
                ${Number(quote.price || 0).toFixed(2)}
              </span>
              <Button onClick={handleEditPrice} size="sm" variant="outline">
                Edit
              </Button>
              {quote.price && quote.price > 0 && (
                <Button
                  onClick={handleEmailClient}
                  size="sm"
                  disabled={isSendingEmail}>
                  {isSendingEmail ? "Sending..." : "Email Client"}
                </Button>
              )}
            </div>
          )}
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

        {/* Display new fields from services JSON */}
        {quote.services?.delivery && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Delivery:
            </span>
            <span className="text-base">{quote.services.delivery}</span>
          </div>
        )}

        {quote.services?.urgency && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Urgency:
            </span>
            <span className="text-base">{quote.services.urgency}</span>
          </div>
        )}

        {quote.service_type === "Certified Translation" && (
          <>
            {quote.services?.language_from && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Language From:
                </span>
                <span className="text-base">
                  {quote.services.language_from}
                </span>
              </div>
            )}
            {quote.services?.language_to && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Language To:
                </span>
                <span className="text-base">{quote.services.language_to}</span>
              </div>
            )}
            {quote.services?.total_page && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Page:
                </span>
                <span className="text-base">{quote.services.total_page}</span>
              </div>
            )}
          </>
        )}

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

        {/* New section for uploaded documents */}
        <div className="flex flex-col md:col-span-2">
          <span className="text-sm font-medium text-muted-foreground">
            Uploaded Documents:
          </span>
          <DocumentLinks docPaths={quote.document_paths} />
        </div>
      </div>
    </div>
  );
};
