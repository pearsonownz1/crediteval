import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { OrderStats } from "./OrderStats";
import { OrdersTable } from "./OrdersTable";
import { OrderDetails } from "./OrderDetails";
import { useOrders } from "../../../hooks/useOrders";
import { useSelection } from "../../../hooks/useSelection";
import { Order } from "../../../types/order-v1";

export const OrdersView: React.FC = () => {
  const { orders, loading, error, deleteOrders, stats } = useOrders();
  const {
    selectedKeys,
    isDeleting,
    setIsDeleting,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
  } = useSelection(orders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedKeys.length === 0)
      return alert("Please select orders to delete.");
    if (!window.confirm(`Delete ${selectedKeys.length} order(s)?`)) return;

    setIsDeleting(true);

    try {
      const result = await deleteOrders(selectedKeys);
      alert(result.message);
      clearSelection();
    } catch (err: any) {
      alert(`Error deleting orders: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <OrderStats
        pendingOrders={stats.pendingOrders}
        processingOrders={stats.processingOrders}
        completedOrders={stats.completedOrders}
        totalRevenue={stats.totalRevenue}
      />

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable
            orders={orders}
            loading={loading}
            error={error}
            selectedKeys={selectedKeys}
            isDeleting={isDeleting}
            handleSelectAll={handleSelectAll}
            handleSelectRow={handleSelectRow}
            handleDelete={handleDeleteSelected}
            handleRowClick={handleRowClick}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {orders.length} of {orders.length} orders
          </div>
        </CardFooter>
      </Card>

      <OrderDetails
        order={selectedOrder}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
};
