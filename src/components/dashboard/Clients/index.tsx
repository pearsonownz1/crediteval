import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ClientsView: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center py-12 text-gray-500">
          Client management interface will be implemented in the future.
        </p>
      </CardContent>
    </Card>
  );
};
