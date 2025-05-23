import React from "react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "../../utils/format";
import { Status } from "../../types/common";

interface StatusBadgeProps {
  status: Status | string | null;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const displayText =
    label ||
    status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Unknown";

  return (
    <Badge className={getStatusColor(status)} variant="outline">
      {displayText}
    </Badge>
  );
};
