import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "../../common/StatusBadge";
import { DocumentLinks } from "../../common/DocumentLinks";
import { OrderActions } from "./OrderActions";
import { formatStatus } from "../../../utils/format";
import { Order } from "../../../types/order-v1";
import { Search, Filter, Trash2 } from "lucide-react";

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  selectedKeys: string[];
  isDeleting: boolean;
  handleSelectAll: (checked: boolean | "indeterminate") => void;
  handleSelectRow: (id: string, checked: boolean | "indeterminate") => void;
  handleDelete: () => void;
  handleRowClick: (order: Order) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  error,
  selectedKeys,
  isDeleting,
  handleSelectAll,
  handleSelectRow,
  handleDelete,
  handleRowClick,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">Orders List</div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-8 w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          {selectedKeys.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : `Delete (${selectedKeys.length})`}
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={
                  selectedKeys.length === orders.length && orders.length > 0
                    ? true
                    : selectedKeys.length > 0
                    ? "indeterminate"
                    : false
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all order rows"
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Loading orders...
              </TableCell>
            </TableRow>
          )}

          {error && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-red-500">
                Error: {error}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            !error &&
            orders
              .filter((order) => order.status !== "pending")
              .map((order) => (
                <TableRow key={order.id}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedKeys.includes(order.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(order.id, checked)
                      }
                      aria-label={`Select order row ${order.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div
                      className="flex items-center space-x-2 cursor-pointer hover:text-primary"
                      onClick={() => handleRowClick(order)}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {order.first_name?.charAt(0)}
                          {order.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {order.first_name} {order.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <DocumentLinks docPaths={order.document_paths} />
                  </TableCell>
                  <TableCell>
                    {typeof order.total_amount === "number"
                      ? `${(order.total_amount / 100).toFixed(2)}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <OrderActions order={order} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Showing {orders.length} of {orders.length} orders
        </div>
      </div>
    </div>
  );
};
