import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { ordersTable } from "../lib/ordersTable";
import { Order } from "../types/order";

const normalizeOrder = (order: any): Order => ({
  ...order,
  id: String(order.id),
  first_name: order.first_name || "",
  last_name: order.last_name || "",
  email: order.email || "",
  created_at: order.created_at || "",
  document_paths: Array.isArray(order.document_paths) ? order.document_paths : [],
  services:
    order.services && typeof order.services === "object" ? order.services : undefined,
});

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from(ordersTable)
        .select(
          "id, first_name, last_name, email, phone, company, status, document_paths, total_amount, created_at, services, stripe_payment_intent_id"
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setOrders((data || []).map(normalizeOrder));
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.details || err.message || "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOrders = async (ids: string[]) => {
    if (ids.length === 0)
      return { success: false, message: "No orders selected" };

    try {
      const { error: deleteError } = await supabase
        .from(ordersTable)
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

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: ordersTable },
        () => {
          void fetchOrders();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

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
