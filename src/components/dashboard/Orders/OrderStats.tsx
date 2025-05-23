import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderStatsProps {
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export const OrderStats: React.FC<OrderStatsProps> = ({
  pendingOrders,
  processingOrders,
  completedOrders,
  totalRevenue,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Pending Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{pendingOrders}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Processing Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{processingOrders}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Completed Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{completedOrders}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};
