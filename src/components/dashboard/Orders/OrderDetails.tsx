import React from "react";
import { DialogWrapper } from "../../common/DialogWrapper";
import { DocumentLinks } from "../../common/DocumentLinks";
import { formatStatus, formatServiceType } from "../../../utils/format";
import { Order } from "../../../types/order-v1";

interface OrderDetailsProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  open,
  onOpenChange,
}) => {
  if (!order) return null;

  return (
    <DialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={`Order Details - ID: ${order.id}`}
      description={`Viewing details for order placed by ${order.first_name} ${order.last_name}.`}>
      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Client:
        </span>
        <span className="text-sm">
          {order.first_name} {order.last_name}
        </span>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Email:
        </span>
        <span className="text-sm">{order.email}</span>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Order Date:
        </span>
        <span className="text-sm">
          {order.created_at
            ? new Date(order.created_at).toLocaleString()
            : "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Status:
        </span>
        <span className="text-sm">{formatStatus(order.status)}</span>
      </div>

      <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          Total Price:
        </span>
        <span className="text-sm">
          {typeof order.total_amount === "number"
            ? `${(order.total_amount / 100).toFixed(2)}`
            : "N/A"}
        </span>
      </div>

      {/* Service Details Section */}
      <h4 className="font-medium mt-4 border-t pt-4">Service Details</h4>
      {order.services && typeof order.services === "object" ? (
        <div className="space-y-1 pl-2">
          <div className="grid grid-cols-[120px_1fr] items-start gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Type:
            </span>
            <span className="text-xs">
              {formatServiceType(order.services.type)}
            </span>
          </div>

          {/* Conditional details based on service type */}
          {order.services.type === "translation" && (
            <>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Language From:
                </span>
                <span className="text-xs">
                  {order.services.languageFrom || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Language To:
                </span>
                <span className="text-xs">
                  {order.services.languageTo || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Page Count:
                </span>
                <span className="text-xs">
                  {order.services.pageCount || "N/A"}
                </span>
              </div>
            </>
          )}

          {order.services.type === "evaluation" && (
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Evaluation Type:
              </span>
              <span className="text-xs">
                {formatServiceType(order.services.evaluationType)}
              </span>
            </div>
          )}

          {order.services.type === "expert" && (
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Visa Type:
              </span>
              <span className="text-xs">
                {order.services.visaType || "N/A"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-[120px_1fr] items-start gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Urgency:
            </span>
            <span className="text-xs">
              {formatStatus(order.services.urgency)}
            </span>
          </div>

          {order.services.specialInstructions && (
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Instructions:
              </span>
              <span className="text-xs whitespace-pre-wrap">
                {order.services.specialInstructions}
              </span>
            </div>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground pl-2">
          Service details not available.
        </span>
      )}

      <h4 className="font-medium mt-4 border-t pt-4">Documents</h4>
      <DocumentLinks docPaths={order.document_paths} />
    </DialogWrapper>
  );
};
