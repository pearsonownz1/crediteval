import React from "react";
import { DialogWrapper } from "../../common/DialogWrapper";
import { formatStatus, formatServiceType } from "../../../utils/format";
import { Quote } from "../../../types/quote";

interface QuoteDetailsProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuoteDetails: React.FC<QuoteDetailsProps> = ({
  quote,
  open,
  onOpenChange,
}) => {
  if (!quote) return null;

  return (
    <DialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={`Quote Request Details - ID: ${quote.id}`}
      description={`Viewing details for quote requested by ${quote.name}.`}>
      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Client:
        </span>
        <span className="text-sm">{quote.name}</span>
      </div>

      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Email:
        </span>
        <span className="text-sm">{quote.email}</span>
      </div>

      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Service Type:
        </span>
        <span className="text-sm">{formatServiceType(quote.service_type)}</span>
      </div>

      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Price:
        </span>
        <span className="text-sm">${Number(quote.price || 0).toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Status:
        </span>
        <span className="text-sm">{formatStatus(quote.status)}</span>
      </div>

      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Created Date:
        </span>
        <span className="text-sm">
          {quote.created_at
            ? new Date(quote.created_at).toLocaleString()
            : "N/A"}
        </span>
      </div>

      {quote.expires_at && (
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Expires Date:
          </span>
          <span className="text-sm">
            {new Date(quote.expires_at).toLocaleString()}
          </span>
        </div>
      )}

      {quote.staff_id && (
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Staff ID:
          </span>
          <span className="text-sm">{quote.staff_id}</span>
        </div>
      )}

      {quote.stripe_checkout_session_id && (
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Stripe Session:
          </span>
          <span className="text-sm">{quote.stripe_checkout_session_id}</span>
        </div>
      )}

      <div className="grid grid-cols-[120px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Quote URL:
        </span>
        {quote.id ? (
          <a
            href={`${window.location.origin}/quote-payment/${quote.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline">
            {`${window.location.origin}/quote-payment/${quote.id}`}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">N/A</span>
        )}
      </div>
    </DialogWrapper>
  );
};
