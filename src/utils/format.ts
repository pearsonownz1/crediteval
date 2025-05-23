import { Status } from "../types/common";

export const formatServiceType = (type: string | undefined | null): string => {
  if (!type) return "N/A";
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const formatStatus = (status: string | undefined | null): string => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const formatPrice = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "N/A";
  return `$${(amount / 100).toFixed(2)}`;
};

export const getStatusColor = (status: Status | string | null): string => {
  if (!status) return "bg-gray-100 text-gray-800";

  switch (status.toLowerCase()) {
    case "pending":
    case "pending_payment":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
    case "rejected":
      return "bg-red-100 text-red-800";
    case "quote_sent":
      return "bg-purple-100 text-purple-800";
    case "quote_accepted":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
