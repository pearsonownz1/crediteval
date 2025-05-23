import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Order } from "../types/order";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);

      // Log the first few orders to inspect total_amount
      if (data && data.length > 0) {
        console.log("Fetched Orders Data Sample (first 3):");
        data.slice(0, 3).forEach((order, index) => {
          console.log(
            `Order ${index + 1} ID: ${order.id}, Total Amount: ${
              order.total_amount
            }, Type: ${typeof order.total_amount}`
          );
        });
      } else {
        console.log("No orders data fetched.");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.details || err.message || "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrders = async (ids: string[]) => {
    if (ids.length === 0)
      return { success: false, message: "No orders selected" };

    try {
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .in("id", ids);

      if (deleteError) throw deleteError;
      await fetchOrders();
      return { success: true, message: `${ids.length} order(s) deleted.` };
    } catch (err: any) {
      const errorMessage =
        err.details || err.message || "Failed to delete orders.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Calculate stats
  const stats = {
    pendingOrders: orders.filter(
      (o) => o.status === "pending" || o.status === "pending_payment"
    ).length,
    processingOrders: orders.filter((o) => o.status === "processing").length,
    completedOrders: orders.filter((o) => o.status === "completed").length,
    totalRevenue:
      orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100,
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    deleteOrders,
    stats,
  };
};
